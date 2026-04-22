import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

class RedirectSignal extends Error {
  constructor(public readonly target: string) {
    super(`NEXT_REDIRECT:${target}`)
  }
}

interface FakeCookie {
  value: string
}
const cookieJar = {
  store: new Map<string, string>(),
  get(name: string): FakeCookie | undefined {
    const v = this.store.get(name)
    return v === undefined ? undefined : { value: v }
  },
  set(name: string, value: string) {
    this.store.set(name, value)
  },
  delete(name: string) {
    this.store.delete(name)
  },
}

interface FakeClientState {
  loginImpl?: (username: string, password: string) => Promise<void> | void
  sessionData?: { sessionCookie: string | undefined; csrfToken: string | null }
}
const clientState: FakeClientState = {}

mock.module('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))
mock.module('next/headers', () => ({
  cookies: async () => cookieJar,
}))
mock.module('@/lib/sdk', () => {
  class AuthenticationError extends Error {
    override name = 'AuthenticationError'
  }
  class SomaClient {
    private username: string
    private password: string
    constructor(options: { username: string; password: string }) {
      this.username = options.username
      this.password = options.password
    }
    async login() {
      await clientState.loginImpl?.(this.username, this.password)
    }
    getSessionData() {
      return clientState.sessionData ?? { sessionCookie: 'sid-fresh', csrfToken: 'csrf-fresh' }
    }
  }
  return { AuthenticationError, SomaClient }
})

const { resetCredentialKeyCache } = await import('@/lib/credentials-crypto')
const { CREDENTIALS_COOKIE_NAME, CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } = await import('@/lib/session-options')
const { login } = await import('./actions')

const SECRET_B64 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')

function buildFormData(username: string, password: string): FormData {
  const fd = new FormData()
  fd.set('username', username)
  fd.set('password', password)
  return fd
}

describe('login action', () => {
  beforeEach(() => {
    cookieJar.store.clear()
    clientState.loginImpl = undefined
    clientState.sessionData = undefined
    process.env.OPENSOMA_CREDENTIAL_SECRET = SECRET_B64
    resetCredentialKeyCache()
  })
  afterEach(() => mock.restore())

  it('writes session tokens and credentials cookie on successful login', async () => {
    const thrown = await login({ error: '' }, buildFormData('neo@example.com', 'secret')).catch((e: unknown) => e)

    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/dashboard')
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-fresh')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-fresh')
    expect(cookieJar.store.has(CREDENTIALS_COOKIE_NAME)).toBe(true)

    const enc = cookieJar.store.get(CREDENTIALS_COOKIE_NAME)!
    expect(enc.split('.').length).toBe(3)
    expect(enc).not.toContain('secret')
  })

  it('returns wrong-credentials error on SWMaestro login failure, without writing any cookies', async () => {
    clientState.loginImpl = async () => {
      throw new Error('upstream said no')
    }

    const result = await login({ error: '' }, buildFormData('neo@example.com', 'wrong'))

    expect(result).toEqual({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' })
    expect(cookieJar.store.size).toBe(0)
  })

  it('does not surface an error when credential-cookie encryption fails post-login', async () => {
    const originalKey = process.env.OPENSOMA_CREDENTIAL_SECRET
    let preCheckStarted = false
    clientState.loginImpl = async () => {
      preCheckStarted = true
      delete process.env.OPENSOMA_CREDENTIAL_SECRET
      resetCredentialKeyCache()
    }

    const thrown = await login({ error: '' }, buildFormData('neo@example.com', 'secret')).catch((e: unknown) => e)

    expect(preCheckStarted).toBe(true)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/dashboard')
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-fresh')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-fresh')
    expect(cookieJar.store.has(CREDENTIALS_COOKIE_NAME)).toBe(false)

    process.env.OPENSOMA_CREDENTIAL_SECRET = originalKey
    resetCredentialKeyCache()
  })

  it('returns input-missing error when form is empty', async () => {
    const result = await login({ error: '' }, buildFormData('', ''))
    expect(result).toEqual({ error: '아이디와 비밀번호를 입력해주세요.' })
    expect(cookieJar.store.size).toBe(0)
  })
})
