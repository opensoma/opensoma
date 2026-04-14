'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SomaClient } from '@/lib/sdk'
import type { SessionData } from '@/lib/session'
import { sessionOptions } from '@/lib/session-options'

export async function logout() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (session.sessionCookie && session.csrfToken) {
    const client = new SomaClient({
      sessionCookie: session.sessionCookie,
      csrfToken: session.csrfToken,
    })

    try {
      await client.logout()
    } catch {}
  }

  session.destroy()
  redirect('/login')
}
