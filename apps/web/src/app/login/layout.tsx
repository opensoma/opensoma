import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { readSessionTokens } from '@/lib/session'

export const metadata: Metadata = {
  title: '로그인',
}

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const tokens = await readSessionTokens()
  if (tokens) {
    redirect('/dashboard')
  }
  return children
}
