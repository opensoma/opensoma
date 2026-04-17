import { createInterface, type Interface as ReadlineInterface } from 'node:readline'

import { Command } from 'commander'

import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import type { ExtractedSessionCandidate } from '../token-extractor'

function ask(rl: ReadlineInterface, message: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function promptPasswordTTY(message: string): Promise<string> {
  process.stdout.write(message)

  const stdin = process.stdin as typeof process.stdin & { setRawMode?: (mode: boolean) => void }
  if (stdin.setRawMode) {
    stdin.setRawMode(true)
  }
  stdin.resume()

  let password = ''

  try {
    return await new Promise<string>((resolve) => {
      const onData = (chunk: Buffer | string): void => {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
        for (const char of text) {
          const code = char.charCodeAt(0)
          if (code === 13 || code === 10) {
            // Enter key
            stdin.removeListener('data', onData)
            process.stdout.write('\n')
            resolve(password)
            return
          } else if (code === 3) {
            // Ctrl+C
            stdin.removeListener('data', onData)
            process.exit(1)
          } else if (code === 127 || code === 8) {
            // Backspace / Delete
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

      stdin.on('data', onData)
    })
  } finally {
    if (stdin.setRawMode) {
      stdin.setRawMode(false)
    }
    stdin.pause()
  }
}

async function promptCredentials(
  needUsername: boolean,
  needPassword: boolean,
): Promise<{ username?: string; password?: string }> {
  const result: { username?: string; password?: string } = {}

  if (needUsername) {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false })
    try {
      result.username = await ask(rl, 'Username: ')
    } finally {
      rl.close()
    }
  }

  if (needPassword) {
    if (process.stdin.isTTY) {
      result.password = await promptPasswordTTY('Password: ')
    } else {
      const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false })
      try {
        result.password = await ask(rl, 'Password: ')
      } finally {
        rl.close()
      }
    }
  }

  return result
}

type LoginOptions = { username?: string; password?: string; pretty?: boolean }
type StatusOptions = { pretty?: boolean }
type ExtractOptions = { debug?: boolean; pretty?: boolean }
type ExtractedSessionValidator = Pick<SomaHttp, 'checkLogin' | 'extractCsrfToken'>
type CredentialStore = Pick<CredentialManager, 'getCredentials' | 'remove' | 'setCredentials'>
type StatusValidator = Pick<SomaHttp, 'checkLogin'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>
type BrowserExtractor = () => Promise<{ csrfToken: string; sessionCookie: string } | null>

async function defaultExtractBrowserCredentials(): Promise<{ csrfToken: string; sessionCookie: string } | null> {
  const { TokenExtractor } = (await import('../token-extractor')) as {
    TokenExtractor: new () => { extractCandidates: () => Promise<ExtractedSessionCandidate[]> }
  }
  const candidates = await new TokenExtractor().extractCandidates()
  if (candidates.length === 0) return null
  return resolveExtractedCredentials(candidates)
}

const EXPIRED_SESSION_HINT = 'Session expired. Run: opensoma auth login or opensoma auth extract'
const UNVERIFIED_SESSION_HINT =
  'Could not verify session. Try again or run: opensoma auth login or opensoma auth extract'

export async function resolveExtractedCredentials(
  candidates: ExtractedSessionCandidate[],
  createValidator: (sessionCookie: string) => ExtractedSessionValidator = (sessionCookie) =>
    new SomaHttp({ sessionCookie }),
  debug?: (message: string) => void,
): Promise<{ csrfToken: string; sessionCookie: string } | null> {
  debug?.(`Validating ${candidates.length} candidate(s) against server...`)

  for (const candidate of candidates) {
    const http = createValidator(candidate.sessionCookie)
    debug?.(`  ${candidate.browser} / ${candidate.profile}: checkLogin...`)

    try {
      const valid = Boolean(await http.checkLogin())
      if (!valid) {
        debug?.(`  ${candidate.browser} / ${candidate.profile}: session invalid`)
        continue
      }

      debug?.(`  ${candidate.browser} / ${candidate.profile}: valid! Extracting CSRF token...`)
      const csrfToken = await http.extractCsrfToken()
      debug?.(`  CSRF token obtained (${csrfToken.length} chars)`)

      return {
        sessionCookie: candidate.sessionCookie,
        csrfToken,
      }
    } catch (error) {
      debug?.(
        `  ${candidate.browser} / ${candidate.profile}: error: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return null
}

async function loginAction(options: LoginOptions): Promise<void> {
  try {
    let username = options.username ?? process.env.OPENSOMA_USERNAME
    let password = options.password ?? process.env.OPENSOMA_PASSWORD

    const prompted = await promptCredentials(!username, !password)
    username ??= prompted.username
    password ??= prompted.password

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
  recoverViaBrowser: BrowserExtractor = defaultExtractBrowserCredentials,
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

    try {
      const extracted = await recoverViaBrowser()
      if (extracted) {
        const loggedInAt = new Date().toISOString()
        await manager.setCredentials({
          sessionCookie: extracted.sessionCookie,
          csrfToken: extracted.csrfToken,
          loggedInAt,
        })
        return { authenticated: true, valid: true, username: null, loggedInAt }
      }
    } catch {
      // Browser extraction failed — fall through to credential removal
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
  const log = options.debug ? (message: string) => process.stderr.write(`[extract] ${message}\n`) : undefined

  try {
    const { TokenExtractor } = (await import('../token-extractor')) as {
      TokenExtractor: new (options?: { debug?: boolean }) => {
        extractCandidates: () => Promise<ExtractedSessionCandidate[]>
      }
    }
    const extractor = new TokenExtractor({ debug: options.debug })
    const candidates = await extractor.extractCandidates()
    if (candidates.length === 0) {
      throw new Error(
        'No SWMaestro session found in any browser. Login to swmaestro.ai or opensoma.dev in a supported Chromium browser (Chrome, Edge, Brave, Arc, Vivaldi) first.',
      )
    }

    log?.(
      `Extracted ${candidates.length} candidate(s): ${candidates.map((c) => `${c.browser}/${c.profile}`).join(', ')}`,
    )

    const credentials = await resolveExtractedCredentials(candidates, undefined, log)
    if (!credentials) {
      throw new Error(
        'Found SWMaestro session cookies in supported browsers, but none are valid. Refresh your swmaestro.ai or opensoma.dev login in a supported Chromium browser and try again.',
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
      .option('--debug', 'Show debug output')
      .option('--pretty', 'Pretty print JSON output')
      .action(extractAction),
  )
