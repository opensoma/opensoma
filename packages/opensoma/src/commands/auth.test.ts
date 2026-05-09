import { describe, expect, it } from 'bun:test'

import { inspectStoredAuthStatus } from './auth'

describe('inspectStoredAuthStatus', () => {
  it('clears session state but preserves saved id/password when re-login fails', async () => {
    let cleared = false
    const postClearCredentials = {
      sessionCookie: '',
      csrfToken: '',
      username: 'mentor@example.com',
      password: 'secret-password',
    }

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => {
          if (cleared) return postClearCredentials
          return {
            sessionCookie: 'stale-session',
            csrfToken: 'csrf-token',
            username: 'mentor@example.com',
            password: 'secret-password',
          }
        },
        setCredentials: async () => {
          throw new Error('inspectStoredAuthStatus must not write credentials directly on the failure path')
        },
        clearSessionState: async () => {
          cleared = true
        },
      },
      () => ({
        checkLogin: async () => null,
      }),
      () => ({
        login: async () => {},
        checkLogin: async () => null,
        getSessionCookie: () => null,
        getCsrfToken: () => null,
      }),
    )

    expect(status).toEqual({
      authenticated: false,
      credentials: null,
      clearedStaleSession: true,
      preservedRecoveryCredentials: true,
      hint: 'Session expired. Run: opensoma auth login',
    })
    expect(cleared).toBe(true)
  })

  it('reports preservedRecoveryCredentials=false when no recovery material was stored', async () => {
    let cleared = false

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => {
          if (cleared) return null
          return {
            sessionCookie: 'stale-session',
            csrfToken: 'csrf-token',
          }
        },
        setCredentials: async () => {
          throw new Error('should not write credentials')
        },
        clearSessionState: async () => {
          cleared = true
        },
      },
      () => ({
        checkLogin: async () => null,
      }),
    )

    expect(status).toEqual({
      authenticated: false,
      credentials: null,
      clearedStaleSession: true,
      preservedRecoveryCredentials: false,
      hint: 'Session expired. Run: opensoma auth login',
    })
  })

  it('preserves credentials when session verification fails unexpectedly', async () => {
    let cleared = false

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => ({
          sessionCookie: 'maybe-valid-session',
          csrfToken: 'csrf-token',
          username: 'mentor@example.com',
          loggedInAt: '2026-04-13T00:00:00.000Z',
        }),
        setCredentials: async () => {
          throw new Error('should not rewrite credentials when verification fails')
        },
        clearSessionState: async () => {
          cleared = true
        },
      },
      () => ({
        checkLogin: async () => {
          throw new Error('network error')
        },
      }),
    )

    expect(status).toEqual({
      authenticated: true,
      valid: false,
      username: 'mentor@example.com',
      loggedInAt: '2026-04-13T00:00:00.000Z',
      hint: 'Could not verify session. Try again or run: opensoma auth login',
    })
    expect(cleared).toBe(false)
  })

  it('refreshes the session automatically when stored username and password are available', async () => {
    let savedCredentials: Record<string, string> | null = null

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => ({
          sessionCookie: 'stale-session',
          csrfToken: 'stale-csrf',
          username: 'mentor@example.com',
          password: 'secret',
          loggedInAt: '2026-04-13T00:00:00.000Z',
        }),
        setCredentials: async (credentials: Record<string, string>) => {
          savedCredentials = credentials
        },
        clearSessionState: async () => {
          throw new Error('should not clear session state when re-login succeeds')
        },
      },
      () => ({
        checkLogin: async () => null,
      }),
      () => ({
        login: async () => {},
        checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
        getSessionCookie: () => 'fresh-session',
        getCsrfToken: () => 'fresh-csrf',
      }),
    )

    expect(status).toEqual({
      authenticated: true,
      valid: true,
      username: 'mentor@example.com',
      loggedInAt: expect.any(String),
    })
    expect(savedCredentials).toMatchObject({
      sessionCookie: 'fresh-session',
      csrfToken: 'fresh-csrf',
      username: 'mentor@example.com',
      password: 'secret',
    })
  })
})
