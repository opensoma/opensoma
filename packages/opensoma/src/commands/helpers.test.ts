import { describe, expect, test } from 'bun:test'

import { createAuthenticatedHttp } from './helpers'

describe('createAuthenticatedHttp', () => {
  test('throws a login hint when no credentials are stored', async () => {
    const manager = {
      getCredentials: async () => null,
      remove: async () => {},
    }

    await expect(createAuthenticatedHttp(manager)).rejects.toThrow(
      'Not logged in. Run: opensoma auth login or opensoma auth extract',
    )
  })

  test('clears stale credentials when the stored session is invalid', async () => {
    let removed = false
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'stale-session',
        csrfToken: 'csrf-token',
      }),
      remove: async () => {
        removed = true
      },
    }

    await expect(
      createAuthenticatedHttp(manager, () => ({
        checkLogin: async () => null,
      })),
    ).rejects.toThrow(
      'Session expired. Saved credentials were cleared. Run: opensoma auth login or opensoma auth extract',
    )
    expect(removed).toBe(true)
  })

  test('returns the authenticated http client when the session is valid', async () => {
    const http = {
      checkLogin: async () => ({ userId: 'neo@example.com', userNm: '전수열' }),
      get: async () => '',
    }
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'valid-session',
        csrfToken: 'csrf-token',
      }),
      remove: async () => {
        throw new Error('should not remove valid credentials')
      },
    }

    await expect(createAuthenticatedHttp(manager, () => http)).resolves.toBe(http)
  })
})
