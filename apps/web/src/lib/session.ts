import { cookies } from 'next/headers'

import { decryptCredentials, encryptCredentials, type StoredCredentials } from '@/lib/credentials-crypto'
import {
  CREDENTIALS_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/session-options'

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

export async function writeSessionTokensIfWritable(tokens: SessionTokens): Promise<boolean> {
  try {
    await writeSessionTokens(tokens)
    return true
  } catch {
    return false
  }
}

export async function readStoredCredentials(): Promise<StoredCredentials | null> {
  const jar = await cookies()
  const token = jar.get(CREDENTIALS_COOKIE_NAME)?.value
  if (!token) return null
  return decryptCredentials(token)
}

export async function writeStoredCredentials(credentials: StoredCredentials): Promise<void> {
  const encoded = encryptCredentials(credentials)
  const jar = await cookies()
  jar.set(CREDENTIALS_COOKIE_NAME, encoded, sessionCookieOptions)
}

export async function clearStoredCredentialsIfWritable(): Promise<void> {
  try {
    const jar = await cookies()
    jar.delete(CREDENTIALS_COOKIE_NAME)
  } catch {}
}

export async function clearSessionTokens(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE_NAME)
  jar.delete(CSRF_COOKIE_NAME)
  jar.delete(CREDENTIALS_COOKIE_NAME)
}
