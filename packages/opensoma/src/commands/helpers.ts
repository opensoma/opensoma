import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import * as stderr from '../shared/utils/stderr'
import type { Credentials } from '../types'

type CredentialStore = Pick<CredentialManager, 'clearSessionState' | 'getCredentials' | 'setCredentials'>
type AuthenticatedHttp = Pick<SomaHttp, 'checkLogin'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>
type BrowserExtractor = () => Promise<{ csrfToken: string; sessionCookie: string } | null>

const NOT_LOGGED_IN_MESSAGE = 'Not logged in. Run: opensoma auth login or opensoma auth extract'
const STALE_SESSION_MESSAGE =
  'Session expired. Run: opensoma auth login or opensoma auth extract (saved id/password were preserved)'

function defaultCreateHttp(credentials: Credentials): SomaHttp {
  return new SomaHttp({ sessionCookie: credentials.sessionCookie, csrfToken: credentials.csrfToken })
}

async function defaultExtractBrowserCredentials(): Promise<{ csrfToken: string; sessionCookie: string } | null> {
  const { TokenExtractor } = await import('../token-extractor')
  const { resolveExtractedCredentials } = await import('./auth')
  const candidates = await new TokenExtractor().extractCandidates()
  if (candidates.length === 0) return null
  return resolveExtractedCredentials(candidates)
}

export function createAuthenticatedHttp(): Promise<SomaHttp>
export function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore,
  createHttp: (credentials: Credentials) => T,
  createReloginHttp?: () => ReloginHttp,
  recoverViaBrowser?: BrowserExtractor,
): Promise<T>
export async function createAuthenticatedHttp<T extends AuthenticatedHttp>(
  manager: CredentialStore = new CredentialManager(),
  createHttp?: (credentials: Credentials) => T,
  createReloginHttp: () => ReloginHttp = () => new SomaHttp(),
  recoverViaBrowser: BrowserExtractor = defaultExtractBrowserCredentials,
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
    } catch {
      // Password recovery failed — try browser extraction next
    }

    try {
      stderr.info('Session expired. Attempting browser token extraction...')
      const extracted = await recoverViaBrowser()
      if (extracted) {
        const browserCredentials: Credentials = {
          sessionCookie: extracted.sessionCookie,
          csrfToken: extracted.csrfToken,
          loggedInAt: new Date().toISOString(),
        }
        await manager.setCredentials(browserCredentials)
        stderr.info('Browser token extraction successful.')
        return createHttp ? createHttp(browserCredentials) : defaultCreateHttp(browserCredentials)
      }
    } catch {
      // Browser extraction also failed
    }

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
