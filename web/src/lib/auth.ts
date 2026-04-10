import { redirect } from 'next/navigation'

import { SomaClient } from '~/lib/sdk'
import { getSession } from '~/lib/session'

export async function requireAuth(): Promise<SomaClient> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.sessionCookie || !session.csrfToken) {
    redirect('/login')
  }

  return new SomaClient({
    sessionCookie: session.sessionCookie,
    csrfToken: session.csrfToken,
  })
}
