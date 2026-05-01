'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import { DatePicker } from '@/ui/date-picker'
import { Separator } from '@/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

const aRooms = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']
const msRooms = ['M1', 'M2', 'S']

interface RoomFiltersProps {
  date: string
  rooms: string[]
  mineOnly: boolean
}

export function RoomFilters({ date, rooms, mineOnly }: RoomFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(date)
  const [selectedRooms, setSelectedRooms] = useState<string[]>(rooms)

  function pushParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    }
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate)
    pushParams({ date: newDate })
  }

  function adjustDate(days: number) {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    handleDateChange(current.toISOString().slice(0, 10))
  }

  function handleRoomToggle(room: string, checked: boolean) {
    const next = checked ? [...selectedRooms, room] : selectedRooms.filter((r) => r !== room)
    setSelectedRooms(next)
    pushParams({ room: next.join(',') })
  }

  function handleGroupToggle(groupRooms: string[], checked: boolean) {
    const next = checked
      ? [...new Set([...selectedRooms, ...groupRooms])]
      : selectedRooms.filter((r) => !groupRooms.includes(r))
    setSelectedRooms(next)
    pushParams({ room: next.join(',') })
  }

  function handleMineToggle(value: string) {
    pushParams({ mine: value === 'mine' ? '1' : '' })
  }

  const allAChecked = aRooms.every((r) => selectedRooms.includes(r))
  const allMSChecked = msRooms.every((r) => selectedRooms.includes(r))

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <ToggleGroup value={mineOnly ? 'mine' : 'all'} onValueChange={handleMineToggle}>
        <ToggleGroupItem value="mine">내 예약만</ToggleGroupItem>
        <ToggleGroupItem value="all">전체</ToggleGroupItem>
      </ToggleGroup>
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
              value={selectedDate}
              onValueChange={handleDateChange}
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
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Checkbox
                  checked={allAChecked}
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
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Checkbox
                  checked={allMSChecked}
                  onCheckedChange={(checked) => handleGroupToggle(msRooms, checked)}
                  labelClassName="font-semibold"
                >
                  전체
                </Checkbox>
                <div className="mx-0.5 h-4 w-px bg-border" />
                {msRooms.map((room) => (
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
  )
}
