import { describe, expect, it } from 'bun:test'

import { recoverSession } from './session-recovery'

describe('recoverSession', () => {
  it('saves refreshed Busan credentials when a protected probe verifies the re-login', async () => {
    let savedCredentials: Record<string, string> | null = null
    const manager = {
      setCredentials: async (credentials: Record<string, string>) => {
        savedCredentials = credentials
      },
    }

    const recovered = await recoverSession(
      {
        sessionCookie: 'stale-session',
        csrfToken: 'stale-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'busan',
      },
      manager,
      () => ({
        login: async () => {},
        checkLogin: async () => null,
        verifySession: async () => true,
        getSessionCookie: () => 'fresh-session',
        getCsrfToken: () => 'fresh-csrf',
      }),
    )

    expect(recovered).toEqual({
      sessionCookie: 'fresh-session',
      csrfToken: 'fresh-csrf',
      username: 'mentor@example.com',
      password: 'secret',
      campus: 'busan',
      loggedInAt: expect.any(String),
    })
    expect(savedCredentials).toEqual(recovered)
  })
})
