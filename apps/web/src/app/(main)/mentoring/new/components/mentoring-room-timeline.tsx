'use client'

import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { fetchRooms } from '@/app/(main)/mentoring/new/actions'
import { addThirtyMinutes } from '@/app/(main)/room/lib/room-mentoring'
import { cn } from '@/lib/cn'
import type { RoomCard } from '@/lib/sdk'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { Checkbox } from '@/ui/checkbox'
import { DatePicker } from '@/ui/date-picker'
import { EmptyState } from '@/ui/empty-state'
import { Separator } from '@/ui/separator'

const aRooms = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']
const mRooms = ['M1', 'M2']

export interface TimelineSelection {
  roomId: number
  roomName: string
  date: string
  selectedSlots: string[]
}

interface MentoringRoomTimelineProps {
  initialRooms: RoomCard[]
  initialDate: string
  excludeSmallRooms?: boolean
  onSelect: (selection: TimelineSelection | null) => void
}

const allSlots = createAllSlots()

function isSmallRoom(name: string) {
  return /^스페이스 A\d$/.test(name)
}

export function MentoringRoomTimeline({
  initialRooms,
  initialDate,
  excludeSmallRooms,
  onSelect,
}: MentoringRoomTimelineProps) {
  const [allRooms, setAllRooms] = useState<RoomCard[]>(initialRooms)
  const [date, setDate] = useState(initialDate)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [, startTransition] = useTransition()

  const rooms = useMemo(() => {
    let filtered = allRooms
    if (selectedRooms.length > 0) {
      filtered = filtered.filter((room) => selectedRooms.some((code) => room.name.includes(code)))
    }
    if (excludeSmallRooms) {
      filtered = filtered.filter((room) => !isSmallRoom(room.name))
    }
    return filtered
  }, [allRooms, selectedRooms, excludeSmallRooms])

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const selectedRoom = useMemo(() => rooms.find((room) => room.itemId === selectedRoomId), [rooms, selectedRoomId])

  const slotMaps = useMemo(
    () => new Map(rooms.map((room) => [room.itemId, new Map(room.timeSlots.map((slot) => [slot.time, slot]))])),
    [rooms],
  )

  function adjustDate(days: number) {
    const current = new Date(date)
    current.setDate(current.getDate() + days)
    setDate(current.toISOString().slice(0, 10))
  }

  const isInitialMount = useRef(true)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    setSelectedRoomId(null)
    setSelectedSlots([])
    onSelectRef.current(null)

    startTransition(async () => {
      const result = await fetchRooms(date)
      setAllRooms(result)
    })
  }, [date])

  // Clear slot selection when the selected room is filtered out
  useEffect(() => {
    if (selectedRoomId !== null && !rooms.some((r) => r.itemId === selectedRoomId)) {
      setSelectedRoomId(null)
      setSelectedSlots([])
      onSelectRef.current(null)
    }
  }, [rooms, selectedRoomId])

  function handleRoomToggle(room: string, checked: boolean) {
    setSelectedRooms((prev) => (checked ? [...prev, room] : prev.filter((r) => r !== room)))
  }

  function handleGroupToggle(groupRooms: string[], checked: boolean) {
    setSelectedRooms((prev) =>
      checked ? [...new Set([...prev, ...groupRooms])] : prev.filter((r) => !groupRooms.includes(r)),
    )
  }

  function handleSlotSelect(roomId: number, time: string) {
    const slotMap = slotMaps.get(roomId)
    if (!slotMap?.get(time)?.available) return

    if (roomId !== selectedRoomId) {
      const room = rooms.find((r) => r.itemId === roomId)
      setSelectedRoomId(roomId)
      setSelectedSlots([time])
      if (room) {
        onSelect({ roomId, roomName: room.name, date, selectedSlots: [time] })
      }
      return
    }

    if (selectedSlots.includes(time)) {
      setSelectedSlots([])
      setSelectedRoomId(null)
      onSelect(null)
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
    const room = rooms.find((r) => r.itemId === roomId)
    if (room) {
      onSelect({ roomId, roomName: room.name, date, selectedSlots: next })
    }
  }

  const selectionSummary = formatSelectionSummary(selectedSlots)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
          <div className="shrink-0">
            <span className="mb-2 block text-sm font-medium text-foreground-muted">예약 날짜</span>
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => adjustDate(-1)}
                className="rounded-r-none border-r border-border"
              >
                <CaretLeft size={16} weight="bold" />
              </Button>
              <DatePicker
                value={date}
                onValueChange={setDate}
                className="h-9 rounded-none border-none bg-transparent shadow-none"
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => adjustDate(1)}
                className="rounded-l-none border-l border-border"
              >
                <CaretRight size={16} weight="bold" />
              </Button>
            </div>
          </div>

          <Separator className="lg:hidden" />
          <div className="hidden lg:block lg:self-stretch">
            <div className="h-full w-px bg-border" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="mb-2 block text-sm font-medium text-foreground-muted">회의실</span>
            <div className="space-y-2">
              {!excludeSmallRooms ? (
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Checkbox
                      checked={aRooms.every((r) => selectedRooms.includes(r))}
                      onCheckedChange={(checked) => handleGroupToggle(aRooms, checked)}
                      labelClassName="font-semibold"
                    >
                      전체
                    </Checkbox>
                    <div className="mx-0.5 h-4 w-px bg-border" />
                    {aRooms.map((room) => (
                      <Checkbox
                        key={room}
                        checked={selectedRooms.includes(room)}
                        onCheckedChange={(checked) => handleRoomToggle(room, checked)}
                      >
                        {room}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Checkbox
                    checked={mRooms.every((r) => selectedRooms.includes(r))}
                    onCheckedChange={(checked) => handleGroupToggle(mRooms, checked)}
                    labelClassName="font-semibold"
                  >
                    전체
                  </Checkbox>
                  <div className="mx-0.5 h-4 w-px bg-border" />
                  {mRooms.map((room) => (
                    <Checkbox
                      key={room}
                      checked={selectedRooms.includes(room)}
                      onCheckedChange={(checked) => handleRoomToggle(room, checked)}
                    >
                      {room}
                    </Checkbox>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={CalendarBlank} message="조회 조건에 맞는 회의실이 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse">
              <thead>
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
                    <td className="sticky left-0 z-10 border-r border-border bg-surface px-2 py-0.5 align-top text-xs text-foreground-muted">
                      <div className="flex h-8 items-start">{time}</div>
                    </td>
                    {rooms.map((room) => {
                      const slotData = slotMaps.get(room.itemId)?.get(time)
                      const hasSlot = slotData !== undefined
                      const available = slotData?.available ?? false
                      const reservation = slotData?.reservation
                      const selected = selectedRoomId === room.itemId && selectedSlots.includes(time)

                      return (
                        <td key={room.itemId} className="border-r border-border p-0.5 last:border-r-0">
                          {hasSlot ? (
                            <button
                              className={cn(
                                'flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors duration-150',
                                selected
                                  ? 'border border-slot-selected-border bg-slot-selected text-slot-selected-foreground'
                                  : available
                                    ? 'cursor-pointer border border-slot-available-border bg-slot-available text-slot-available-foreground hover:border-slot-available-border-hover hover:bg-surface'
                                    : reservation
                                      ? 'cursor-not-allowed border border-primary/30 bg-primary/10 text-foreground-muted'
                                      : 'cursor-not-allowed border border-border bg-muted text-foreground-muted opacity-70',
                              )}
                              disabled={!available}
                              title={reservation ? formatReservationLabel(reservation) : undefined}
                              type="button"
                              onClick={() => handleSlotSelect(room.itemId, time)}
                            >
                              {selected ? (
                                '✓'
                              ) : !available ? (
                                reservation ? (
                                  <span className="flex max-w-24 flex-col items-center gap-0.5 px-0.5 leading-none font-normal opacity-70">
                                    <span className="w-full truncate text-[10px]">{reservation.title}</span>
                                    <span className="w-full truncate text-[8px] opacity-60">
                                      {reservation.bookedBy}
                                    </span>
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
              <span
                aria-hidden="true"
                className="inline-flex size-2 items-center justify-center rounded-full border border-border bg-muted text-[8px] leading-none text-foreground-muted"
              >
                —
              </span>
              예약 불가
            </span>
          </div>
        </>
      )}

      {selectedRoom && selectedSlots.length > 0 ? (
        <p className="text-sm text-foreground">
          선택: {selectedRoom.name} · {selectionSummary}
        </p>
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

function createAllSlots() {
  const result: string[] = []

  for (let hour = 9; hour <= 23; hour += 1) {
    result.push(`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`)
  }

  return result
}
