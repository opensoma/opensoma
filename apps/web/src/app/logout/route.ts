import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { authDebug } from '@/lib/auth-debug'
import type { SessionData } from '@/lib/session'
import { sessionOptions } from '@/lib/session-options'

export async function GET() {
  const jar = await cookies()
  const session = await getIronSession<SessionData>(jar, sessionOptions)
  authDebug.emit('logout_route_hit', {
    hadSessionCookie: jar.has(sessionOptions.cookieName),
    hadLoggedIn: Boolean(session.isLoggedIn),
    hadJid: authDebug.redactJid(session.sessionCookie),
  })
  session.destroy()
  redirect('/login')
}
