'use client'

import { CalendarBlank, Clock, MapPin } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { cn } from '@/lib/cn'
import type { RoomReservationListItem } from '@/lib/sdk'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Checkbox } from '@/ui/checkbox'
import { DatePicker } from '@/ui/date-picker'
import { EmptyState } from '@/ui/empty-state'
import { Field, FieldLabel } from '@/ui/field'

export type RoomReservation = RoomReservationListItem

export interface TimelineSelection {
  roomId: number
  roomName: string
  date: string
  selectedSlots: string[]
}

interface ExistingReservationSelectorProps {
  reservations: RoomReservation[]
  onSelect: (selection: TimelineSelection | null) => void
  includeCancelled?: boolean
}

export function ExistingReservationSelector({
  reservations,
  onSelect,
  includeCancelled = false,
}: ExistingReservationSelectorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedRentId, setSelectedRentId] = useState<number | null>(null)
  const [filterDate, setFilterDate] = useState('')
  const [isNavigating, startNavigation] = useTransition()

  const visibleReservations = includeCancelled ? reservations : reservations.filter((r) => r.status !== 'cancelled')

  const filteredReservations = filterDate
    ? visibleReservations.filter((r) => r.date === filterDate)
    : visibleReservations

  const sortedReservations = [...filteredReservations].sort((a, b) => b.date.localeCompare(a.date))

  useEffect(() => {
    if (selectedRentId === null) return
    if (visibleReservations.some((r) => r.rentId === selectedRentId)) return
    setSelectedRentId(null)
    onSelect(null)
  }, [selectedRentId, visibleReservations, onSelect])

  function handleIncludeCancelledChange(checked: boolean) {
    const next = new URLSearchParams(searchParams.toString())
    if (checked) {
      next.set('includeCancelled', 'true')
    } else {
      next.delete('includeCancelled')
    }
    const query = next.toString()
    startNavigation(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  function handleSelect(reservation: RoomReservation) {
    const selection: TimelineSelection = {
      roomId: 0,
      roomName: reservation.venue,
      date: reservation.date,
      selectedSlots: calculateSlots(reservation.startTime, reservation.endTime),
    }
    setSelectedRentId(reservation.rentId)
    onSelect(selection)
  }

  function handleClear() {
    setSelectedRentId(null)
    onSelect(null)
  }

  const hasAnyReservations = reservations.length > 0
  const hasVisibleReservations = visibleReservations.length > 0

  if (!hasAnyReservations) {
    return (
      <Card className="border border-border">
        <CardContent className="space-y-3">
          <EmptyState icon={CalendarBlank} message="예약된 회의실이 없습니다. 먼저 회의실을 예약해주세요." />
          <div className="flex justify-center">
            <Checkbox checked={includeCancelled} disabled={isNavigating} onCheckedChange={handleIncludeCancelledChange}>
              취소된 예약 포함
            </Checkbox>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Field name="filter-date" className="min-w-[200px] flex-1">
          <FieldLabel>날짜 필터</FieldLabel>
          <DatePicker value={filterDate} onValueChange={setFilterDate} placeholder="날짜로 필터링" />
        </Field>
        <Checkbox checked={includeCancelled} disabled={isNavigating} onCheckedChange={handleIncludeCancelledChange}>
          취소된 예약 포함
        </Checkbox>
      </div>

      {filterDate && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-muted">
            {filterDate} 예약: {filteredReservations.length}건
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setFilterDate('')}>
            필터 초기화
          </Button>
        </div>
      )}

      {!hasVisibleReservations && (
        <Card className="border border-border">
          <CardContent>
            <EmptyState
              icon={CalendarBlank}
              message="표시할 예약이 없습니다. 모든 예약이 취소되었거나 필터 조건에 맞지 않습니다."
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sortedReservations.map((reservation) => {
          const isSelected = selectedRentId === reservation.rentId

          return (
            <button
              key={reservation.rentId}
              type="button"
              onClick={() => handleSelect(reservation)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  'border transition-colors duration-150',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{reservation.title || '회의실 예약'}</h3>
                      <span
                        className={cn(
                          'mt-1 inline-block rounded px-2 py-0.5 text-xs',
                          reservation.status === 'confirmed'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning',
                        )}
                      >
                        {reservation.statusLabel}
                      </span>
                    </div>
                    {isSelected && <span className="text-lg">✓</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <MapPin className="size-4" />
                    <span>{reservation.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <CalendarBlank className="size-4" />
                    <span>{reservation.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <Clock className="size-4" />
                    <span>
                      {reservation.startTime} ~ {reservation.endTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      {selectedRentId !== null && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={handleClear}>
            선택 해제
          </Button>
        </div>
      )}
    </div>
  )
}

function calculateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  let currentHour = startHour
  let currentMinute = startMinute

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`)

    currentMinute += 30
    if (currentMinute >= 60) {
      currentHour += 1
      currentMinute = 0
    }
  }

  return slots
}
