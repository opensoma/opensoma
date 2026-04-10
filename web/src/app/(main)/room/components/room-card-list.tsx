'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { useState } from 'react'

import { ReserveForm } from '~/app/(main)/room/components/reserve-form'
import { TimeSlotGrid } from '~/app/(main)/room/components/time-slot-grid'
import type { RoomCard } from '~/lib/sdk'
import { Card, CardContent, CardHeader } from '~/ui/card'
import { EmptyState } from '~/ui/empty-state'

interface RoomCardListProps {
  rooms: RoomCard[]
  date: string
}

export function RoomCardList({ rooms, date }: RoomCardListProps) {
  const [selectedByRoom, setSelectedByRoom] = useState<Record<number, string[]>>({})

  if (rooms.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent>
          <EmptyState icon={CalendarBlank} message="조회 조건에 맞는 회의실이 없습니다." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {rooms.map((room) => {
        const selectedSlots = selectedByRoom[room.itemId] ?? []

        return (
          <Card key={room.itemId} className="border border-border">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-foreground">{room.name}</h2>
                  <span className="text-sm text-foreground-muted">정원 {room.capacity}명</span>
                </div>
                <p className="text-sm text-foreground-muted">{room.description}</p>
                <p className="text-xs text-foreground-muted">
                  이용 기간: {room.availablePeriod.start} ~ {room.availablePeriod.end}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TimeSlotGrid
                selectedSlots={selectedSlots}
                slots={room.timeSlots}
                onChange={(slots) =>
                  setSelectedByRoom((prev) => ({
                    ...prev,
                    [room.itemId]: slots,
                  }))
                }
              />
              {selectedSlots.length > 0 ? (
                <ReserveForm date={date} roomId={room.itemId} roomName={room.name} selectedSlots={selectedSlots} />
              ) : (
                <p className="text-sm text-foreground-muted">예약할 시간을 선택하면 예약 폼이 표시됩니다.</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
