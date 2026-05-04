import { describe, expect, it } from 'bun:test'

import { inspectStoredAuthStatus, resolveExtractedCredentials } from './auth'

const noBrowserExtraction = async () => null

describe('resolveExtractedCredentials', () => {
  it('returns the first candidate that validates successfully', async () => {
    const calls: string[] = []

    const credentials = await resolveExtractedCredentials(
      [
        { browser: 'Chrome', lastAccessUtc: 30, profile: 'Default', sessionCookie: 'stale-session' },
        { browser: 'Chrome', lastAccessUtc: 20, profile: 'Profile 1', sessionCookie: 'valid-session' },
      ],
      (sessionCookie) => ({
        checkLogin: async () => {
          calls.push(`check:${sessionCookie}`)
          return sessionCookie === 'valid-session' ? { userId: 'neo', userNm: 'Neo' } : null
        },
        extractCsrfToken: async () => {
          calls.push(`csrf:${sessionCookie}`)
          return `${sessionCookie}-csrf`
        },
      }),
    )

    expect(credentials).toEqual({
      sessionCookie: 'valid-session',
      csrfToken: 'valid-session-csrf',
    })
    expect(calls).toEqual(['check:stale-session', 'check:valid-session', 'csrf:valid-session'])
  })

  it('returns null when every candidate is invalid or throws', async () => {
    const credentials = await resolveExtractedCredentials(
      [
        { browser: 'Chrome', lastAccessUtc: 30, profile: 'Default', sessionCookie: 'stale-session' },
        { browser: 'Edge', lastAccessUtc: 20, profile: 'Profile 1', sessionCookie: 'broken-session' },
      ],
      (sessionCookie) => ({
        checkLogin: async () => {
          if (sessionCookie === 'broken-session') {
            throw new Error('network error')
          }

          return null
        },
        extractCsrfToken: async () => {
          throw new Error('should not be called')
        },
      }),
    )

    expect(credentials).toBeNull()
  })
})

describe('inspectStoredAuthStatus', () => {
  it('clears session state but preserves saved id/password when both recovery methods fail', async () => {
    let cleared = false
    let postClearCredentials = {
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
      noBrowserExtraction,
    )

    expect(status).toEqual({
      authenticated: false,
      credentials: null,
      clearedStaleSession: true,
      preservedRecoveryCredentials: true,
      hint: 'Session expired. Run: opensoma auth login or opensoma auth extract',
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
      undefined,
      noBrowserExtraction,
    )

    expect(status).toEqual({
      authenticated: false,
      credentials: null,
      clearedStaleSession: true,
      preservedRecoveryCredentials: false,
      hint: 'Session expired. Run: opensoma auth login or opensoma auth extract',
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
      hint: 'Could not verify session. Try again or run: opensoma auth login or opensoma auth extract',
    })
    expect(cleared).toBe(false)
  })

  it('recovers via browser extraction when no stored password is available', async () => {
    let savedCredentials: Record<string, unknown> | null = null

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => ({
          sessionCookie: 'stale-session',
          csrfToken: 'stale-csrf',
        }),
        setCredentials: async (credentials: Record<string, unknown>) => {
          savedCredentials = credentials
        },
        clearSessionState: async () => {
          throw new Error('should not clear session state when browser extraction succeeds')
        },
      },
      () => ({
        checkLogin: async () => null,
      }),
      undefined,
      async () => ({ sessionCookie: 'browser-session', csrfToken: 'browser-csrf' }),
    )

    expect(status).toMatchObject({
      authenticated: true,
      valid: true,
      username: null,
    })
    expect(savedCredentials).toMatchObject({
      sessionCookie: 'browser-session',
      csrfToken: 'browser-csrf',
    })
    expect(savedCredentials).toHaveProperty('loggedInAt')
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
