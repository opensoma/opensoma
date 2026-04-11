import { Command } from 'commander'

import { CredentialManager } from '../credential-manager'
import { SomaHttp } from '../http'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { warn } from '../shared/utils/stderr'

type LoginOptions = { username?: string; password?: string; pretty?: boolean }
type StatusOptions = { pretty?: boolean }
type ExtractOptions = { pretty?: boolean }

async function loginAction(options: LoginOptions): Promise<void> {
  try {
    const username = options.username ?? process.env.OPENSOMA_USERNAME
    const password = options.password ?? process.env.OPENSOMA_PASSWORD
    if (!username || !password) {
      throw new Error('Provide --username and --password or set OPENSOMA_USERNAME and OPENSOMA_PASSWORD')
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
      loggedInAt: new Date().toISOString(),
    })

    console.log(formatOutput({ ok: true, username, loggedIn: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function logoutAction(options: StatusOptions): Promise<void> {
  try {
    await new CredentialManager().remove()
    console.log(formatOutput({ ok: true, loggedIn: false }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function statusAction(options: StatusOptions): Promise<void> {
  try {
    const manager = new CredentialManager()
    const creds = await manager.getCredentials()
    if (!creds) {
      console.log(formatOutput({ authenticated: false, credentials: null }, options.pretty))
      return
    }

    let valid = false
    try {
      const http = new SomaHttp({ sessionCookie: creds.sessionCookie, csrfToken: creds.csrfToken })
      valid = Boolean(await http.checkLogin())
    } catch {
      valid = false
    }

    console.log(
      formatOutput(
        {
          authenticated: true,
          valid,
          username: creds.username ?? null,
          loggedInAt: creds.loggedInAt ?? null,
          ...(valid ? {} : { hint: 'Session expired. Run: opensoma auth login or opensoma auth extract' }),
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function extractAction(options: ExtractOptions): Promise<void> {
  try {
    const { TokenExtractor } = (await import('../token-extractor')) as {
      TokenExtractor: new () => { extract: () => Promise<{ sessionCookie: string } | null> }
    }
    const extractor = new TokenExtractor()
    const result = await extractor.extract()
    if (!result) {
      throw new Error(
        'No SWMaestro session found in any browser. Login to swmaestro.ai in a supported Chromium browser (Chrome, Edge, Brave, Arc, Vivaldi) first.',
      )
    }

    const http = new SomaHttp({ sessionCookie: result.sessionCookie })

    let valid = false
    let csrfToken: string | undefined
    try {
      valid = Boolean(await http.checkLogin())
      if (valid) {
        csrfToken = await http.extractCsrfToken()
      }
    } catch {
      valid = false
    }

    if (!valid) {
      warn('Warning: Could not validate session. Cookies may be expired.')
    }

    await new CredentialManager().setCredentials({
      sessionCookie: result.sessionCookie,
      csrfToken: csrfToken ?? '',
      loggedInAt: new Date().toISOString(),
    })
    console.log(formatOutput({ ok: true, extracted: true, valid }, options.pretty))
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
      .description('Remove saved credentials')
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
