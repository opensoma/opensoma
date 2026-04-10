'use server'

import { createClient } from '~/lib/client'

interface ReserveRoomState {
  error: string
  success: string
}

export async function reserveRoom(_prevState: ReserveRoomState, formData: FormData): Promise<ReserveRoomState> {
  const roomId = Number(formData.get('roomId'))
  const date = String(formData.get('date') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const attendees = String(formData.get('attendees') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()
  const slots = String(formData.get('slots') ?? '')
    .split(',')
    .map((slot) => slot.trim())
    .filter(Boolean)

  if (!roomId || !date || !title || slots.length === 0) {
    return { error: '예약 정보가 올바르지 않습니다.', success: '' }
  }

  try {
    const client = await createClient()
    await client.room.reserve({
      roomId,
      date,
      slots,
      title,
      attendees: attendees ? Number(attendees) : undefined,
      notes: notes || undefined,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '회의실 예약에 실패했습니다.',
      success: '',
    }
  }

  return { error: '', success: '회의실 예약이 완료되었습니다.' }
}
