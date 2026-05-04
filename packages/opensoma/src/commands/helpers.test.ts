import { describe, expect, it } from 'bun:test'

import { createAuthenticatedHttp } from './helpers'

const noBrowserExtraction = async () => null

describe('createAuthenticatedHttp', () => {
  it('throws a login hint when no credentials are stored', async () => {
    const manager = {
      getCredentials: async () => null,
      clearSessionState: async () => {},
    }

    await expect(createAuthenticatedHttp(manager)).rejects.toThrow(
      'Not logged in. Run: opensoma auth login or opensoma auth extract',
    )
  })

  it('clears only session state (not username/password) when both recovery methods fail', async () => {
    let cleared = false
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'stale-session',
        csrfToken: 'csrf-token',
        username: 'mentor@example.com',
        password: 'secret-password',
      }),
      setCredentials: async () => {
        throw new Error('createAuthenticatedHttp must not write credentials directly')
      },
      clearSessionState: async () => {
        cleared = true
      },
    }

    await expect(
      createAuthenticatedHttp(manager, () => ({ checkLogin: async () => null }), undefined, noBrowserExtraction),
    ).rejects.toThrow(
      'Session expired. Run: opensoma auth login or opensoma auth extract (saved id/password were preserved)',
    )
    expect(cleared).toBe(true)
  })

  it('preserves stored id/password on disk when session expires and recovery fails', async () => {
    const { CredentialManager } = await import('../credential-manager')
    const { mkdtemp, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')

    const dir = await mkdtemp(join(tmpdir(), 'opensoma-helpers-'))
    try {
      const manager = new CredentialManager(dir)
      await manager.setCredentials({
        sessionCookie: 'stale-session',
        csrfToken: 'stale-csrf',
        username: 'mentor@example.com',
        password: 'secret-password',
        loggedInAt: '2026-04-09T00:00:00.000Z',
      })

      await expect(
        createAuthenticatedHttp(
          manager,
          () => ({ checkLogin: async () => null }),
          () => ({
            login: async () => {
              throw new Error('upstream rejected re-login')
            },
            checkLogin: async () => null,
            getSessionCookie: () => null,
            getCsrfToken: () => null,
          }),
          noBrowserExtraction,
        ),
      ).rejects.toThrow('Session expired')

      const after = await manager.getCredentials()
      expect(after).toEqual({
        sessionCookie: '',
        csrfToken: '',
        username: 'mentor@example.com',
        password: 'secret-password',
      })
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  })

  it('returns the authenticated http client when the session is valid', async () => {
    const http = {
      checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
      get: async () => '',
    }
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'valid-session',
        csrfToken: 'csrf-token',
      }),
      setCredentials: async () => {
        throw new Error('should not rewrite valid credentials')
      },
      clearSessionState: async () => {
        throw new Error('should not clear session state for valid credentials')
      },
    }

    await expect(createAuthenticatedHttp(manager, () => http)).resolves.toBe(http)
  })

  it('re-authenticates automatically when stored username and password are available', async () => {
    let savedCredentials: Record<string, string> | null = null
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'stale-session',
        csrfToken: 'stale-csrf',
        username: 'mentor@example.com',
        password: 'secret',
      }),
      setCredentials: async (credentials: Record<string, string>) => {
        savedCredentials = credentials
      },
      clearSessionState: async () => {
        throw new Error('should not clear session state when re-login succeeds')
      },
    }
    const recoveredHttp = {
      checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
      get: async () => '',
    }

    await expect(
      createAuthenticatedHttp(
        manager,
        (credentials) => {
          if (credentials.sessionCookie === 'fresh-session') {
            return recoveredHttp
          }

          return {
            checkLogin: async () => null,
          }
        },
        () => ({
          login: async () => {},
          checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
          getSessionCookie: () => 'fresh-session',
          getCsrfToken: () => 'fresh-csrf',
        }),
      ),
    ).resolves.toBe(recoveredHttp)

    expect(savedCredentials).toMatchObject({
      sessionCookie: 'fresh-session',
      csrfToken: 'fresh-csrf',
      username: 'mentor@example.com',
      password: 'secret',
    })
  })

  it('recovers via browser extraction when no stored password is available', async () => {
    let savedCredentials: Record<string, unknown> | null = null
    const manager = {
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
    }
    const recoveredHttp = {
      checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
    }

    const result = await createAuthenticatedHttp(
      manager,
      (credentials) => {
        if (credentials.sessionCookie === 'browser-session') return recoveredHttp
        return { checkLogin: async () => null }
      },
      undefined,
      async () => ({ sessionCookie: 'browser-session', csrfToken: 'browser-csrf' }),
    )

    expect(result).toBe(recoveredHttp)
    expect(savedCredentials).toMatchObject({
      sessionCookie: 'browser-session',
      csrfToken: 'browser-csrf',
    })
    expect(savedCredentials).toHaveProperty('loggedInAt')
  })

  it('falls back to browser extraction when password re-login fails', async () => {
    let savedCredentials: Record<string, unknown> | null = null
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'stale-session',
        csrfToken: 'stale-csrf',
        username: 'mentor@example.com',
        password: 'wrong-password',
      }),
      setCredentials: async (credentials: Record<string, unknown>) => {
        savedCredentials = credentials
      },
      clearSessionState: async () => {
        throw new Error('should not clear session state when browser extraction succeeds')
      },
    }
    const recoveredHttp = {
      checkLogin: async () => ({ userId: 'mentor@example.com', userNm: 'Mentor One' }),
    }

    const result = await createAuthenticatedHttp(
      manager,
      (credentials) => {
        if (credentials.sessionCookie === 'browser-session') return recoveredHttp
        return { checkLogin: async () => null }
      },
      () => ({
        login: async () => {
          throw new Error('wrong password')
        },
        checkLogin: async () => null,
        getSessionCookie: () => null,
        getCsrfToken: () => null,
      }),
      async () => ({ sessionCookie: 'browser-session', csrfToken: 'browser-csrf' }),
    )

    expect(result).toBe(recoveredHttp)
    expect(savedCredentials).toMatchObject({
      sessionCookie: 'browser-session',
      csrfToken: 'browser-csrf',
    })
  })

  it('skips browser extraction when no credentials exist', async () => {
    let browserExtractionCalled = false
    const manager = {
      getCredentials: async () => null,
      setCredentials: async () => {
        throw new Error('should not save')
      },
      clearSessionState: async () => {},
    }

    await expect(
      createAuthenticatedHttp(
        manager,
        () => ({ checkLogin: async () => null }),
        undefined,
        async () => {
          browserExtractionCalled = true
          return { sessionCookie: 's', csrfToken: 'c' }
        },
      ),
    ).rejects.toThrow('Not logged in')
    expect(browserExtractionCalled).toBe(false)
  })
})
