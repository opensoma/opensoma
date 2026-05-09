import { createInterface, type Interface as ReadlineInterface } from 'node:readline'

import { Command } from 'commander'

import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { recoverSession } from '../session-recovery'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'

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
type CredentialStore = Pick<CredentialManager, 'clearSessionState' | 'getCredentials' | 'setCredentials'>
type StatusValidator = Pick<SomaHttp, 'checkLogin'>
type ReloginHttp = Pick<SomaHttp, 'checkLogin' | 'getCsrfToken' | 'getSessionCookie' | 'login'>

const EXPIRED_SESSION_HINT = 'Session expired. Run: opensoma auth login'
const UNVERIFIED_SESSION_HINT = 'Could not verify session. Try again or run: opensoma auth login'

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

    await manager.clearSessionState()
    const post = await manager.getCredentials()
    return {
      authenticated: false,
      credentials: null,
      clearedStaleSession: true,
      preservedRecoveryCredentials: Boolean(post?.username || post?.password),
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
