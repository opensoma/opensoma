import { AuthenticationError, SomaClient } from '@/lib/sdk'
import { readSessionTokens } from '@/lib/session'

export async function createClient(): Promise<SomaClient> {
  const tokens = await readSessionTokens()
  if (!tokens) {
    throw new AuthenticationError('Not authenticated')
  }

  return new SomaClient({
    sessionCookie: tokens.sessionCookie,
    csrfToken: tokens.csrfToken,
    verbose: process.env.OPENSOMA_VERBOSE === 'true',
  })
}
