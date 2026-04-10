'use client'

import { useMemo, useState } from 'react'

import { cn } from '~/lib/cn'

interface TimeSlotGridProps {
  slots: Array<{ time: string; available: boolean }>
  selectedSlots: string[]
  onChange: (slots: string[]) => void
}

const allSlots = createAllSlots()

export function TimeSlotGrid({ slots, selectedSlots, onChange }: TimeSlotGridProps) {
  const [error, setError] = useState('')
  const slotMap = useMemo(() => new Map(slots.map((slot) => [slot.time, slot.available])), [slots])
  const selectedSet = useMemo(() => new Set(selectedSlots), [selectedSlots])
  const selectionSummary = useMemo(() => formatSelectionSummary(selectedSlots), [selectedSlots])

  function handleSelect(time: string) {
    const available = slotMap.get(time)

    if (!available) {
      return
    }

    if (selectedSlots.includes(time)) {
      setError('')
      onChange([])
      return
    }

    const next = [...selectedSlots, time].sort((left, right) => allSlots.indexOf(left) - allSlots.indexOf(right))

    if (next.length > 8) {
      setError('최대 8개(4시간)까지 연속 선택할 수 있습니다.')
      return
    }

    for (let index = 1; index < next.length; index += 1) {
      if (allSlots.indexOf(next[index]) !== allSlots.indexOf(next[index - 1]) + 1) {
        setError('연속된 30분 단위 시간만 선택할 수 있습니다.')
        return
      }
    }

    setError('')
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 md:grid-cols-6 xl:grid-cols-8">
        {slots.map((slot, index) => {
          const selected = selectedSet.has(slot.time)
          const previousTime = slots[index - 1]?.time
          const nextTime = slots[index + 1]?.time
          const connectsLeft =
            selected &&
            previousTime != null &&
            selectedSet.has(previousTime) &&
            allSlots.indexOf(slot.time) === allSlots.indexOf(previousTime) + 1
          const connectsRight =
            selected &&
            nextTime != null &&
            selectedSet.has(nextTime) &&
            allSlots.indexOf(nextTime) === allSlots.indexOf(slot.time) + 1

          const baseConnectsLeft = connectsLeft && index % 4 !== 0
          const baseConnectsRight = connectsRight && (index + 1) % 4 !== 0
          const mdConnectsLeft = connectsLeft && index % 6 !== 0
          const mdConnectsRight = connectsRight && (index + 1) % 6 !== 0
          const xlConnectsLeft = connectsLeft && index % 8 !== 0
          const xlConnectsRight = connectsRight && (index + 1) % 8 !== 0

          return (
            <button
              key={slot.time}
              className={cn(
                'relative flex min-h-11 items-center justify-center gap-1 border px-2 py-2.5 text-xs font-medium transition-colors duration-150',
                selected
                  ? 'z-10 border-slot-selected-border bg-slot-selected text-slot-selected-foreground'
                  : slot.available
                    ? 'cursor-pointer border-slot-available-border bg-slot-available text-slot-available-foreground hover:border-slot-available-border-hover hover:bg-surface'
                    : 'cursor-not-allowed border-border bg-muted text-foreground-muted opacity-70',
                getRangeClasses(baseConnectsLeft, baseConnectsRight),
                getRangeClasses(mdConnectsLeft, mdConnectsRight, 'md:'),
                getRangeClasses(xlConnectsLeft, xlConnectsRight, 'xl:'),
                baseConnectsLeft && '-ml-1',
                mdConnectsLeft && 'md:-ml-1',
                xlConnectsLeft && 'xl:-ml-1',
              )}
              disabled={!slot.available}
              type="button"
              onClick={() => handleSelect(slot.time)}
            >
              {selected ? <span aria-hidden="true" className="text-[10px]">✓</span> : null}
              <span>{slot.time}</span>
              {!selected && !slot.available ? <span aria-hidden="true" className="text-[10px]">—</span> : null}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border border-slot-selected-border bg-slot-selected" />
          선택됨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border border-slot-available-border bg-slot-available" />
          예약 가능
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-flex size-2 items-center justify-center rounded-full border border-border bg-muted text-[8px] leading-none text-foreground-muted">
            —
          </span>
          예약 불가
        </span>
      </div>
      {selectionSummary ? <p className="text-sm text-foreground">선택: {selectionSummary}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  )
}

function formatSelectionSummary(selectedSlots: string[]) {
  if (selectedSlots.length === 0) {
    return null
  }

  const first = selectedSlots[0]
  const last = selectedSlots[selectedSlots.length - 1]
  const slotCount = selectedSlots.length

  return `${first} ~ ${addThirtyMinutes(last)} (${slotCount}칸, ${formatHours(slotCount)})`
}

function formatHours(slotCount: number) {
  const totalMinutes = slotCount * 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `${hours}시간`
  }

  if (hours === 0) {
    return `${minutes}분`
  }

  return `${hours}시간 ${minutes}분`
}

function addThirtyMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  const totalMinutes = hour * 60 + minute + 30
  const nextHour = Math.floor(totalMinutes / 60)
  const nextMinute = totalMinutes % 60

  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
}

function getRangeClasses(connectsLeft: boolean, connectsRight: boolean, prefix = '') {
  if (connectsLeft && connectsRight) {
    return `${prefix}rounded-none`
  }

  if (connectsLeft) {
    return `${prefix}rounded-l-none ${prefix}rounded-r-md`
  }

  if (connectsRight) {
    return `${prefix}rounded-l-md ${prefix}rounded-r-none`
  }

  return `${prefix}rounded-lg`
}

function createAllSlots() {
  const result: string[] = []

  for (let hour = 9; hour <= 23; hour += 1) {
    result.push(`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`)
  }

  return result
}
