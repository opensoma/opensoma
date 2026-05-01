import type { Metadata } from 'next'

import { RoomFilters } from '@/app/(main)/room/components/room-filters'
import { RoomTimeline } from '@/app/(main)/room/components/room-timeline'
import { getCurrentUser, requireAuth } from '@/lib/auth'

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
  const mineOnly = getFirstValue(resolvedSearchParams.mine) === '1'
  const client = await requireAuth()
  const [allRooms, currentUser] = await Promise.all([
    client.room.list({ date, includeReservations: true }),
    getCurrentUser(),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">회의실 예약</h1>
          <a
            href="http://partner.toz.co.kr/partner/reservation/fkii3/swmaestro/index.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            외부 회의실 예약 →
          </a>
        </div>
        <p className="text-sm text-foreground-muted">날짜별 회의실 현황을 조회하고 원하는 시간대를 예약하세요.</p>
      </div>

      <RoomFilters date={date} rooms={selectedRooms} mineOnly={mineOnly} />
      <RoomTimeline
        date={date}
        rooms={allRooms}
        selectedRooms={selectedRooms}
        currentUserName={currentUser?.userNm ?? null}
        mineOnly={mineOnly}
      />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
