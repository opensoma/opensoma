import { cookies } from 'next/headers'

import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/session-options'

export interface SessionTokens {
  sessionCookie: string
  csrfToken: string
}

export async function readSessionTokens(): Promise<SessionTokens | null> {
  const jar = await cookies()
  const sessionCookie = jar.get(SESSION_COOKIE_NAME)?.value
  const csrfToken = jar.get(CSRF_COOKIE_NAME)?.value
  if (!sessionCookie || !csrfToken) return null
  return { sessionCookie, csrfToken }
}

export async function writeSessionTokens(tokens: SessionTokens): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, tokens.sessionCookie, sessionCookieOptions)
  jar.set(CSRF_COOKIE_NAME, tokens.csrfToken, sessionCookieOptions)
}

export async function clearSessionTokens(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE_NAME)
  jar.delete(CSRF_COOKIE_NAME)
}
