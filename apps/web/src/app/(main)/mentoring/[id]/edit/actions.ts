'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/client'
import { AuthenticationError } from '@/lib/sdk'

interface UpdateMentoringState {
  error: string
}

export async function updateMentoring(
  id: number,
  _prevState: UpdateMentoringState,
  formData: FormData,
): Promise<UpdateMentoringState> {
  const title = String(formData.get('title') ?? '').trim()
  const type = String(formData.get('type') ?? '')
  const date = String(formData.get('date') ?? '')
  const startTime = String(formData.get('startTime') ?? '')
  const endTime = String(formData.get('endTime') ?? '')
  const venue = String(formData.get('venue') ?? '')
  const maxAttendees = String(formData.get('maxAttendees') ?? '')
  const regStart = String(formData.get('regStart') ?? '')
  const regEnd = String(formData.get('regEnd') ?? '')
  const content = String(formData.get('content') ?? '').trim()

  if (!title || !type || !date || !startTime || !endTime || !venue) {
    return { error: '필수 항목을 모두 입력해주세요.' }
  }

  if (startTime >= endTime) {
    return { error: '종료 시간은 시작 시간보다 늦어야 합니다.' }
  }

  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/u
  if (emojiRegex.test(title)) {
    return { error: '제목에 이모지를 사용할 수 없습니다.' }
  }
  if (emojiRegex.test(content)) {
    return { error: '내용에 이모지를 사용할 수 없습니다.' }
  }

  try {
    const client = await createClient()
    await client.mentoring.update(id, {
      title,
      type: type === 'lecture' ? 'lecture' : 'public',
      date,
      startTime,
      endTime,
      venue,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      regStart: regStart || undefined,
      regEnd: regEnd || undefined,
      content: content || undefined,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '멘토링 수정에 실패했습니다.' }
  }

  redirect(`/mentoring/${id}`)
}
