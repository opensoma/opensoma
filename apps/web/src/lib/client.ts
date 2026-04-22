import { cookies } from 'next/headers'

import { AuthenticationError, SomaClient } from '@/lib/sdk'
import { clearStoredCredentialsIfWritable, readSessionTokens, readStoredCredentials } from '@/lib/session'
import { CREDENTIALS_COOKIE_NAME } from '@/lib/session-options'

export async function createClient(): Promise<SomaClient> {
  const tokens = await readSessionTokens()
  if (!tokens) {
    throw new AuthenticationError('Not authenticated')
  }

  const credentials = await loadStoredCredentialsSafely()

  return new SomaClient({
    sessionCookie: tokens.sessionCookie,
    csrfToken: tokens.csrfToken,
    username: credentials?.username,
    password: credentials?.password,
    verbose: process.env.OPENSOMA_VERBOSE === 'true',
  })
}

async function loadStoredCredentialsSafely() {
  const jar = await cookies()
  const hasRawCookie = Boolean(jar.get(CREDENTIALS_COOKIE_NAME)?.value)
  if (!hasRawCookie) return null

  const credentials = await readStoredCredentials()
  if (!credentials) {
    await clearStoredCredentialsIfWritable()
    return null
  }
  return credentials
}
