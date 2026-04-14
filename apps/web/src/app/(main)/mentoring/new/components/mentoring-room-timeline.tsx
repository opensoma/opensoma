'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { useMemo, useState, useTransition } from 'react'

import { fetchRooms } from '@/app/(main)/mentoring/new/actions'
import { addThirtyMinutes } from '@/app/(main)/room/lib/room-mentoring'
import { cn } from '@/lib/cn'
import type { RoomCard } from '@/lib/sdk'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { DatePicker } from '@/ui/date-picker'
import { EmptyState } from '@/ui/empty-state'
import { Field, FieldLabel } from '@/ui/field'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '@/ui/select'

const roomOptions = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'M1', 'M2']

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
  const rooms = excludeSmallRooms ? allRooms.filter((room) => !isSmallRoom(room.name)) : allRooms
  const [date, setDate] = useState(initialDate)
  const [roomFilter, setRoomFilter] = useState('')
  const [isLoading, startTransition] = useTransition()

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const selectedRoom = useMemo(() => rooms.find((room) => room.itemId === selectedRoomId), [rooms, selectedRoomId])

  const slotMaps = useMemo(
    () =>
      new Map(rooms.map((room) => [room.itemId, new Map(room.timeSlots.map((slot) => [slot.time, slot.available]))])),
    [rooms],
  )

  function handleFilter() {
    setSelectedRoomId(null)
    setSelectedSlots([])
    onSelect(null)

    startTransition(async () => {
      const result = await fetchRooms(date, roomFilter || undefined)
      setAllRooms(result)
    })
  }

  function handleSlotSelect(roomId: number, time: string) {
    const slotMap = slotMaps.get(roomId)
    if (!slotMap?.get(time)) return

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
      <div className="grid gap-4 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field name="timeline-date">
          <FieldLabel>예약 날짜</FieldLabel>
          <DatePicker value={date} onValueChange={setDate} placeholder="날짜를 선택하세요" />
        </Field>
        <Field name="timeline-room">
          <FieldLabel>회의실</FieldLabel>
          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger placeholder="전체 회의실" />
            <SelectPopup>
              <SelectGroup label="회의실">
                {roomOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectPopup>
          </Select>
        </Field>
        <div className="flex gap-2 pt-[26px]">
          <Button disabled={isLoading} type="button" onClick={handleFilter}>
            {isLoading ? '조회 중...' : '조회'}
          </Button>
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
                    <td className="sticky left-0 z-10 border-r border-border bg-surface px-2 py-0 text-xs text-foreground-muted">
                      <div className="flex h-8 items-center">{time}</div>
                    </td>
                    {rooms.map((room) => {
                      const slotMap = slotMaps.get(room.itemId)
                      const hasSlot = slotMap?.has(time)
                      const available = slotMap?.get(time) ?? false
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
                                    : 'cursor-not-allowed border border-border bg-muted text-foreground-muted opacity-70',
                              )}
                              disabled={!available}
                              type="button"
                              onClick={() => handleSlotSelect(room.itemId, time)}
                            >
                              {selected ? '✓' : !available ? '—' : null}
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
