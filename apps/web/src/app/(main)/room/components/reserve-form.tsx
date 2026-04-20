'use client'

import { useActionState, useEffect, useRef } from 'react'

import { reserveRoom } from '@/app/(main)/room/actions'
import { Button } from '@/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'

const initialState = { error: '', success: '' }

interface ReserveFormProps {
  roomId: number
  roomName: string
  date: string
  selectedSlots: string[]
  onSuccess?: (message: string) => void
}

export function ReserveForm({ roomId, roomName, date, selectedSlots, onSuccess }: ReserveFormProps) {
  const [state, formAction, isPending] = useActionState(reserveRoom, initialState)
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      onSuccess?.(state.success)
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-4 rounded-lg bg-background p-4 shadow-[var(--shadow-elevation-1)]">
      <input name="roomId" type="hidden" value={String(roomId)} />
      <input name="date" type="hidden" value={date} />
      <input name="slots" type="hidden" value={selectedSlots.join(',')} />

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{roomName} 예약 정보</h4>
        <p className="text-sm text-foreground-muted">
          {date} · {selectedSlots.join(', ')}
        </p>
      </div>

      <Field name="title">
        <FieldLabel>예약 제목</FieldLabel>
        <Input name="title" placeholder="예: 주간 팀 회의" />
      </Field>

      <Field name="attendees">
        <FieldLabel>참석 인원</FieldLabel>
        <FieldDescription>미입력 시 1명으로 예약됩니다.</FieldDescription>
        <Input min={1} name="attendees" placeholder="예: 4" type="number" />
      </Field>

      <Field name="notes">
        <FieldLabel>메모</FieldLabel>
        <Textarea name="notes" placeholder="회의 목적이나 참고 사항을 입력해주세요" />
      </Field>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <Button disabled={isPending || Boolean(state.success)} type="submit">
        {isPending ? '예약 중...' : '예약하기'}
      </Button>
    </form>
  )
}
