'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

import { SomaClient } from '@/lib/sdk'
import type { SessionData } from '@/lib/session'
import { sessionOptions } from '@/lib/session-options'

export interface LoginState {
  error: string
  redirectTo: string
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: '아이디와 비밀번호를 입력해주세요.', redirectTo: '' }
  }

  try {
    const client = new SomaClient({ username, password })
    await client.login()

    const loggedIn = await client.isLoggedIn()
    if (!loggedIn) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.', redirectTo: '' }
    }

    const sessionData = client.getSessionData()
    if (!sessionData.sessionCookie || !sessionData.csrfToken) {
      return { error: '로그인에 실패했습니다.', redirectTo: '' }
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.sessionCookie = sessionData.sessionCookie
    session.csrfToken = sessionData.csrfToken
    session.username = username
    session.isLoggedIn = true
    await session.save()
  } catch {
    return { error: '아이디 또는 비밀번호가 올바르지 않습니다.', redirectTo: '' }
  }

  return { error: '', redirectTo: '/dashboard' }
}
