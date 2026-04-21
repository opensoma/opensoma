import { AuthenticationError, SomaClient } from '@/lib/sdk'
import { readSessionTokens } from '@/lib/session'

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated'

type SessionLike = {
  sessionCookie?: string
  csrfToken?: string
}

export async function validateClientSession<T extends Pick<SomaClient, 'isLoggedIn'>>(
  session: SessionLike,
  client: T,
): Promise<T> {
  if (!session.sessionCookie || !session.csrfToken) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  if (!(await client.isLoggedIn())) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  return client
}

export async function createClient(): Promise<SomaClient> {
  const tokens = await readSessionTokens()
  if (!tokens) {
    throw new AuthenticationError(NOT_AUTHENTICATED_MESSAGE)
  }

  const client = new SomaClient({
    sessionCookie: tokens.sessionCookie,
    csrfToken: tokens.csrfToken,
    verbose: process.env.OPENSOMA_VERBOSE === 'true',
  })

  return validateClientSession(tokens, client)
}
