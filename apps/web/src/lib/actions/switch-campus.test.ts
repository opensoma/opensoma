import { beforeEach, describe, expect, it, mock } from 'bun:test'

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
  loginImpl?: () => Promise<void> | void
  sessionData?: { sessionCookie: string | undefined; csrfToken: string | null }
  constructedCampus?: string
  revalidated: string[]
}
const clientState: FakeClientState = { revalidated: [] }

mock.module('next/headers', () => ({
  cookies: async () => cookieJar,
}))
mock.module('next/cache', () => ({
  revalidatePath: (path: string) => {
    clientState.revalidated.push(path)
  },
}))
mock.module('@/lib/sdk', () => {
  class AuthenticationError extends Error {
    override name = 'AuthenticationError'
  }
  class SomaClient {
    constructor(options: { campus?: string }) {
      clientState.constructedCampus = options.campus
    }
    async login() {
      await clientState.loginImpl?.()
    }
    getSessionData() {
      return clientState.sessionData ?? { sessionCookie: 'sid-busan', csrfToken: 'csrf-busan' }
    }
  }
  return { AuthenticationError, SomaClient, DEFAULT_SOMA_CAMPUS: 'seoul' }
})

const { encryptCredentials, resetCredentialKeyCache } = await import('@/lib/credentials-crypto')
const { CAMPUS_COOKIE_NAME, CREDENTIALS_COOKIE_NAME, CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } =
  await import('@/lib/session-options')
const { switchCampus } = await import('./switch-campus')

const SECRET_B64 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')

function seedCredentials() {
  cookieJar.store.set(SESSION_COOKIE_NAME, 'sid-seoul')
  cookieJar.store.set(CSRF_COOKIE_NAME, 'csrf-seoul')
  cookieJar.store.set(CAMPUS_COOKIE_NAME, 'seoul')
  cookieJar.store.set(CREDENTIALS_COOKIE_NAME, encryptCredentials({ username: 'neo@example.com', password: 'secret' }))
}

describe('switchCampus', () => {
  beforeEach(() => {
    cookieJar.store.clear()
    clientState.loginImpl = undefined
    clientState.sessionData = undefined
    clientState.constructedCampus = undefined
    clientState.revalidated = []
    process.env.OPENSOMA_CREDENTIAL_SECRET = SECRET_B64
    resetCredentialKeyCache()
  })

  it('re-authenticates the target campus and commits the new session', async () => {
    seedCredentials()

    const result = await switchCampus('busan')

    expect(result).toEqual({ error: '' })
    expect(clientState.constructedCampus).toBe('busan')
    expect(cookieJar.store.get(CAMPUS_COOKIE_NAME)).toBe('busan')
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-busan')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-busan')
    expect(clientState.revalidated).toContain('/')
  })

  it('is a no-op when the target campus is already active', async () => {
    seedCredentials()

    const result = await switchCampus('seoul')

    expect(result).toEqual({ error: '' })
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-seoul')
    expect(clientState.constructedCampus).toBeUndefined()
  })

  it('leaves the current session untouched when the target login fails', async () => {
    seedCredentials()
    clientState.loginImpl = async () => {
      throw new Error('upstream rejected')
    }

    const result = await switchCampus('busan')

    expect(result.error).not.toBe('')
    expect(cookieJar.store.get(CAMPUS_COOKIE_NAME)).toBe('seoul')
    expect(cookieJar.store.get(SESSION_COOKIE_NAME)).toBe('sid-seoul')
    expect(cookieJar.store.get(CSRF_COOKIE_NAME)).toBe('csrf-seoul')
  })

  it('asks the user to re-login when credentials are missing', async () => {
    cookieJar.store.set(CAMPUS_COOKIE_NAME, 'seoul')

    const result = await switchCampus('busan')

    expect(result.error).not.toBe('')
    expect(cookieJar.store.get(CAMPUS_COOKIE_NAME)).toBe('seoul')
  })
})
