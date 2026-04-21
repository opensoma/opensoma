'use server'

import { redirect } from 'next/navigation'

import { SomaClient } from '@/lib/sdk'
import { clearSessionTokens, readSessionTokens } from '@/lib/session'

export async function logout() {
  const tokens = await readSessionTokens()

  if (tokens) {
    const client = new SomaClient({
      sessionCookie: tokens.sessionCookie,
      csrfToken: tokens.csrfToken,
    })

    try {
      await client.logout()
    } catch {}
  }

  await clearSessionTokens()
  redirect('/login')
}
