import type { Metadata } from 'next'

import { RoomFilters } from '@/app/(main)/room/components/room-filters'
import { RoomTimeline } from '@/app/(main)/room/components/room-timeline'
import { requireAuth } from '@/lib/auth'

export const metadata: Metadata = {
  title: '회의실 예약',
}

export default async function RoomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const date = getFirstValue(resolvedSearchParams.date) ?? new Date().toISOString().slice(0, 10)
  const roomParam = getFirstValue(resolvedSearchParams.room) ?? ''
  const selectedRooms = roomParam ? roomParam.split(',').filter(Boolean) : []
  const client = await requireAuth()
  const allRooms = await client.room.list({ date })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">회의실 예약</h1>
        <p className="text-sm text-foreground-muted">날짜별 회의실 현황을 조회하고 원하는 시간대를 예약하세요.</p>
      </div>

      <RoomFilters date={date} rooms={selectedRooms} />
      <RoomTimeline date={date} rooms={allRooms} selectedRooms={selectedRooms} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
