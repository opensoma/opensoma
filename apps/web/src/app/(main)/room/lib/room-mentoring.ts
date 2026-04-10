// Inlined from opensoma/constants to avoid pulling node:fs into client bundles
const ROOM_IDS: Record<string, number> = {
  A1: 17,
  A2: 18,
  A3: 19,
  A4: 20,
  A5: 21,
  A6: 22,
  A7: 23,
  A8: 24,
}

export interface RoomToMentoringParams {
  date: string
  startTime: string
  endTime: string
  venue: string
}

export function roomToMentoringParams(input: {
  date: string
  roomName: string
  selectedSlots: string[]
}): RoomToMentoringParams {
  const startTime = input.selectedSlots[0] ?? ''
  const lastSlot = input.selectedSlots[input.selectedSlots.length - 1] ?? ''

  return {
    date: input.date,
    startTime,
    endTime: addThirtyMinutes(lastSlot),
    venue: input.roomName,
  }
}

export function buildMentoringCreateUrl(params: RoomToMentoringParams): string {
  const searchParams = new URLSearchParams()

  if (params.date) {
    searchParams.set('date', params.date)
  }

  if (params.startTime) {
    searchParams.set('startTime', params.startTime)
  }

  if (params.endTime) {
    searchParams.set('endTime', params.endTime)
  }

  if (params.venue) {
    searchParams.set('venue', params.venue)
  }

  const query = searchParams.toString()

  return query ? `/mentoring/create?${query}` : '/mentoring/create'
}

export function venueToRoomCode(venue: string): string | null {
  if (!venue.startsWith('스페이스 ')) {
    return null
  }

  return venue.slice('스페이스 '.length) || null
}

export function venueToRoomId(venue: string): number | null {
  const roomCode = venueToRoomCode(venue)

  if (!roomCode) {
    return null
  }

  return ROOM_IDS[roomCode] ?? null
}

export function isReservableVenue(venue: string): boolean {
  return venueToRoomId(venue) !== null
}

export function addThirtyMinutes(time: string): string {
  const [hoursString, minutesString] = time.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return ''
  }

  const totalMinutes = hours * 60 + minutes + 30
  const nextHours = Math.floor(totalMinutes / 60)
  const nextMinutes = totalMinutes % 60

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}
