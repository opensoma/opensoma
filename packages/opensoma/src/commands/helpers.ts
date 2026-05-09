import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import type { Credentials } from '../types'

type CredentialStore = Pick<CredentialManager, 'clearSessionState' | 'getCredentials' | 'setCredentials'>
type AuthenticatedHttp = Pick<SomaHttp, 'checkLogin'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>

const NOT_LOGGED_IN_MESSAGE = 'Not logged in. Run: opensoma auth login'
const STALE_SESSION_MESSAGE = 'Session expired. Run: opensoma auth login (saved id/password were preserved)'

function defaultCreateHttp(credentials: Credentials): SomaHttp {
  return new SomaHttp({ sessionCookie: credentials.sessionCookie, csrfToken: credentials.csrfToken })
}

export function createAuthenticatedHttp(): Promise<SomaHttp>
export function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore,
  createHttp: (credentials: Credentials) => T,
  createReloginHttp?: () => ReloginHttp,
): Promise<T>
export async function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore = new CredentialManager(),
  createHttp?: (credentials: Credentials) => T,
  createReloginHttp: () => ReloginHttp = () => new SomaHttp(),
): Promise<SomaHttp | T> {
  const creds = await manager.getCredentials()
  if (!creds) {
    throw new Error(NOT_LOGGED_IN_MESSAGE)
  }

  const http = createHttp ? createHttp(creds) : defaultCreateHttp(creds)

  const identity = await http.checkLogin()
  if (!identity) {
    try {
      const refreshedCredentials = await recoverSession(creds, manager, createReloginHttp)
      if (refreshedCredentials) {
        return createHttp ? createHttp(refreshedCredentials) : defaultCreateHttp(refreshedCredentials)
      }
    } catch {}

    await manager.clearSessionState()
    throw new Error(STALE_SESSION_MESSAGE)
  }

  return http
}

export async function getHttpOrExit(): Promise<SomaHttp> {
  try {
    return await createAuthenticatedHttp()
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.message : STALE_SESSION_MESSAGE,
      }),
    )
    process.exit(1)
  }
}
