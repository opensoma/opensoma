import { AuthenticationError, SomaClient } from '@/lib/sdk'
import { getSession } from '@/lib/session'

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated'

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
): Promise<T> {
  if (!session.isLoggedIn || !session.sessionCookie || !session.csrfToken) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  let isValid = await client.isLoggedIn()
  if (!isValid && session.username && session.password) {
    try {
      await client.login()
      isValid = await client.isLoggedIn()
    } catch {
      throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
    }

    if (isValid) {
      const sessionData = client.getSessionData()
      if (!sessionData.sessionCookie || !sessionData.csrfToken) {
        throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
      }

      session.sessionCookie = sessionData.sessionCookie
      session.csrfToken = sessionData.csrfToken
      session.isLoggedIn = true
      await session.save()
    }
  }

  if (!isValid) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  return client
}

export async function createClient(): Promise<SomaClient> {
  const session = await getSession()
  const client = new SomaClient({
    sessionCookie: session.sessionCookie,
    csrfToken: session.csrfToken,
    username: session.username,
    password: session.password,
    verbose: process.env.OPENSOMA_VERBOSE === 'true',
  })

  return validateClientSession(session, client)
}
