import { beforeEach, describe, expect, it, mock } from 'bun:test'

interface FakeCookie {
  readonly value: string
}

const cookieJar = {
  store: new Map<string, string>(),
  get(name: string): FakeCookie | undefined {
    const value = this.store.get(name)
    return value === undefined ? undefined : { value }
  },
  set(name: string, value: string) {
    this.store.set(name, value)
  },
  delete(name: string) {
    this.store.delete(name)
  },
}

const constructedOptions: Array<Record<string, unknown>> = []

mock.module('next/headers', () => ({
  cookies: async () => cookieJar,
}))

mock.module('@/lib/sdk', () => {
  class AuthenticationError extends Error {
    override name = 'AuthenticationError'
  }
  class SomaClient {
    constructor(options: Record<string, unknown>) {
      constructedOptions.push(options)
    }
  }
  const parseSomaCampus = (value: string | null | undefined) => (value === 'busan' ? 'busan' : 'seoul')
  return { AuthenticationError, SomaClient, parseSomaCampus }
})

const { encryptCredentials, resetCredentialKeyCache } = await import('./credentials-crypto')
const { CREDENTIALS_COOKIE_NAME, CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } = await import('./session-options')
const { createClient } = await import('./client')

const SECRET_B64 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')

describe('createClient', () => {
  beforeEach(() => {
    cookieJar.store.clear()
    constructedOptions.length = 0
    process.env.OPENSOMA_CREDENTIAL_SECRET = SECRET_B64
    resetCredentialKeyCache()
  })

  it('passes the stored Busan campus into SomaClient', async () => {
    cookieJar.store.set(SESSION_COOKIE_NAME, 'sid-fresh')
    cookieJar.store.set(CSRF_COOKIE_NAME, 'csrf-fresh')
    cookieJar.store.set(
      CREDENTIALS_COOKIE_NAME,
      encryptCredentials({ username: 'neo@example.com', password: 'secret', campus: 'busan' }),
    )

    await expect(createClient()).resolves.toBeDefined()

    expect(constructedOptions[0]).toMatchObject({
      sessionCookie: 'sid-fresh',
      csrfToken: 'csrf-fresh',
      username: 'neo@example.com',
      password: 'secret',
      campus: 'busan',
    })
  })
})
