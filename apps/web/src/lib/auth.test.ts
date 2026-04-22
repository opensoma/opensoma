import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

class RedirectSignal extends Error {
  constructor(public readonly target: string) {
    super(`NEXT_REDIRECT:${target}`)
  }
}

interface FakeCookie {
  value: string
}

interface CookieJar {
  store: Map<string, string>
  writable: boolean
  get(name: string): FakeCookie | undefined
  set(name: string, value: string): void
  delete(name: string): void
}

const cookieJar: CookieJar = {
  store: new Map<string, string>(),
  writable: true,
  get(name: string) {
    const value = this.store.get(name)
    return value === undefined ? undefined : { value }
  },
  set(name: string, value: string) {
    if (!this.writable) throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    this.store.set(name, value)
  },
  delete(name: string) {
    if (!this.writable) throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    this.store.delete(name)
  },
}

const headerBag = new Map<string, string>()

mock.module('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))
mock.module('next/headers', () => ({
  cookies: async () => cookieJar,
  headers: async () => ({ get: (name: string) => headerBag.get(name.toLowerCase()) ?? null }),
}))

import type { SomaClient } from '@/lib/sdk'

const { AuthenticationError } = await import('@/lib/sdk')
const { wrapWithAuthRedirect } = await import('./auth')
const { encryptCredentials, resetCredentialKeyCache } = await import('./credentials-crypto')
const { CREDENTIALS_COOKIE_NAME, CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } = await import('./session-options')

const SECRET_B64 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')

function resetState() {
  cookieJar.store.clear()
  cookieJar.writable = true
  headerBag.clear()
  process.env.OPENSOMA_CREDENTIAL_SECRET = SECRET_B64
  resetCredentialKeyCache()
}

function storeCredentialsCookie(username = 'neo@example.com', password = 'secret') {
  cookieJar.store.set(CREDENTIALS_COOKIE_NAME, encryptCredentials({ username, password }))
}

interface FakeClientConfig {
  sessionCookie?: string
  csrfToken?: string | null
  nextSessionCookie?: string
  nextCsrfToken?: string | null
  mentoringGet?: (id: number) => Promise<unknown>
  loginImpl?: (username: string, password: string) => Promise<void>
}

function makeClient(config: FakeClientConfig = {}): SomaClient {
  let session = config.sessionCookie ?? 'sid-original'
  let csrf: string | null = config.csrfToken === undefined ? 'csrf-original' : config.csrfToken

  const client = {
    mentoring: {
      list: async () => ({ items: [] }),
      get: config.mentoringGet ?? (async () => ({ ok: true })),
      failRandomly: async () => {
        throw new Error('disk is on fire')
      },
    },
    getSessionData: () => ({ sessionCookie: session, csrfToken: csrf }),
    whoami: async () => ({ userId: 'u', userNm: 'n' }),
    login: async (username: string, password: string) => {
      if (config.loginImpl) {
        await config.loginImpl(username, password)
      }
      session = config.nextSessionCookie ?? 'sid-refreshed'
      csrf = config.nextCsrfToken === undefined ? 'csrf-refreshed' : config.nextCsrfToken
    },
  }
  return client as unknown as SomaClient
}

describe('wrapWithAuthRedirect', () => {
  beforeEach(resetState)
  afterEach(() => mock.restore())

  it('passes through successful namespace calls', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    await expect(wrapped.mentoring.list()).resolves.toEqual({ items: [] })
  })

  it('redirects to /logout when a namespace call throws AuthenticationError and no stored credentials exist', async () => {
    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('expired')
        },
      }),
    )
    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/logout')
  })

  it('rethrows non-AuthenticationError errors from namespace calls untouched', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    await expect(
      (wrapped.mentoring as unknown as { failRandomly: () => Promise<unknown> }).failRandomly(),
    ).rejects.toThrow('disk is on fire')
  })

  it('preserves synchronous top-level getters (no accidental async wrapping)', () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    const data = wrapped.getSessionData()
    expect(data).toEqual({ sessionCookie: 'sid-original', csrfToken: 'csrf-original' })
  })

  it('does not wrap top-level async methods (they bubble up unchanged)', async () => {
    const client = makeClient()
    ;(client as unknown as { whoami: () => Promise<unknown> }).whoami = async () => {
      throw new AuthenticationError('expired')
    }
    const wrapped = wrapWithAuthRedirect(client)
    await expect(wrapped.whoami()).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('persists refreshed session cookies after a successful call whose internal SDK relogin swapped them', async () => {
    const client = makeClient({ sessionCookie: 'sid-original', csrfToken: 'csrf-original' })
    let session = 'sid-original'
    let csrf = 'csrf-original'
    ;(client as unknown as { getSessionData: () => unknown }).getSessionData = () => ({
      sessionCookie: session,
      csrfToken: csrf,
    })
    ;(client.mentoring as unknown as { list: () => Promise<unknown> }).list = async () => {
      session = 'sid-refreshed'
      csrf = 'csrf-refreshed'
      return { items: [] }
    }

    const wrapped = wrapWithAuthRedirect(client)
    await wrapped.mentoring.list()

    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-refreshed')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-refreshed')
  })

  it('does not persist when the session cookies are unchanged', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    await wrapped.mentoring.list()
    expect(cookieJar.store.has(SESSION_COOKIE_NAME)).toBe(false)
  })

  it('recovers via manual re-login when a mid-call AuthenticationError fires and credentials are stored', async () => {
    storeCredentialsCookie()
    headerBag.set('referer', 'https://example.com/mentoring/42')
    headerBag.set('host', 'example.com')

    const loginCalls: string[] = []
    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('session died')
        },
        loginImpl: async (u, p) => {
          loginCalls.push(`${u}:${p}`)
        },
      }),
    )

    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/mentoring/42')
    expect(loginCalls).toEqual(['neo@example.com:secret'])
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-refreshed')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-refreshed')
  })

  it('falls back to /dashboard on recovery when referer is missing', async () => {
    storeCredentialsCookie()

    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('session died')
        },
      }),
    )

    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/dashboard')
  })

  it('falls back to /dashboard when referer is cross-origin', async () => {
    storeCredentialsCookie()
    headerBag.set('referer', 'https://attacker.example/mentoring/42')
    headerBag.set('host', 'example.com')

    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('session died')
        },
      }),
    )

    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect((thrown as RedirectSignal).target).toBe('/dashboard')
  })

  it('collapses leading slashes in the referer pathname to prevent protocol-relative open redirects', async () => {
    storeCredentialsCookie()
    headerBag.set('referer', 'https://example.com//attacker.example/anything')
    headerBag.set('host', 'example.com')

    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('session died')
        },
      }),
    )

    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    const target = (thrown as RedirectSignal).target
    expect(target.startsWith('/')).toBe(true)
    expect(target.startsWith('//')).toBe(false)
    expect(target).toBe('/attacker.example/anything')
  })

  it('clears all auth cookies and redirects to /login on recovery failure', async () => {
    storeCredentialsCookie()
    cookieJar.store.set(SESSION_COOKIE_NAME, 'stale-sid')
    cookieJar.store.set(CSRF_COOKIE_NAME, 'stale-csrf')

    const wrapped = wrapWithAuthRedirect(
      makeClient({
        mentoringGet: async () => {
          throw new AuthenticationError('session died')
        },
        loginImpl: async () => {
          throw new Error('bad credentials')
        },
      }),
    )

    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/login?error=auth-recovery-failed')
    expect(cookieJar.store.has(SESSION_COOKIE_NAME)).toBe(false)
    expect(cookieJar.store.has(CSRF_COOKIE_NAME)).toBe(false)
    expect(cookieJar.store.has(CREDENTIALS_COOKIE_NAME)).toBe(false)
  })

  it('does not throw when cookie writes are not allowed (Server Component render)', async () => {
    cookieJar.writable = false
    const client = makeClient({ sessionCookie: 'sid-original', csrfToken: 'csrf-original' })
    let session = 'sid-original'
    let csrf = 'csrf-original'
    ;(client as unknown as { getSessionData: () => unknown }).getSessionData = () => ({
      sessionCookie: session,
      csrfToken: csrf,
    })
    ;(client.mentoring as unknown as { list: () => Promise<unknown> }).list = async () => {
      session = 'sid-refreshed'
      csrf = 'csrf-refreshed'
      return { items: [] }
    }

    const wrapped = wrapWithAuthRedirect(client)
    await expect(wrapped.mentoring.list()).resolves.toEqual({ items: [] })
  })
})
