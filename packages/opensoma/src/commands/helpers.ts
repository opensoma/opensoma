import { DEFAULT_SOMA_CAMPUS, parseSomaCampus, type SomaCampus } from '../campus'
import { getCampusOverride } from '../campus-context'
import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import { isSessionValid, type SessionValidator } from '../session-validation'
import type { Credentials } from '../types'

type CredentialStore = Pick<
  CredentialManager,
  'clearSessionState' | 'getCredentials' | 'setCredentials' | 'setWarmSession'
>
type AuthenticatedHttp = SessionValidator
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'> &
  Partial<Pick<SomaHttp, 'verifySession'>>

const NOT_LOGGED_IN_MESSAGE = 'Not logged in. Run: opensoma auth login'
const STALE_SESSION_MESSAGE = 'Session expired. Run: opensoma auth login (saved id/password were preserved)'
const SEOUL_REPORT_SESSION_MESSAGE =
  'Mentoring reports are only available on the Seoul SWMaestro site. Stored id/password are required to open a separate Seoul session.'

function campusSessionMessage(campus: SomaCampus): string {
  return `Stored id/password are required to open a ${campus} SWMaestro session.`
}

function defaultCreateHttp(credentials: Credentials): SomaHttp {
  return new SomaHttp({
    sessionCookie: credentials.sessionCookie,
    csrfToken: credentials.csrfToken,
    campus: credentials.campus,
  })
}

export function createAuthenticatedHttp(): Promise<SomaHttp>
export function createAuthenticatedHttp(manager: CredentialStore): Promise<SomaHttp>
export function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore,
  createHttp: (credentials: Credentials) => T,
  createReloginHttp?: () => ReloginHttp,
): Promise<T>
export async function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore = new CredentialManager(),
  createHttp?: (credentials: Credentials) => T,
  createReloginHttp?: () => ReloginHttp,
): Promise<SomaHttp | T> {
  const creds = await manager.getCredentials()
  if (!creds) {
    throw new Error(NOT_LOGGED_IN_MESSAGE)
  }

  const http = createHttp ? createHttp(creds) : defaultCreateHttp(creds)

  const valid = await isSessionValid(http)
  if (!valid) {
    try {
      const reloginFactory = createReloginHttp ?? (() => new SomaHttp({ campus: creds.campus }))
      const refreshedCredentials = await recoverSession(creds, manager, reloginFactory)
      if (refreshedCredentials) {
        return createHttp ? createHttp(refreshedCredentials) : defaultCreateHttp(refreshedCredentials)
      }
    } catch {}

    await manager.clearSessionState()
    throw new Error(STALE_SESSION_MESSAGE)
  }

  return http
}

export async function createCampusAuthenticatedHttp(
  campus: SomaCampus,
  manager: CredentialStore = new CredentialManager(),
): Promise<SomaHttp> {
  const creds = await manager.getCredentials()
  if (!creds) {
    throw new Error(NOT_LOGGED_IN_MESSAGE)
  }

  if ((creds.campus ?? DEFAULT_SOMA_CAMPUS) === campus) {
    return await createAuthenticatedHttp(manager)
  }

  const warm = creds.campusSessions?.[campus]
  if (warm?.sessionCookie) {
    const warmHttp = new SomaHttp({ sessionCookie: warm.sessionCookie, csrfToken: warm.csrfToken, campus })
    try {
      if (await isSessionValid(warmHttp)) {
        return warmHttp
      }
    } catch {
      // Treat an unverifiable warm session as unusable and fall through to cold login.
    }
  }

  if (!creds.username || !creds.password) {
    throw new Error(campus === DEFAULT_SOMA_CAMPUS ? SEOUL_REPORT_SESSION_MESSAGE : campusSessionMessage(campus))
  }

  const http = new SomaHttp({ campus })
  await http.login(creds.username, creds.password)

  if (!(await http.verifySession())) {
    throw new Error(campus === DEFAULT_SOMA_CAMPUS ? SEOUL_REPORT_SESSION_MESSAGE : campusSessionMessage(campus))
  }

  const sessionCookie = http.getSessionCookie()
  const csrfToken = http.getCsrfToken()
  if (sessionCookie && csrfToken) {
    try {
      await manager.setWarmSession(campus, { sessionCookie, csrfToken, loggedInAt: new Date().toISOString() })
    } catch {
      // Caching the warm session is best-effort; never fail an authenticated request over it.
    }
  }

  return http
}

export function createSeoulAuthenticatedHttp(manager: CredentialStore = new CredentialManager()): Promise<SomaHttp> {
  return createCampusAuthenticatedHttp(DEFAULT_SOMA_CAMPUS, manager)
}

export function resolveExplicitCampus(): SomaCampus | undefined {
  const override = getCampusOverride()
  if (override) {
    return override
  }

  const fromEnv = process.env.OPENSOMA_CAMPUS?.trim()
  return fromEnv ? parseSomaCampus(fromEnv) : undefined
}

export async function getHttpOrExit(): Promise<SomaHttp> {
  try {
    const campus = resolveExplicitCampus()
    return campus ? await createCampusAuthenticatedHttp(campus) : await createAuthenticatedHttp()
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.message : STALE_SESSION_MESSAGE,
      }),
    )
    process.exit(1)
  }
}

export async function getSeoulHttpOrExit(): Promise<SomaHttp> {
  try {
    return await createSeoulAuthenticatedHttp()
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.message : STALE_SESSION_MESSAGE,
      }),
    )
    process.exit(1)
  }
}
