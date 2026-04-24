'use server'

import { redirect } from 'next/navigation'

import { venueToRoomId } from '@/app/(main)/room/lib/room-mentoring'
import { performRoomReservation } from '@/lib/actions/reserve-room'
import { createClient } from '@/lib/client'
import { AuthenticationError, type RoomCard } from '@/lib/sdk'

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
  const receiptTypeRaw = String(formData.get('receiptType') ?? '')
  const receiptType: 'UNTIL_LECTURE' | 'DIRECT' = receiptTypeRaw === 'DIRECT' ? 'DIRECT' : 'UNTIL_LECTURE'
  const regStart = String(formData.get('regStart') ?? '')
  const regEnd = String(formData.get('regEnd') ?? '')
  const content = String(formData.get('content') ?? '').trim()

  if (!title || !type || !date || !startTime || !endTime || !venue || !maxAttendees) {
    return { error: '필수 항목을 모두 입력해주세요.' }
  }

  const maxAttendeesNumber = Number(maxAttendees)
  if (!Number.isFinite(maxAttendeesNumber) || maxAttendeesNumber <= 0) {
    return { error: '모집 인원을 올바르게 입력해주세요.' }
  }
  if (type === 'lecture' && maxAttendeesNumber < 6) {
    return { error: '멘토 특강은 최소 6명 이상이어야 합니다.' }
  }
  if (type !== 'lecture' && (maxAttendeesNumber < 2 || maxAttendeesNumber > 5)) {
    return { error: '자유 멘토링은 2명 이상 5명 이하로 설정해주세요.' }
  }

  if (startTime >= endTime) {
    return { error: '종료 시간은 시작 시간보다 늦어야 합니다.' }
  }

  if (receiptType === 'DIRECT' && !regEnd) {
    return { error: '접수 종료일을 선택해주세요.' }
  }

  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/u
  if (emojiRegex.test(title)) {
    return { error: '제목에 이모지를 사용할 수 없습니다.' }
  }
  if (emojiRegex.test(content)) {
    return { error: '내용에 이모지를 사용할 수 없습니다.' }
  }

  const needsRoomReservation = formData.get('needsRoomReservation') === 'true'
  const roomSlots = String(formData.get('roomSlots') ?? '')
    .split(',')
    .filter(Boolean)

  let id: number | undefined

  try {
    const client = await createClient()
    await client.mentoring.create({
      title,
      type: type === 'lecture' ? 'lecture' : 'public',
      date,
      startTime,
      endTime,
      venue,
      maxAttendees: maxAttendeesNumber,
      receiptType,
      regStart: regStart || undefined,
      regEnd: receiptType === 'DIRECT' ? regEnd || undefined : undefined,
      content: content || undefined,
    })

    const { items } = await client.mentoring.list({
      search: { field: 'author', value: '@me', me: true },
    })
    id = items[0]?.id
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '멘토링 등록에 실패했습니다.' }
  }

  if (needsRoomReservation && roomSlots.length > 0) {
    const roomId = venueToRoomId(venue)
    if (roomId) {
      const reservation = await performRoomReservation({ roomId, date, slots: roomSlots, title })
      if (reservation.error) {
        return { error: `멘토링은 등록되었으나 회의실 예약에 실패했습니다: ${reservation.error}` }
      }
    }
  }

  redirect(id ? `/mentoring/${id}` : '/mentoring')
}

export async function fetchRoomAvailability(
  date: string,
  venue: string,
): Promise<{ slots: Array<{ time: string; available: boolean }> } | { error: string }> {
  const roomId = venueToRoomId(venue)

  if (!roomId) {
    return { error: '예약할 수 없는 장소입니다.' }
  }

  if (!date) {
    return { error: '날짜를 선택해주세요.' }
  }

  try {
    const client = await createClient()
    const slots = await client.room.available(roomId, date)
    return { slots }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '회의실 정보를 불러오지 못했습니다.' }
  }
}

export async function fetchRooms(date: string, room?: string): Promise<RoomCard[]> {
  try {
    const client = await createClient()
    return await client.room.list({ date, room: room || undefined, includeReservations: true })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    throw error
  }
}

export async function reserveRoomFromMentoring(params: {
  venue: string
  date: string
  slots: string[]
  title: string
}): Promise<{ error: string; success: string }> {
  const roomId = venueToRoomId(params.venue)

  if (!roomId) {
    return { error: '예약할 수 없는 장소입니다.', success: '' }
  }

  return performRoomReservation({
    roomId,
    date: params.date,
    slots: params.slots,
    title: params.title,
  })
}
