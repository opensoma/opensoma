import { redirect } from 'next/navigation'

import { clearSessionTokens } from '@/lib/session'

export async function GET() {
  await clearSessionTokens()
  redirect('/login')
}
