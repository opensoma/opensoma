'use client'

import { useActionState, useCallback, useRef, useState, useTransition } from 'react'

import { reserveRoomFromMentoring } from '@/app/(main)/mentoring/new/actions'
import {
  ExistingReservationSelector,
  type RoomReservation,
} from '@/app/(main)/mentoring/new/components/existing-reservation-selector'
import {
  MentoringRoomTimeline,
  type TimelineSelection,
} from '@/app/(main)/mentoring/new/components/mentoring-room-timeline'
import { addThirtyMinutes } from '@/app/(main)/room/lib/room-mentoring'
import { Breadcrumb } from '@/components/breadcrumb'
import { RichTextEditor } from '@/components/rich-text-editor/editor'
import type { MentoringDetail, RoomCard } from '@/lib/sdk'
import { venues } from '@/lib/venues'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/ui/collapsible'
import { DatePicker } from '@/ui/date-picker'
import { Field, FieldDescription, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import { RadioGroup, RadioItem } from '@/ui/radio-group'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '@/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

import { updateMentoring } from '../actions'

interface MentoringEditFormProps {
  mentoring: MentoringDetail
  initialRooms: RoomCard[]
  existingReservations: RoomReservation[]
  hasCancelledReservations?: boolean
  includeCancelled?: boolean
}

const startTimes = createTimeRange(9, 0, 23, 0)
const endTimes = [...createTimeRange(10, 0, 23, 30), '24:00']

function isSmallRoom(name: string) {
  return /^스페이스 A\d$/.test(name)
}

function mentoringTypeToFormValue(type: string): 'free' | 'lecture' {
  return type === '멘토 특강' ? 'lecture' : 'free'
}

export function MentoringEditForm({
  mentoring,
  initialRooms,
  existingReservations,
  hasCancelledReservations = false,
  includeCancelled = false,
}: MentoringEditFormProps) {
  const hasAnyReservations = existingReservations.length > 0 || hasCancelledReservations
  const initialType = mentoringTypeToFormValue(mentoring.type)
  const boundUpdateMentoring = useCallback(
    (prevState: { error: string }, formData: FormData) => updateMentoring(mentoring.id, prevState, formData),
    [mentoring.id],
  )
  const [state, formAction, isPending] = useActionState(boundUpdateMentoring, { error: '' })
  const [mode, setMode] = useState<'timeline' | 'existing' | 'manual'>('manual')
  const [mentoringType, setMentoringType] = useState<'free' | 'lecture'>(initialType)
  const isLecture = mentoringType === 'lecture'
  const titleRef = useRef<HTMLInputElement>(null)

  const [manualDate, setManualDate] = useState(mentoring.sessionDate)
  const [manualVenue, setManualVenue] = useState(mentoring.venue)
  const [manualStartTime, setManualStartTime] = useState(mentoring.sessionTime.start)
  const [manualEndTime, setManualEndTime] = useState(mentoring.sessionTime.end)

  const [timelineSelection, setTimelineSelection] = useState<TimelineSelection | null>(null)
  const [reserveTitle, setReserveTitle] = useState('')
  const [reserveState, setReserveState] = useState({ error: '', success: '' })
  const [isReserving, startReserveTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [contentHtml, setContentHtml] = useState(mentoring.content)

  const isExistingMode = mode === 'existing'
  const isTimelineMode = mode === 'timeline'
  const hasSelection = timelineSelection !== null

  const derivedDate = (isTimelineMode || isExistingMode) && hasSelection ? timelineSelection.date : manualDate
  const derivedStartTime =
    (isTimelineMode || isExistingMode) && hasSelection ? timelineSelection.selectedSlots[0] : manualStartTime
  const derivedEndTime =
    (isTimelineMode || isExistingMode) && hasSelection
      ? addThirtyMinutes(timelineSelection.selectedSlots[timelineSelection.selectedSlots.length - 1])
      : manualEndTime
  const derivedVenue = (isTimelineMode || isExistingMode) && hasSelection ? timelineSelection.roomName : manualVenue

  function handleTimelineSelect(selection: TimelineSelection | null) {
    setTimelineSelection(selection)
    setConfirmed(false)
    setReserveState({ error: '', success: '' })
    if (selection && titleRef.current) {
      setReserveTitle(titleRef.current.value)
    }
  }

  function handleReserve() {
    if (!timelineSelection || !reserveTitle.trim()) return

    startReserveTransition(async () => {
      const result = await reserveRoomFromMentoring({
        venue: timelineSelection.roomName,
        date: timelineSelection.date,
        slots: timelineSelection.selectedSlots,
        title: reserveTitle.trim(),
      })

      setReserveState(result)

      if (result.success) {
        setConfirmed(true)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: '멘토링/특강', href: '/mentoring' },
          { label: mentoring.title, href: `/mentoring/${mentoring.id}` },
          { label: '수정' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">멘토링 수정</h1>
        <p className="text-sm text-foreground-muted">멘토링 일정을 수정합니다.</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">기본 정보</h2>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <input name="date" type="hidden" value={derivedDate} />
            <input name="startTime" type="hidden" value={derivedStartTime} />
            <input name="endTime" type="hidden" value={derivedEndTime} />
            <input name="venue" type="hidden" value={derivedVenue} />

            <Field className="space-y-3" name="type">
              <FieldLabel>유형</FieldLabel>
              <RadioGroup
                name="type"
                value={mentoringType}
                onValueChange={(value) => {
                  const next = value as 'free' | 'lecture'
                  setMentoringType(next)
                  if (next === 'lecture') {
                    if (timelineSelection && isSmallRoom(timelineSelection.roomName)) {
                      setTimelineSelection(null)
                      setConfirmed(false)
                      setReserveState({ error: '', success: '' })
                    }
                    if (isSmallRoom(manualVenue)) {
                      setManualVenue('')
                    }
                  }
                }}
              >
                <RadioItem value="free">자유 멘토링</RadioItem>
                <RadioItem value="lecture">멘토 특강</RadioItem>
              </RadioGroup>
            </Field>

            <Field name="title">
              <FieldLabel>제목</FieldLabel>
              <Input
                ref={titleRef}
                defaultValue={mentoring.title}
                name="title"
                placeholder="세션 제목을 입력해주세요"
              />
            </Field>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">장소 및 시간</h3>
                <ToggleGroup value={mode} onValueChange={(v) => setMode(v as 'timeline' | 'existing' | 'manual')}>
                  <ToggleGroupItem value="timeline">회의실 예약</ToggleGroupItem>
                  {hasAnyReservations && <ToggleGroupItem value="existing">기존 예약</ToggleGroupItem>}
                  <ToggleGroupItem value="manual">외부 / 온라인</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {mode === 'existing' ? (
                <div className="space-y-4">
                  {hasSelection ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4">
                      <span className="text-lg">✅</span>
                      <span className="text-sm text-foreground">
                        {timelineSelection.roomName} · {derivedStartTime} ~ {derivedEndTime} 선택됨
                      </span>
                    </div>
                  ) : null}
                  <ExistingReservationSelector
                    reservations={existingReservations}
                    onSelect={handleTimelineSelect}
                    includeCancelled={includeCancelled}
                  />
                </div>
              ) : mode === 'timeline' ? (
                <div className="space-y-4">
                  {confirmed && timelineSelection ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4">
                      <span className="text-lg">✅</span>
                      <span className="text-sm text-foreground">
                        {timelineSelection.roomName} · {derivedStartTime} ~ {derivedEndTime} 예약 완료
                      </span>
                    </div>
                  ) : null}

                  <Collapsible open={!confirmed} onOpenChange={(open) => setConfirmed(!open)}>
                    <CollapsibleTrigger>회의실 타임라인</CollapsibleTrigger>
                    <CollapsiblePanel>
                      <div className="space-y-4">
                        <MentoringRoomTimeline
                          excludeSmallRooms={isLecture}
                          initialDate={mentoring.sessionDate}
                          initialRooms={initialRooms}
                          onSelect={handleTimelineSelect}
                        />

                        {timelineSelection && timelineSelection.selectedSlots.length > 0 && !confirmed ? (
                          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                            <h4 className="text-sm font-semibold text-foreground">
                              {timelineSelection.roomName} 회의실 예약
                            </h4>
                            <Field name="reserveTitle">
                              <FieldLabel>예약 제목</FieldLabel>
                              <Input
                                placeholder="예: 멘토링 회의실 예약"
                                value={reserveTitle}
                                onChange={(e) => setReserveTitle(e.target.value)}
                              />
                            </Field>
                            <Field name="reserveAttendees">
                              <FieldLabel>참석 인원</FieldLabel>
                              <Input min={1} placeholder="예: 4" type="number" />
                            </Field>
                            {reserveState.error ? <p className="text-sm text-danger">{reserveState.error}</p> : null}
                            <Button
                              disabled={isReserving || !reserveTitle.trim()}
                              type="button"
                              onClick={handleReserve}
                            >
                              {isReserving ? '예약 중...' : '회의실 예약하기'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CollapsiblePanel>
                  </Collapsible>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Field name="manualDate">
                      <FieldLabel>진행 날짜</FieldLabel>
                      <DatePicker value={manualDate} onValueChange={setManualDate} placeholder="날짜를 선택하세요" />
                    </Field>
                    <Field name="manualVenue">
                      <FieldLabel>장소</FieldLabel>
                      <Select value={manualVenue} onValueChange={setManualVenue}>
                        <SelectTrigger placeholder="장소를 선택하세요" />
                        <SelectPopup>
                          {venues.map((group) => {
                            const filtered = isLecture ? group.items.filter((item) => !isSmallRoom(item)) : group.items
                            if (filtered.length === 0) return null
                            return (
                              <SelectGroup key={group.group} label={group.group}>
                                {filtered.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )
                          })}
                        </SelectPopup>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Field name="manualStartTime">
                      <FieldLabel>시작 시간</FieldLabel>
                      <Select value={manualStartTime} onValueChange={setManualStartTime}>
                        <SelectTrigger placeholder="시작 시간을 선택하세요" />
                        <SelectPopup>
                          <SelectGroup label="시작 시간">
                            {startTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectPopup>
                      </Select>
                    </Field>
                    <Field name="manualEndTime">
                      <FieldLabel>종료 시간</FieldLabel>
                      <Select value={manualEndTime} onValueChange={setManualEndTime}>
                        <SelectTrigger placeholder="종료 시간을 선택하세요" />
                        <SelectPopup>
                          <SelectGroup label="종료 시간">
                            {endTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectPopup>
                      </Select>
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field name="maxAttendees">
                <FieldLabel>모집 인원</FieldLabel>
                <Input
                  defaultValue={mentoring.attendees.max}
                  min={isLecture ? 6 : 1}
                  name="maxAttendees"
                  placeholder={isLecture ? '최소 6명' : '예: 6'}
                  type="number"
                />
              </Field>
              <Field name="regStart">
                <FieldLabel>접수 시작일</FieldLabel>
                <DatePicker
                  defaultValue={mentoring.registrationPeriod.start}
                  name="regStart"
                  placeholder="접수 시작일"
                />
              </Field>
              <Field name="regEnd">
                <FieldLabel>접수 종료일</FieldLabel>
                <DatePicker defaultValue={mentoring.registrationPeriod.end} name="regEnd" placeholder="접수 종료일" />
              </Field>
            </div>

            <Field name="content">
              <FieldLabel>상세 내용</FieldLabel>
              <FieldDescription>멘토링 소개, 준비물, 참여 안내 등을 작성해주세요.</FieldDescription>
              <input name="content" type="hidden" value={contentHtml} />
              <RichTextEditor initialContent={mentoring.content} onUpdate={setContentHtml} />
            </Field>

            {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button formAction={`/mentoring/${mentoring.id}`} formMethod="get" type="submit" variant="ghost">
                취소
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? '수정 중...' : '수정하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function createTimeRange(startHour: number, startMinute: number, endHour: number, endMinute: number) {
  const result: string[] = []

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === startHour && minute < startMinute) {
        continue
      }

      if (hour === endHour && minute > endMinute) {
        continue
      }

      result.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    }
  }

  return result
}
