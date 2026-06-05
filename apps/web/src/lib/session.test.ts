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

mock.module('next/headers', () => ({
  cookies: async () => cookieJar,
}))
mock.module('@/lib/sdk', () => ({ DEFAULT_SOMA_CAMPUS: 'seoul' }))

const { encryptCredentials, resetCredentialKeyCache } = await import('./credentials-crypto')
const { CAMPUS_COOKIE_NAME, CREDENTIALS_COOKIE_NAME } = await import('./session-options')
const { readActiveCampus } = await import('./session')

const SECRET_B64 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')

function storeLegacyCredentials(campus?: 'seoul' | 'busan') {
  const payload = campus
    ? { username: 'neo@example.com', password: 'secret', campus }
    : { username: 'neo@example.com', password: 'secret' }
  cookieJar.store.set(CREDENTIALS_COOKIE_NAME, encryptCredentials(payload as { username: string; password: string }))
}

describe('readActiveCampus', () => {
  beforeEach(() => {
    cookieJar.store.clear()
    process.env.OPENSOMA_CREDENTIAL_SECRET = SECRET_B64
    resetCredentialKeyCache()
  })

  it('prefers the campus cookie when present', async () => {
    cookieJar.store.set(CAMPUS_COOKIE_NAME, 'busan')
    storeLegacyCredentials('seoul')

    expect(await readActiveCampus()).toBe('busan')
  })

  it('falls back to a legacy Busan credential when no campus cookie exists', async () => {
    storeLegacyCredentials('busan')

    expect(await readActiveCampus()).toBe('busan')
  })

  it('defaults to Seoul when neither cookie carries a campus', async () => {
    storeLegacyCredentials()

    expect(await readActiveCampus()).toBe('seoul')
  })

  it('defaults to Seoul when no cookies are present at all', async () => {
    expect(await readActiveCampus()).toBe('seoul')
  })
})
