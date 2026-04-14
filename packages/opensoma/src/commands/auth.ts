import { Command } from 'commander'

import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import type { ExtractedSessionCandidate } from '../token-extractor'

async function promptInput(message: string): Promise<string> {
  process.stdout.write(message)
  const input = await Bun.stdin.text()
  return input.trim()
}

async function promptPassword(message: string): Promise<string> {
  process.stdout.write(message)

  const originalStdin = process.stdin.isTTY
    ? (process.stdin as typeof process.stdin & { setRawMode?: (mode: boolean) => void })
    : null

  if (originalStdin?.setRawMode) {
    originalStdin.setRawMode(true)
  }

  let password = ''
  const decoder = new TextDecoder()

  try {
    for await (const chunk of Bun.stdin.stream()) {
      const text = decoder.decode(chunk)
      for (const char of text) {
        const code = char.charCodeAt(0)
        if (code === 13 || code === 10) {
          // Enter key
          process.stdout.write('\n')
          return password
        } else if (code === 3) {
          // Ctrl+C
          process.exit(1)
        } else if (code === 127) {
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1)
            process.stdout.write('\b \b')
          }
        } else if (code >= 32 && code <= 126) {
          // Printable characters
          password += char
          process.stdout.write('*')
        }
      }
    }
  } finally {
    if (originalStdin?.setRawMode) {
      originalStdin.setRawMode(false)
    }
  }

  return password
}

type LoginOptions = { username?: string; password?: string; pretty?: boolean }
type StatusOptions = { pretty?: boolean }
type ExtractOptions = { pretty?: boolean }
type ExtractedSessionValidator = Pick<SomaHttp, 'checkLogin' | 'extractCsrfToken'>
type CredentialStore = Pick<CredentialManager, 'getCredentials' | 'remove' | 'setCredentials'>
type StatusValidator = Pick<SomaHttp, 'checkLogin'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>

const EXPIRED_SESSION_HINT = 'Session expired. Run: opensoma auth login or opensoma auth extract'
const UNVERIFIED_SESSION_HINT =
  'Could not verify session. Try again or run: opensoma auth login or opensoma auth extract'

export async function resolveExtractedCredentials(
  candidates: ExtractedSessionCandidate[],
  createValidator: (sessionCookie: string) => ExtractedSessionValidator = (sessionCookie) =>
    new SomaHttp({ sessionCookie }),
): Promise<{ csrfToken: string; sessionCookie: string } | null> {
  for (const candidate of candidates) {
    const http = createValidator(candidate.sessionCookie)

    try {
      const valid = Boolean(await http.checkLogin())
      if (!valid) {
        continue
      }

      return {
        sessionCookie: candidate.sessionCookie,
        csrfToken: await http.extractCsrfToken(),
      }
    } catch {}
  }

  return null
}

async function loginAction(options: LoginOptions): Promise<void> {
  try {
    let username = options.username ?? process.env.OPENSOMA_USERNAME
    let password = options.password ?? process.env.OPENSOMA_PASSWORD

    if (!username) {
      username = await promptInput('Username: ')
    }
    if (!password) {
      password = await promptPassword('Password: ')
    }

    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    const http = new SomaHttp()
    await http.login(username, password)

    const csrfToken = http.getCsrfToken()
    if (!csrfToken) {
      throw new Error('Login succeeded but CSRF token is missing')
    }

    const valid = Boolean(await http.checkLogin())
    if (!valid) {
      throw new Error('Login succeeded but session is not valid')
    }

    const sessionCookie = http.getSessionCookie()
    if (!sessionCookie) {
      throw new Error('Login succeeded but session cookie is missing')
    }

    await new CredentialManager().setCredentials({
      sessionCookie,
      csrfToken,
      username,
      password,
      loggedInAt: new Date().toISOString(),
    })

    console.log(formatOutput({ ok: true, username, loggedIn: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function logoutAction(options: StatusOptions): Promise<void> {
  try {
    const manager = new CredentialManager()
    const credentials = await manager.getCredentials()
    let upstreamLoggedOut = false

    if (credentials) {
      const http = new SomaHttp({ sessionCookie: credentials.sessionCookie, csrfToken: credentials.csrfToken })

      try {
        await http.logout()
        upstreamLoggedOut = true
      } catch {}
    }

    await manager.remove()
    console.log(formatOutput({ ok: true, loggedIn: false, upstreamLoggedOut }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export async function inspectStoredAuthStatus(
  manager: CredentialStore = new CredentialManager(),
  createValidator: (credentials: { sessionCookie: string; csrfToken: string }) => StatusValidator = (credentials) =>
    new SomaHttp({ sessionCookie: credentials.sessionCookie, csrfToken: credentials.csrfToken }),
  createReloginHttp: () => ReloginHttp = () => new SomaHttp(),
): Promise<Record<string, boolean | null | string>> {
  const creds = await manager.getCredentials()
  if (!creds) {
    return { authenticated: false, credentials: null }
  }

  let identity = null
  try {
    identity = await createValidator(creds).checkLogin()
  } catch {
    return {
      authenticated: true,
      valid: false,
      username: creds.username ?? null,
      loggedInAt: creds.loggedInAt ?? null,
      hint: UNVERIFIED_SESSION_HINT,
    }
  }

  if (!identity) {
    try {
      const refreshedCredentials = await recoverSession(creds, manager, createReloginHttp)
      if (refreshedCredentials) {
        return {
          authenticated: true,
          valid: true,
          username: refreshedCredentials.username ?? null,
          loggedInAt: refreshedCredentials.loggedInAt ?? null,
        }
      }
    } catch {
      return {
        authenticated: true,
        valid: false,
        username: creds.username ?? null,
        loggedInAt: creds.loggedInAt ?? null,
        hint: UNVERIFIED_SESSION_HINT,
      }
    }

    await manager.remove()
    return {
      authenticated: false,
      credentials: null,
      clearedStaleCredentials: true,
      hint: EXPIRED_SESSION_HINT,
    }
  }

  return {
    authenticated: true,
    valid: true,
    username: creds.username ?? null,
    loggedInAt: creds.loggedInAt ?? null,
  }
}

async function statusAction(options: StatusOptions): Promise<void> {
  try {
    console.log(formatOutput(await inspectStoredAuthStatus(), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function extractAction(options: ExtractOptions): Promise<void> {
  try {
    const { TokenExtractor } = (await import('../token-extractor')) as {
      TokenExtractor: new () => { extractCandidates: () => Promise<ExtractedSessionCandidate[]> }
    }
    const extractor = new TokenExtractor()
    const candidates = await extractor.extractCandidates()
    if (candidates.length === 0) {
      throw new Error(
        'No SWMaestro session found in any browser. Login to swmaestro.ai in a supported Chromium browser (Chrome, Edge, Brave, Arc, Vivaldi) first.',
      )
    }

    const credentials = await resolveExtractedCredentials(candidates)
    if (!credentials) {
      throw new Error(
        'Found SWMaestro session cookies in supported browsers, but none are valid. Refresh your swmaestro.ai login in a supported Chromium browser and try again.',
      )
    }

    await new CredentialManager().setCredentials({
      sessionCookie: credentials.sessionCookie,
      csrfToken: credentials.csrfToken,
      loggedInAt: new Date().toISOString(),
    })
    console.log(formatOutput({ ok: true, extracted: true, valid: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const authCommand = new Command('auth')
  .description('Manage authentication')
  .addCommand(
    new Command('login')
      .description('Login with username and password')
      .option('--username <username>', 'SWMaestro username')
      .option('--password <password>', 'SWMaestro password')
      .option('--pretty', 'Pretty print JSON output')
      .action(loginAction),
  )
  .addCommand(
    new Command('logout')
      .description('Log out upstream session and remove saved credentials')
      .option('--pretty', 'Pretty print JSON output')
      .action(logoutAction),
  )
  .addCommand(
    new Command('status')
      .description('Show authentication status')
      .option('--pretty', 'Pretty print JSON output')
      .action(statusAction),
  )
  .addCommand(
    new Command('extract')
      .description('Extract browser credentials')
      .option('--pretty', 'Pretty print JSON output')
      .action(extractAction),
  )
