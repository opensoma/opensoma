import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import type { Credentials } from '../types'

type CredentialStore = Pick<CredentialManager, 'getCredentials' | 'remove'>
type AuthenticatedHttp = Pick<SomaHttp, 'checkLogin'>

const NOT_LOGGED_IN_MESSAGE = 'Not logged in. Run: opensoma auth login or opensoma auth extract'
const STALE_SESSION_MESSAGE =
  'Session expired. Saved credentials were cleared. Run: opensoma auth login or opensoma auth extract'

function defaultCreateHttp(credentials: Credentials): SomaHttp {
  return new SomaHttp({ sessionCookie: credentials.sessionCookie, csrfToken: credentials.csrfToken })
}

export function createAuthenticatedHttp(): Promise<SomaHttp>
export function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore,
  createHttp: (credentials: Credentials) => T,
): Promise<T>
export async function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore = new CredentialManager(),
  createHttp?: (credentials: Credentials) => T,
): Promise<SomaHttp | T> {
  const creds = await manager.getCredentials()
  if (!creds) {
    throw new Error(NOT_LOGGED_IN_MESSAGE)
  }

  const http = createHttp ? createHttp(creds) : defaultCreateHttp(creds)

  const identity = await http.checkLogin()
  if (!identity) {
    await manager.remove()
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
