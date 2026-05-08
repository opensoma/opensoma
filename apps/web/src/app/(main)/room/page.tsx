import { format } from 'date-fns'
import type { Metadata } from 'next'

import { RoomFilters } from '@/app/(main)/room/components/room-filters'
import { RoomTimeline } from '@/app/(main)/room/components/room-timeline'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { UserGb } from '@/lib/sdk'

export const metadata: Metadata = {
  title: '회의실 예약',
}

export default async function RoomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const date = getFirstValue(resolvedSearchParams.date) ?? format(new Date(), 'yyyy-MM-dd')
  const roomParam = getFirstValue(resolvedSearchParams.room) ?? ''
  const selectedRooms = roomParam ? roomParam.split(',').filter(Boolean) : []
  const mineOnly = getFirstValue(resolvedSearchParams.mine) === '1'
  const client = await requireAuth()
  const [allRooms, currentUser] = await Promise.all([
    client.room.list({ date, includeReservations: true }),
    getCurrentUser(),
  ])
  // Only trainees are restricted from booking on swmaestro.ai. Allow everyone
  // else (mentors and accounts whose userGb the SDK couldn't parse) so a
  // missing/unexpected userVO.userGb in checkLogin doesn't lock out legitimate
  // mentors. The native server is the final authority on permission.
  const canReserve = currentUser?.userGb !== UserGb.Trainee

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">회의실 예약</h1>
          {canReserve && (
            <a
              href="http://partner.toz.co.kr/partner/reservation/fkii3/swmaestro/index.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              외부 회의실 예약 →
            </a>
          )}
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
        canReserve={canReserve}
      />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
