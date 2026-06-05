import { afterEach, describe, expect, it, mock } from 'bun:test'

import { setCampusOverride } from '../campus-context'
import {
  createAuthenticatedHttp,
  createCampusAuthenticatedHttp,
  createSeoulAuthenticatedHttp,
  resolveExplicitCampus,
} from './helpers'

const originalFetch = globalThis.fetch
const originalEnvCampus = process.env.OPENSOMA_CAMPUS

afterEach(() => {
  globalThis.fetch = originalFetch
  setCampusOverride(undefined)
  if (originalEnvCampus === undefined) {
    delete process.env.OPENSOMA_CAMPUS
  } else {
    process.env.OPENSOMA_CAMPUS = originalEnvCampus
  }
  mock.restore()
})

describe('resolveExplicitCampus', () => {
  it('returns undefined when neither override nor OPENSOMA_CAMPUS is set', () => {
    setCampusOverride(undefined)
    delete process.env.OPENSOMA_CAMPUS
    expect(resolveExplicitCampus()).toBeUndefined()
  })

  it('honors OPENSOMA_CAMPUS when no per-command override is set', () => {
    setCampusOverride(undefined)
    process.env.OPENSOMA_CAMPUS = 'busan'
    expect(resolveExplicitCampus()).toBe('busan')
  })

  it('prefers the per-command override over OPENSOMA_CAMPUS', () => {
    setCampusOverride('seoul')
    process.env.OPENSOMA_CAMPUS = 'busan'
    expect(resolveExplicitCampus()).toBe('seoul')
  })
})

describe('createAuthenticatedHttp', () => {
  it('throws a login hint when no credentials are stored', async () => {
    const manager = {
      getCredentials: async () => null,
      clearSessionState: async () => {},
    }

    await expect(createAuthenticatedHttp(manager)).rejects.toThrow('Not logged in. Run: opensoma auth login')
  })

  it('clears only session state (not username/password) when re-login fails', async () => {
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

    await expect(createAuthenticatedHttp(manager, () => ({ checkLogin: async () => null }))).rejects.toThrow(
      'Session expired. Run: opensoma auth login (saved id/password were preserved)',
    )
    expect(cleared).toBe(true)
  })

  it('preserves stored id/password on disk when session expires and re-login fails', async () => {
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

  it('returns the authenticated HTTP client when a protected probe verifies the session', async () => {
    const http = {
      checkLogin: async () => null,
      verifySession: async () => true,
      get: async () => '',
    }
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'valid-busan-session',
        csrfToken: 'csrf-token',
        campus: 'busan',
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

  it('creates authenticated HTTP with the stored Busan campus', async () => {
    const fetchMock: typeof fetch = mock(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('https://www.swmaestro.ai/busan/sw/member/user/checkLogin.json')
      return new Response(
        JSON.stringify({
          userVO: {
            userId: 'mentor@example.com',
            userNm: 'Mentor One',
            userNo: 'mentor-1',
            userGb: 'T',
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    })
    globalThis.fetch = fetchMock

    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'valid-session',
        csrfToken: 'csrf-token',
        campus: 'busan',
      }),
      setCredentials: async () => {
        throw new Error('should not rewrite valid credentials')
      },
      clearSessionState: async () => {
        throw new Error('should not clear session state for valid credentials')
      },
    }

    await expect(createAuthenticatedHttp(manager)).resolves.toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-authenticates automatically when stored username and password are available', async () => {
    let savedCredentials: Record<string, string> | null = null
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'stale-session',
        csrfToken: 'stale-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'busan',
        tozName: 'Mentor One',
        tozPhone: '010-1234-5678',
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
      tozName: 'Mentor One',
      tozPhone: '010-1234-5678',
      campus: 'busan',
    })
  })

  it('opens a Seoul report session when the stored active campus is Busan', async () => {
    const urls: string[] = []
    const fetchMock: typeof fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input)
      urls.push(url)

      if (url.includes('/forLogin.do')) {
        return new Response('<form><input type="hidden" name="csrfToken" value="csrf-login"></form>')
      }
      if (url.includes('/toLogin.do')) {
        return new Response(
          '<form action="/sw/login.do"><input name="username" value="mentor@example.com"><input name="password" value="hashed-password"></form>',
        )
      }
      if (url.includes('/checkLogin.json')) {
        return new Response(
          JSON.stringify({
            userVO: {
              userId: 'mentor@example.com',
              userNm: 'Mentor One',
              userNo: 'mentor-1',
              userGb: 'T',
            },
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      }

      return new Response('<html>ok</html>')
    })
    globalThis.fetch = fetchMock

    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'busan-session',
        csrfToken: 'busan-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'busan',
      }),
      setCredentials: async () => {
        throw new Error('report helper must not overwrite the active Busan session')
      },
      clearSessionState: async () => {
        throw new Error('report helper must not clear the active Busan session')
      },
    }

    const http = await createSeoulAuthenticatedHttp(manager)
    await http.postMultipart('/mypage/mentoringReport/insert.do', new FormData())

    expect(urls.every((url) => !url.includes('/busan/sw/'))).toBe(true)
    expect(urls).toContain('https://www.swmaestro.ai/sw/mypage/mentoringReport/insert.do')
  })
})

describe('createCampusAuthenticatedHttp', () => {
  it('reuses a warm session for the target campus without cold-login', async () => {
    let fetchCount = 0
    const fetchMock: typeof fetch = mock(async (input: RequestInfo | URL) => {
      fetchCount += 1
      expect(String(input)).toBe('https://www.swmaestro.ai/busan/sw/member/user/checkLogin.json')
      return new Response(
        JSON.stringify({
          userVO: { userId: 'mentor@example.com', userNm: 'Mentor One', userNo: 'mentor-1', userGb: 'T' },
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    })
    globalThis.fetch = fetchMock

    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'seoul-session',
        csrfToken: 'seoul-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'seoul' as const,
        campusSessions: {
          busan: { sessionCookie: 'busan-warm', csrfToken: 'busan-csrf' },
        },
      }),
      setCredentials: async () => {
        throw new Error('warm-session reuse must not rewrite credentials')
      },
      clearSessionState: async () => {
        throw new Error('warm-session reuse must not clear credentials')
      },
      setWarmSession: async () => {
        throw new Error('warm-session reuse must not re-cache a session')
      },
    }

    await expect(createCampusAuthenticatedHttp('busan', manager)).resolves.toBeDefined()
    expect(fetchCount).toBe(1)
  })

  it('cold-logins for the target campus when no warm session exists', async () => {
    const urls: string[] = []
    const fetchMock: typeof fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input)
      urls.push(url)
      if (url.includes('/forLogin.do')) {
        return new Response('<form><input type="hidden" name="csrfToken" value="csrf-login"></form>')
      }
      if (url.includes('/toLogin.do')) {
        return new Response(
          '<form action="/busan/sw/login.do"><input name="username" value="mentor@example.com"><input name="password" value="hashed"></form>',
          { headers: { 'set-cookie': 'JSESSIONID=busan-fresh; Path=/' } },
        )
      }
      if (url.includes('/checkLogin.json')) {
        return new Response(
          JSON.stringify({
            userVO: { userId: 'mentor@example.com', userNm: 'Mentor One', userNo: 'mentor-1', userGb: 'T' },
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response('<html>ok</html>')
    })
    globalThis.fetch = fetchMock

    const warmed: Array<{ campus: string; sessionCookie: string }> = []
    const manager = {
      getCredentials: async () => ({
        sessionCookie: 'seoul-session',
        csrfToken: 'seoul-csrf',
        username: 'mentor@example.com',
        password: 'secret',
        campus: 'seoul' as const,
      }),
      setCredentials: async () => {},
      clearSessionState: async () => {},
      setWarmSession: async (campus: string, session: { sessionCookie: string; csrfToken: string }) => {
        warmed.push({ campus, sessionCookie: session.sessionCookie })
      },
    }

    await expect(createCampusAuthenticatedHttp('busan', manager)).resolves.toBeDefined()
    expect(urls.every((url) => url.includes('/busan/sw/'))).toBe(true)
    expect(warmed.map((w) => w.campus)).toEqual(['busan'])
  })
})
