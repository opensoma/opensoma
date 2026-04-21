export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev',
  cookieName: 'opensoma-session',
  ttl: 60 * 60 * 24 * 30,
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  },
}

export const SESSION_COOKIE_NAME = 'opensoma-jsessionid'
export const CSRF_COOKIE_NAME = 'opensoma-csrf'

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

export const sessionCookieOptions = {
  maxAge: THIRTY_DAYS_SECONDS,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}
