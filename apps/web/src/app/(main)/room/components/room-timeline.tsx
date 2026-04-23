'use client'

import { CalendarBlank, CheckCircle } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ReserveForm } from '@/app/(main)/room/components/reserve-form'
import { buildMentoringCreateUrl, roomToMentoringParams } from '@/app/(main)/room/lib/room-mentoring'
import { cn } from '@/lib/cn'
import type { RoomCard } from '@/lib/sdk'
import { Button, buttonVariants } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import Link from '@/ui/link'

interface RoomTimelineProps {
  rooms: RoomCard[]
  selectedRooms: string[]
  date: string
}

interface LastReservation {
  roomId: number
  roomName: string
  slots: string[]
  message: string
}

const allSlots = createAllSlots()

export function RoomTimeline({ rooms: allRooms, selectedRooms, date }: RoomTimelineProps) {
  const router = useRouter()
  const rooms = useMemo(
    () =>
      selectedRooms.length === 0
        ? allRooms
        : allRooms.filter((room) => selectedRooms.some((code) => room.name.includes(code))),
    [allRooms, selectedRooms],
  )
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [lastReservation, setLastReservation] = useState<LastReservation | null>(null)
  const [optimisticReservedSlots, setOptimisticReservedSlots] = useState<Map<number, Set<string>>>(new Map())
  const previousRoomsRef = useRef(allRooms)
  const previousDateRef = useRef(date)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (previousRoomsRef.current !== allRooms) {
    previousRoomsRef.current = allRooms
    if (optimisticReservedSlots.size > 0) {
      setOptimisticReservedSlots(new Map())
    }
  }

  if (previousDateRef.current !== date) {
    previousDateRef.current = date
    if (lastReservation) setLastReservation(null)
    if (selectedSlots.length > 0) setSelectedSlots([])
    if (selectedRoomId != null) setSelectedRoomId(null)
  }

  const selectedRoom = useMemo(() => rooms.find((room) => room.itemId === selectedRoomId), [rooms, selectedRoomId])

  const slotMaps = useMemo(
    () => new Map(rooms.map((room) => [room.itemId, new Map(room.timeSlots.map((slot) => [slot.time, slot]))])),
    [rooms],
  )

  if (rooms.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent>
          <EmptyState icon={CalendarBlank} message="조회 조건에 맞는 회의실이 없습니다." />
        </CardContent>
      </Card>
    )
  }

  function handleReserveSuccess(message: string) {
    if (selectedRoomId == null || selectedSlots.length === 0 || !selectedRoom) return

    setLastReservation({
      roomId: selectedRoomId,
      roomName: selectedRoom.name,
      slots: [...selectedSlots],
      message,
    })

    setOptimisticReservedSlots((prev) => {
      const next = new Map(prev)
      const existing = next.get(selectedRoomId) ?? new Set<string>()
      const merged = new Set(existing)
      for (const slot of selectedSlots) merged.add(slot)
      next.set(selectedRoomId, merged)
      return next
    })

    setSelectedSlots([])
    setSelectedRoomId(null)
    router.refresh()
  }

  function isOptimisticallyReserved(roomId: number, time: string): boolean {
    return optimisticReservedSlots.get(roomId)?.has(time) ?? false
  }

  function handleSelect(roomId: number, time: string) {
    const slotMap = slotMaps.get(roomId)
    if (!slotMap?.get(time)?.available) return
    if (isOptimisticallyReserved(roomId, time)) return

    if (roomId !== selectedRoomId) {
      setSelectedRoomId(roomId)
      setSelectedSlots([time])
      return
    }

    if (selectedSlots.includes(time)) {
      setSelectedSlots([])
      setSelectedRoomId(null)
      return
    }

    const next = [...selectedSlots, time].sort((left, right) => allSlots.indexOf(left) - allSlots.indexOf(right))

    if (next.length > 8) return

    for (let index = 1; index < next.length; index += 1) {
      if (allSlots.indexOf(next[index]) !== allSlots.indexOf(next[index - 1]) + 1) {
        return
      }
    }

    setSelectedSlots(next)
  }

  const selectionSummary = formatSelectionSummary(selectedSlots)

  const SLOT_HEIGHT = 32
  const currentTimeOffset = (() => {
    if (date !== now.toISOString().slice(0, 10)) return null
    const minutesFromStart = now.getHours() * 60 + now.getMinutes() - 9 * 60
    if (minutesFromStart < 0 || minutesFromStart > 15 * 60) return null
    const theadHeight = theadRef.current?.offsetHeight ?? 37
    return theadHeight + (minutesFromStart / 30) * SLOT_HEIGHT
  })()

  return (
    <div className="space-y-4">
      {lastReservation ? (
        <div
          aria-live="polite"
          className="flex flex-wrap items-start gap-3 rounded-lg border border-success/20 bg-success-muted p-4 text-success-foreground"
          role="status"
        >
          <CheckCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} weight="fill" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold">{lastReservation.message}</p>
            <p className="text-xs opacity-80">
              {lastReservation.roomName} · {formatReservedSummary(lastReservation.slots)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
              href={buildMentoringCreateUrl(
                roomToMentoringParams({
                  date,
                  roomName: lastReservation.roomName,
                  selectedSlots: lastReservation.slots,
                }),
              )}
            >
              멘토링/특강 등록하기 →
            </Link>
            <Button size="sm" type="button" variant="ghost" onClick={() => setLastReservation(null)}>
              닫기
            </Button>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead ref={theadRef}>
            <tr className="bg-surface">
              <th className="sticky left-0 z-20 min-w-16 border-r border-b border-border bg-surface px-2 py-2 text-left text-xs font-medium text-foreground-muted">
                시간
              </th>
              {rooms.map((room) => (
                <th
                  key={room.itemId}
                  className="min-w-28 border-r border-b border-border px-2 py-2 text-center text-xs font-medium last:border-r-0"
                >
                  <div className="text-foreground">{room.name}</div>
                  <div className="font-normal text-foreground-muted">
                    {room.capacity === 0 ? '무제한' : `${room.capacity}명`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allSlots.map((time) => (
              <tr key={time} className="group">
                <td className="sticky left-0 z-10 border-r border-border bg-surface px-2 py-0 text-xs text-foreground-muted">
                  <div className="flex h-8 items-center">{time}</div>
                </td>
                {rooms.map((room) => {
                  const slotData = slotMaps.get(room.itemId)?.get(time)
                  const hasSlot = slotData !== undefined
                  const optimisticMine = isOptimisticallyReserved(room.itemId, time)
                  const available = (slotData?.available ?? false) && !optimisticMine
                  const reservation = slotData?.reservation
                  const selected = selectedRoomId === room.itemId && selectedSlots.includes(time)
                  const showAsMine =
                    optimisticMine && lastReservation?.roomId === room.itemId && lastReservation.slots.includes(time)

                  return (
                    <td key={room.itemId} className="border-r border-border p-0.5 last:border-r-0">
                      {hasSlot ? (
                        <button
                          className={cn(
                            'flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors duration-150',
                            selected
                              ? 'border border-slot-selected-border bg-slot-selected text-slot-selected-foreground'
                              : showAsMine
                                ? 'cursor-not-allowed border border-primary bg-primary/20 text-primary'
                                : available
                                  ? 'cursor-pointer border border-slot-available-border bg-slot-available text-slot-available-foreground hover:border-slot-available-border-hover hover:bg-surface'
                                  : reservation
                                    ? 'cursor-not-allowed border border-primary/30 bg-primary/10 text-foreground-muted'
                                    : 'cursor-not-allowed border border-border bg-muted text-foreground-muted opacity-70',
                          )}
                          disabled={!available}
                          title={
                            showAsMine
                              ? `내 예약: ${lastReservation?.roomName ?? ''}`
                              : reservation
                                ? formatReservationLabel(reservation)
                                : undefined
                          }
                          type="button"
                          onClick={() => handleSelect(room.itemId, time)}
                        >
                          {selected ? (
                            '✓'
                          ) : showAsMine ? (
                            <span className="flex max-w-24 flex-col items-center gap-0.5 px-0.5 leading-none font-normal">
                              <span className="w-full truncate text-[10px] font-semibold">내 예약</span>
                            </span>
                          ) : !available ? (
                            reservation ? (
                              <span className="flex max-w-24 flex-col items-center gap-0.5 px-0.5 leading-none font-normal opacity-70">
                                <span className="w-full truncate text-[10px]">{reservation.title}</span>
                                <span className="w-full truncate text-[8px] opacity-60">{reservation.bookedBy}</span>
                              </span>
                            ) : (
                              '—'
                            )
                          ) : null}
                        </button>
                      ) : (
                        <div className="h-8" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {currentTimeOffset !== null ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
            style={{ top: currentTimeOffset }}
          >
            <span className="size-2 shrink-0 rounded-full bg-red-500" />
            <div className="h-px flex-1 bg-red-500 opacity-70" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full border border-slot-selected-border bg-slot-selected"
          />
          선택됨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full border border-slot-available-border bg-slot-available"
          />
          예약 가능
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border border-primary/30 bg-primary/10" />
          예약됨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border border-primary bg-primary/20" />내 예약
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-flex size-2 items-center justify-center rounded-full border border-border bg-muted text-[8px] leading-none text-foreground-muted"
          >
            —
          </span>
          예약 불가
        </span>
      </div>

      {selectedRoom && selectedSlots.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            선택: {selectedRoom.name} · {selectionSummary}
          </p>
          <ReserveForm
            key={`${selectedRoom.itemId}-${selectedSlots.join('-')}`}
            date={date}
            roomId={selectedRoom.itemId}
            roomName={selectedRoom.name}
            selectedSlots={selectedSlots}
            onSuccess={handleReserveSuccess}
          />
        </div>
      ) : null}
    </div>
  )
}

function formatReservationLabel(reservation: { title: string; bookedBy: string }) {
  if (reservation.title.includes(reservation.bookedBy)) return reservation.title
  return `${reservation.bookedBy} · ${reservation.title}`
}

function formatSelectionSummary(selectedSlots: string[]) {
  if (selectedSlots.length === 0) return null

  const first = selectedSlots[0]
  const last = selectedSlots[selectedSlots.length - 1]
  const slotCount = selectedSlots.length
  const totalMinutes = slotCount * 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const duration = minutes === 0 ? `${hours}시간` : hours === 0 ? `${minutes}분` : `${hours}시간 ${minutes}분`

  return `${first} ~ ${addThirtyMinutes(last)} (${slotCount}칸, ${duration})`
}

function formatReservedSummary(slots: string[]) {
  if (slots.length === 0) return ''
  const sorted = [...slots].sort((a, b) => allSlots.indexOf(a) - allSlots.indexOf(b))
  return `${sorted[0]} ~ ${addThirtyMinutes(sorted[sorted.length - 1])}`
}

function addThirtyMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  const totalMinutes = hour * 60 + minute + 30
  const nextHour = Math.floor(totalMinutes / 60)
  const nextMinute = totalMinutes % 60

  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
}

function createAllSlots() {
  const result: string[] = []

  for (let hour = 9; hour <= 23; hour += 1) {
    result.push(`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`)
  }

  return result
}
