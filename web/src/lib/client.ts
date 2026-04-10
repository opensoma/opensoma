import { SomaClient } from '~/lib/sdk'
import { getSession } from '~/lib/session'

export async function createClient(): Promise<SomaClient> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.sessionCookie || !session.csrfToken) {
    throw new Error('Not authenticated')
  }

  return new SomaClient({
    sessionCookie: session.sessionCookie,
    csrfToken: session.csrfToken,
  })
}
