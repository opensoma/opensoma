'use client'

import { useActionState } from 'react'

import { createMentoring } from '~/app/(main)/mentoring/create/actions'
import { Button } from '~/ui/button'
import { Card, CardContent, CardHeader } from '~/ui/card'
import { Field, FieldDescription, FieldLabel } from '~/ui/field'
import { Input } from '~/ui/input'
import { RadioGroup, RadioItem } from '~/ui/radio-group'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '~/ui/select'
import { Textarea } from '~/ui/textarea'

const initialState = { error: '' }

const venues = [
  {
    group: '토즈 (외부)',
    items: [
      '광화문점',
      '양재점',
      '강남컨퍼런스센터점',
      '건대점',
      '강남역토즈타워점',
      '선릉점',
      '역삼점',
      '홍대점',
      '신촌비즈니스센터점',
    ],
  },
  { group: '온라인', items: ['온라인(Webex)'] },
  {
    group: '소마 내부 (12층)',
    items: [
      '스페이스 A1',
      '스페이스 A2',
      '스페이스 A3',
      '스페이스 A4',
      '스페이스 A5',
      '스페이스 A6',
      '스페이스 A7',
      '스페이스 A8',
      '스페이스 M1',
      '스페이스 M2',
    ],
  },
  { group: '소마 내부 (7층)', items: ['스페이스 S'] },
]

const startTimes = createTimeRange(9, 0, 23, 0)
const endTimes = [...createTimeRange(10, 0, 23, 30), '24:00']

export default function MentoringCreatePage() {
  const [state, formAction, isPending] = useActionState(createMentoring, initialState)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">멘토링 등록</h1>
        <p className="text-sm text-foreground-muted">자유 멘토링 또는 멘토 특강 일정을 등록하세요.</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">기본 정보</h2>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <Field className="space-y-3" name="type">
              <FieldLabel>유형</FieldLabel>
              <RadioGroup defaultValue="free" name="type">
                <RadioItem value="free">자유 멘토링</RadioItem>
                <RadioItem value="lecture">멘토 특강</RadioItem>
              </RadioGroup>
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field name="title">
                <FieldLabel>제목</FieldLabel>
                <Input name="title" placeholder="세션 제목을 입력해주세요" />
              </Field>
              <Field name="date">
                <FieldLabel>진행 날짜</FieldLabel>
                <Input name="date" type="date" />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field name="startTime">
                <FieldLabel>시작 시간</FieldLabel>
                <Select defaultValue="" name="startTime">
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
              <Field name="endTime">
                <FieldLabel>종료 시간</FieldLabel>
                <Select defaultValue="" name="endTime">
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

            <Field name="venue">
              <FieldLabel>장소</FieldLabel>
              <Select defaultValue="" name="venue">
                <SelectTrigger placeholder="장소를 선택하세요" />
                <SelectPopup>
                  {venues.map((group) => (
                    <SelectGroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectPopup>
              </Select>
            </Field>

            <div className="grid gap-6 md:grid-cols-3">
              <Field name="maxAttendees">
                <FieldLabel>모집 인원</FieldLabel>
                <Input min={1} name="maxAttendees" placeholder="예: 6" type="number" />
              </Field>
              <Field name="regStart">
                <FieldLabel>접수 시작일</FieldLabel>
                <Input name="regStart" type="date" />
              </Field>
              <Field name="regEnd">
                <FieldLabel>접수 종료일</FieldLabel>
                <Input name="regEnd" type="date" />
              </Field>
            </div>

            <Field name="content">
              <FieldLabel>상세 내용</FieldLabel>
              <FieldDescription>멘토링 소개, 준비물, 참여 안내 등을 작성해주세요.</FieldDescription>
              <Textarea className="min-h-48" name="content" placeholder="세션 설명을 입력해주세요" />
            </Field>

            {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button formAction="/mentoring" formMethod="get" type="submit" variant="ghost">
                목록으로
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? '등록 중...' : '등록하기'}
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
