import { CredentialManager } from './credential-manager'
import { type UserIdentity, SomaHttp } from './http'
import type { Credentials } from './types'

type CredentialStore = Pick<CredentialManager, 'setCredentials'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>

export function canRecoverSession(credentials: Credentials): credentials is Credentials & {
  password: string
  username: string
} {
  return Boolean(credentials.username && credentials.password)
}

export async function recoverSession(
  credentials: Credentials,
  manager: CredentialStore = new CredentialManager(),
  createHttp: () => ReloginHttp = () => new SomaHttp(),
): Promise<Credentials | null> {
  if (!canRecoverSession(credentials)) {
    return null
  }

  const http = createHttp()
  await http.login(credentials.username, credentials.password)

  const identity = await http.checkLogin()
  if (!identity) {
    return null
  }

  const refreshedCredentials = buildRefreshedCredentials(credentials, identity, http)
  await manager.setCredentials(refreshedCredentials)
  return refreshedCredentials
}

function buildRefreshedCredentials(
  credentials: Credentials & { password: string; username: string },
  identity: UserIdentity,
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
    username: identity.userId || credentials.username,
    password: credentials.password,
    tozName: credentials.tozName,
    tozPhone: credentials.tozPhone,
    loggedInAt: new Date().toISOString(),
  }
}
