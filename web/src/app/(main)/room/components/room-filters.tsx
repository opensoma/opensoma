'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Button } from '~/ui/button'
import { Field, FieldLabel } from '~/ui/field'
import { Input } from '~/ui/input'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '~/ui/select'

const roomOptions = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'M1', 'M2']

interface RoomFiltersProps {
  date: string
  room: string
}

export function RoomFilters({ date, room }: RoomFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(date)
  const [selectedRoom, setSelectedRoom] = useState(room)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams(searchParams.toString())

    if (selectedDate) {
      next.set('date', selectedDate)
    } else {
      next.delete('date')
    }

    if (selectedRoom) {
      next.set('room', selectedRoom)
    } else {
      next.delete('room')
    }

    router.push(`${pathname}?${next.toString()}`)
  }

  function handleReset() {
    setSelectedDate(date)
    setSelectedRoom('')
    router.push(pathname)
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_auto]"
      onSubmit={handleSubmit}
    >
      <Field name="date">
        <FieldLabel>예약 날짜</FieldLabel>
        <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
      </Field>
      <Field name="room">
        <FieldLabel>회의실</FieldLabel>
        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
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
        <Button type="submit">조회</Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          초기화
        </Button>
      </div>
    </form>
  )
}
