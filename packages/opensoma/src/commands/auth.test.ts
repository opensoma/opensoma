import { afterEach, describe, expect, it, mock } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { CredentialManager } from '../credential-manager'
import { inspectStoredAuthStatus, resolveLoginCampus, switchCampus } from './auth'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

describe('resolveLoginCampus', () => {
  it('uses OPENSOMA_CAMPUS only when --campus is omitted', () => {
    expect(resolveLoginCampus(undefined, 'busan')).toBe('busan')
    expect(resolveLoginCampus('seoul', 'busan')).toBe('seoul')
    expect(resolveLoginCampus(undefined, undefined)).toBe('seoul')
  })
})

describe('switchCampus', () => {
  it('is a no-op when already on the target campus', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'opensoma-switch-'))
    try {
      const manager = new CredentialManager(dir)
      await manager.setCredentials({ sessionCookie: 's', csrfToken: 'c', campus: 'seoul' })

      globalThis.fetch = mock(async () => {
        throw new Error('no-op switch must not hit the network')
      })

      await expect(switchCampus('seoul', manager)).resolves.toEqual({ activeCampus: 'seoul', switched: false })
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  })

  it('promotes a warm session without cold-login and stashes the previous active session', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'opensoma-switch-'))
    try {
      const manager = new CredentialManager(dir)
      await manager.setCredentials({
        sessionCookie: 'seoul-session',
        csrfToken: 'seoul-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'seoul',
        campusSessions: { busan: { sessionCookie: 'busan-warm', csrfToken: 'busan-csrf' } },
      })

      const urls: string[] = []
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        urls.push(String(input))
        return new Response(
          JSON.stringify({
            userVO: { userId: 'mentor@example.com', userNm: 'Mentor One', userNo: 'm-1', userGb: 'T' },
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      })

      await expect(switchCampus('busan', manager)).resolves.toEqual({ activeCampus: 'busan', switched: true })
      expect(urls.every((url) => url.includes('/busan/sw/'))).toBe(true)

      const after = await manager.getCredentials()
      expect(after?.campus).toBe('busan')
      expect(after?.sessionCookie).toBe('busan-warm')
      expect(after?.campusSessions?.seoul?.sessionCookie).toBe('seoul-session')
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  })
})

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
      campus: 'seoul',
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
      campus: 'seoul',
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
      campus: 'seoul',
      hint: 'Could not verify session. Try again or run: opensoma auth login',
    })
    expect(cleared).toBe(false)
  })

  it('reports stored Busan credentials as valid when a protected probe verifies the session', async () => {
    let cleared = false

    const status = await inspectStoredAuthStatus(
      {
        getCredentials: async () => ({
          sessionCookie: 'busan-session',
          csrfToken: 'csrf-token',
          username: 'mentor@example.com',
          loggedInAt: '2026-04-13T00:00:00.000Z',
          campus: 'busan',
        }),
        setCredentials: async () => {
          throw new Error('should not rewrite valid credentials')
        },
        clearSessionState: async () => {
          cleared = true
        },
      },
      () => ({
        checkLogin: async () => null,
        verifySession: async () => true,
      }),
    )

    expect(status).toEqual({
      authenticated: true,
      valid: true,
      username: 'mentor@example.com',
      loggedInAt: '2026-04-13T00:00:00.000Z',
      campus: 'busan',
      warmCampuses: [],
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
          campus: 'busan',
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
      campus: 'busan',
      warmCampuses: [],
    })
    expect(savedCredentials).toMatchObject({
      sessionCookie: 'fresh-session',
      csrfToken: 'fresh-csrf',
      username: 'mentor@example.com',
      password: 'secret',
      campus: 'busan',
    })
  })
})
