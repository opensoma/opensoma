'use server'

import { revalidatePath } from 'next/cache'

import { SomaClient, type SomaCampus } from '@/lib/sdk'
import { readActiveCampus, readStoredCredentials, writeActiveCampus, writeSessionTokens } from '@/lib/session'

interface SwitchCampusResult {
  error: string
}

export async function switchCampus(targetCampus: SomaCampus): Promise<SwitchCampusResult> {
  if (targetCampus !== 'seoul' && targetCampus !== 'busan') {
    return { error: '캠퍼스를 선택해주세요.' }
  }

  const currentCampus = await readActiveCampus()
  if (currentCampus === targetCampus) {
    return { error: '' }
  }

  const credentials = await readStoredCredentials()
  if (!credentials) {
    return { error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
  }

  const client = new SomaClient({
    username: credentials.username,
    password: credentials.password,
    campus: targetCampus,
  })

  try {
    await client.login()
  } catch {
    return { error: '캠퍼스 전환에 실패했습니다.' }
  }

  const session = client.getSessionData()
  if (!session.sessionCookie || !session.csrfToken) {
    return { error: '캠퍼스 전환에 실패했습니다.' }
  }

  await writeActiveCampus(targetCampus)
  await writeSessionTokens({
    sessionCookie: session.sessionCookie,
    csrfToken: session.csrfToken,
  })

  revalidatePath('/', 'layout')
  return { error: '' }
}
