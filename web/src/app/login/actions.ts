'use server'

import { redirect } from 'next/navigation'

import { SomaClient } from '~/lib/sdk'
import { getSession } from '~/lib/session'

export async function login(_prevState: { error: string }, formData: FormData): Promise<{ error: string }> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: '아이디와 비밀번호를 입력해주세요.' }
  }

  try {
    const client = new SomaClient({ username, password })
    await client.login()
    const sessionData = client.getSessionData()

    if (!sessionData.sessionCookie || !sessionData.csrfToken) {
      return { error: '로그인에 실패했습니다.' }
    }

    const session = await getSession()
    session.sessionCookie = sessionData.sessionCookie
    session.csrfToken = sessionData.csrfToken
    session.username = username
    session.isLoggedIn = true
    await session.save()
  } catch {
    return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/dashboard')
}
