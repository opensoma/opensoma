import { getIronSession } from 'iron-session'
import { NextResponse, type NextRequest } from 'next/server'

import type { SessionData } from '~/lib/session'
import { sessionOptions } from '~/lib/session-options'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|design).*)'],
}
