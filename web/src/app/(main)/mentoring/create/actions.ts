'use server'

import { redirect } from 'next/navigation'

import { createClient } from '~/lib/client'

interface CreateMentoringState {
  error: string
}

export async function createMentoring(
  _prevState: CreateMentoringState,
  formData: FormData,
): Promise<CreateMentoringState> {
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

  try {
    const client = await createClient()
    await client.mentoring.create({
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
    return { error: error instanceof Error ? error.message : '멘토링 등록에 실패했습니다.' }
  }

  redirect('/mentoring')
}
