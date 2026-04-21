import { describe, expect, it } from 'bun:test'

import { AuthenticationError } from '@/lib/sdk'

import { validateClientSession } from './client'

describe('validateClientSession', () => {
  it('throws when the session cookie is missing', async () => {
    await expect(
      validateClientSession({ csrfToken: 'csrf-token' }, { isLoggedIn: async () => true }),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('throws when the csrf token is missing', async () => {
    await expect(
      validateClientSession({ sessionCookie: 'session-cookie' }, { isLoggedIn: async () => true }),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('throws when upstream auth is invalid', async () => {
    await expect(
      validateClientSession(
        { sessionCookie: 'session-cookie', csrfToken: 'csrf-token' },
        { isLoggedIn: async () => false },
      ),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('returns the client when both local and upstream auth are valid', async () => {
    const client = { isLoggedIn: async () => true }

    await expect(
      validateClientSession({ sessionCookie: 'session-cookie', csrfToken: 'csrf-token' }, client),
    ).resolves.toBe(client)
  })
})
