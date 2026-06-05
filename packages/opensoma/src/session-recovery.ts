import { CredentialManager } from './credential-manager'
import { type UserIdentity, SomaHttp } from './http'
import { isSessionValid } from './session-validation'
import type { Credentials } from './types'

type CredentialStore = Pick<CredentialManager, 'setCredentials'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'> &
  Partial<Pick<SomaHttp, 'verifySession'>>

export function canRecoverSession(credentials: Credentials): credentials is Credentials & {
  password: string
  username: string
} {
  return Boolean(credentials.username && credentials.password)
}

export async function recoverSession(
  credentials: Credentials,
  manager: CredentialStore = new CredentialManager(),
  createHttp?: () => ReloginHttp,
): Promise<Credentials | null> {
  if (!canRecoverSession(credentials)) {
    return null
  }

  const http = createHttp ? createHttp() : new SomaHttp({ campus: credentials.campus })
  await http.login(credentials.username, credentials.password)

  const valid = await isSessionValid(http)
  if (!valid) {
    return null
  }

  const identity = await http.checkLogin()
  const refreshedCredentials = buildRefreshedCredentials(credentials, identity, http)
  await manager.setCredentials(refreshedCredentials)
  return refreshedCredentials
}

function buildRefreshedCredentials(
  credentials: Credentials & { password: string; username: string },
  identity: UserIdentity | null,
  http: Pick<SomaHttp, 'getCsrfToken' | 'getSessionCookie'>,
): Credentials {
  const sessionCookie = http.getSessionCookie()
  const csrfToken = http.getCsrfToken()

  if (!sessionCookie || !csrfToken) {
    throw new Error('Automatic re-login succeeded but session state is incomplete')
  }

  return {
    sessionCookie,
    csrfToken,
    username: identity?.userId || credentials.username,
    password: credentials.password,
    campus: credentials.campus,
    tozName: credentials.tozName,
    tozPhone: credentials.tozPhone,
    loggedInAt: new Date().toISOString(),
  }
}
