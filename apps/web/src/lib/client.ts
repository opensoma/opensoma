import { authDebug } from '@/lib/auth-debug'
import { AuthenticationError, SomaClient } from '@/lib/sdk'
import { getSession } from '@/lib/session'

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated'
const AUTH_RECOVERY_ATTEMPTS = 2
const AUTH_RECOVERY_DELAY_MS = 250

type SessionLike = {
  isLoggedIn?: boolean
  sessionCookie?: string
  csrfToken?: string
  username?: string
  password?: string
  save(): Promise<void>
}

export async function validateClientSession<T extends Pick<SomaClient, 'getSessionData' | 'isLoggedIn' | 'login'>>(
  session: SessionLike,
  client: T,
  persistSession: boolean = true,
): Promise<T> {
  const startedAt = Date.now()
  if (!session.isLoggedIn || !session.sessionCookie || !session.csrfToken) {
    authDebug.emit('validate_no_session', {
      isLoggedIn: Boolean(session.isLoggedIn),
      hasCookie: Boolean(session.sessionCookie),
      hasCsrf: Boolean(session.csrfToken),
      persistSession,
    })
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  const oldJid = authDebug.redactJid(session.sessionCookie)
  const isValidFirst = await client.isLoggedIn()
  let isValid = isValidFirst
  let recoveryOutcome: 'none' | 'success' | 'failure' = 'none'

  if (!isValid && session.username && session.password) {
    recoveryOutcome = 'failure'
    isValid = await retryLogin(client)

    if (isValid) {
      recoveryOutcome = 'success'

      if (persistSession) {
        const sessionData = client.getSessionData()
        if (!sessionData.sessionCookie || !sessionData.csrfToken) {
          authDebug.emit('validate_missing_refreshed_data', { persistSession })
          throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
        }

        const newJid = authDebug.redactJid(sessionData.sessionCookie)
        session.sessionCookie = sessionData.sessionCookie
        session.csrfToken = sessionData.csrfToken
        session.isLoggedIn = true
        await saveSessionIfWritable(session, { oldJid, newJid })
      }
    }
  }

  authDebug.emit('validate_finished', {
    persistSession,
    firstCheckValid: isValidFirst,
    recovery: recoveryOutcome,
    finalValid: isValid,
    oldJid,
    ms: Date.now() - startedAt,
    user: authDebug.redactUser(session.username),
  })

  if (!isValid) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  return client
}

async function retryLogin(client: Pick<SomaClient, 'isLoggedIn' | 'login'>): Promise<boolean> {
  for (let attempt = 1; attempt <= AUTH_RECOVERY_ATTEMPTS; attempt += 1) {
    const attemptStarted = Date.now()
    let caughtMessage: string | undefined
    try {
      await client.login()
      if (await client.isLoggedIn()) {
        authDebug.emit('retry_login_attempt', {
          attempt,
          outcome: 'success',
          ms: Date.now() - attemptStarted,
        })
        return true
      }
      authDebug.emit('retry_login_attempt', {
        attempt,
        outcome: 'login_ok_but_not_logged_in',
        ms: Date.now() - attemptStarted,
      })
    } catch (error) {
      caughtMessage = error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120)
      authDebug.emit('retry_login_attempt', {
        attempt,
        outcome: 'threw',
        err: caughtMessage,
        ms: Date.now() - attemptStarted,
      })
      // Retry once before forcing a logout because SWMaestro can transiently reject re-auth.
    }

    if (attempt < AUTH_RECOVERY_ATTEMPTS) {
      await delay(AUTH_RECOVERY_DELAY_MS)
    }
  }

  authDebug.emit('retry_login_exhausted', { attempts: AUTH_RECOVERY_ATTEMPTS })
  return false
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

// Next.js disallows cookie writes outside of Server Actions and Route Handlers.
// When auth recovery runs inside a Server Component render, session.save() throws
// a read-only cookies error. Swallow that specific error so the render can
// continue with the refreshed in-memory credentials; the next Server Action or
// Route Handler request will persist the fresh session.
async function saveSessionIfWritable(
  session: Pick<SessionLike, 'save'>,
  context: { oldJid: string; newJid: string },
): Promise<void> {
  try {
    await session.save()
    authDebug.emit('session_save_ok', { oldJid: context.oldJid, newJid: context.newJid })
  } catch (error) {
    if (isReadOnlyCookiesError(error)) {
      authDebug.emit('session_save_swallowed_readonly', {
        oldJid: context.oldJid,
        newJid: context.newJid,
      })
      return
    }
    authDebug.emit('session_save_threw', {
      oldJid: context.oldJid,
      newJid: context.newJid,
      err: error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120),
    })
    throw error
  }
}

function isReadOnlyCookiesError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.message.includes('Cookies can only be modified in a Server Action or Route Handler')
}

export async function createClient(persistSession: boolean = true): Promise<SomaClient> {
  authDebug.emit('create_client_enter', { persistSession })
  const session = await getSession()
  const client = new SomaClient({
    sessionCookie: session.sessionCookie,
    csrfToken: session.csrfToken,
    username: session.username,
    password: session.password,
    verbose: process.env.OPENSOMA_VERBOSE === 'true',
  })

  return validateClientSession(session, client, persistSession)
}
