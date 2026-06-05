export const SESSION_COOKIE_NAME = 'opensoma-jsessionid'
export const CSRF_COOKIE_NAME = 'opensoma-csrf'
export const CREDENTIALS_COOKIE_NAME = 'opensoma-credentials'
export const CAMPUS_COOKIE_NAME = 'opensoma-campus'

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

export const sessionCookieOptions = {
  maxAge: THIRTY_DAYS_SECONDS,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}
