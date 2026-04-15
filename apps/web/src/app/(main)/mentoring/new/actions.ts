'use server'

import { redirect } from 'next/navigation'

import { venueToRoomId } from '@/app/(main)/room/lib/room-mentoring'
import { performRoomReservation } from '@/lib/actions/reserve-room'
import { createClient } from '@/lib/client'
import { AuthenticationError, type RoomCard } from '@/lib/sdk'

interface CreateMentoringState {
  error: string
  success: string
  id?: number
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
    return { error: '필수 항목을 모두 입력해주세요.', success: '' }
  }

  if (startTime >= endTime) {
    return { error: '종료 시간은 시작 시간보다 늦어야 합니다.', success: '' }
  }

  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/u
  if (emojiRegex.test(title)) {
    return { error: '제목에 이모지를 사용할 수 없습니다.', success: '' }
  }
  if (emojiRegex.test(content)) {
    return { error: '내용에 이모지를 사용할 수 없습니다.', success: '' }
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

    const { items } = await client.mentoring.list({
      search: { field: 'author', value: '@me', me: true },
    })
    const id = items[0]?.id

    return { error: '', success: '등록 되었습니다.', id }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '멘토링 등록에 실패했습니다.', success: '' }
  }
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
    return await client.room.list({ date, room: room || undefined })
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

export async function fetchRoomReservations(): Promise<
  Array<{
    title: string
    url: string
    status: string
    date?: string
    time?: string
    venue?: string
    timeEnd?: string
  }>
> {
  try {
    const client = await createClient()
    const dashboard = await client.dashboard.get()
    return dashboard.roomReservations
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    throw error
  }
}
