import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { randomBytes } from 'node:crypto'

import { decryptCredentials, encryptCredentials, resetCredentialKeyCache } from './credentials-crypto'

const ENV_VAR = 'OPENSOMA_CREDENTIAL_SECRET'

function setSecret(buf: Buffer | null): void {
  if (buf === null) {
    delete process.env[ENV_VAR]
  } else {
    process.env[ENV_VAR] = buf.toString('base64')
  }
  resetCredentialKeyCache()
}

describe('credentials-crypto', () => {
  const originalSecret = process.env[ENV_VAR]

  beforeEach(() => {
    setSecret(randomBytes(32))
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env[ENV_VAR]
    } else {
      process.env[ENV_VAR] = originalSecret
    }
    resetCredentialKeyCache()
  })

  it('round-trips credentials', () => {
    const encoded = encryptCredentials({ username: 'neo@example.com', password: 'p@ssw0rd!' })
    expect(decryptCredentials(encoded)).toEqual({ username: 'neo@example.com', password: 'p@ssw0rd!' })
  })

  it('produces a different ciphertext for each call (unique IVs)', () => {
    const a = encryptCredentials({ username: 'u', password: 'p' })
    const b = encryptCredentials({ username: 'u', password: 'p' })
    expect(a).not.toEqual(b)
  })

  it('returns null when the token is malformed', () => {
    expect(decryptCredentials('not-a-token')).toBeNull()
    expect(decryptCredentials('only.two')).toBeNull()
    expect(decryptCredentials('a.b.c.d')).toBeNull()
  })

  it('returns null when the ciphertext is tampered with', () => {
    const encoded = encryptCredentials({ username: 'u', password: 'p' })
    const [iv, tag, ct] = encoded.split('.')
    const tamperedCt = Buffer.from(ct!, 'base64url')
    tamperedCt[0] = tamperedCt[0] ^ 0xff
    const tampered = `${iv}.${tag}.${tamperedCt.toString('base64url')}`
    expect(decryptCredentials(tampered)).toBeNull()
  })

  it('rejects truncated AES-GCM auth tags (Node DEP0182)', () => {
    const encoded = encryptCredentials({ username: 'u', password: 'p' })
    const [iv, tag, ct] = encoded.split('.')
    const truncatedTag = Buffer.from(tag!, 'base64url').subarray(0, 4).toString('base64url')
    expect(decryptCredentials(`${iv}.${truncatedTag}.${ct}`)).toBeNull()
  })

  it('returns null when decrypted with a different key', () => {
    const encoded = encryptCredentials({ username: 'u', password: 'p' })
    setSecret(randomBytes(32))
    expect(decryptCredentials(encoded)).toBeNull()
  })

  it('throws when the secret is missing', () => {
    setSecret(null)
    expect(() => encryptCredentials({ username: 'u', password: 'p' })).toThrow(/OPENSOMA_CREDENTIAL_SECRET/)
  })

  it('throws when the secret is the wrong length', () => {
    process.env[ENV_VAR] = Buffer.from('too-short').toString('base64')
    resetCredentialKeyCache()
    expect(() => encryptCredentials({ username: 'u', password: 'p' })).toThrow(/32-byte/)
  })
})
