'use client'

import { useActionState, useRef, useState } from 'react'

import { createReport } from '@/app/(main)/report/new/actions'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/ui/collapsible'
import { DatePicker } from '@/ui/date-picker'
import { Field, FieldDescription, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import { RadioGroup, RadioItem } from '@/ui/radio-group'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '@/ui/select'
import { Textarea } from '@/ui/textarea'

const initialState = { error: '' }

const reportTypes = [
  { value: 'MRC010', label: '자유 멘토링' },
  { value: 'MRC020', label: '멘토 특강' },
]

const regions = [
  { value: 'S', label: '서울' },
  { value: 'B', label: '부산' },
]

const startTimes = createTimeRange(9, 0, 23, 0)
const endTimes = [...createTimeRange(10, 0, 23, 30), '24:00']

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

export function ReportCreateForm() {
  const [state, formAction, isPending] = useActionState(createReport, initialState)
  const [reportType, setReportType] = useState('MRC010')
  const [region, setRegion] = useState('S')
  const [progressDate, setProgressDate] = useState('')
  const [venue, setVenue] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [exceptStartTime, setExceptStartTime] = useState('')
  const [exceptEndTime, setExceptEndTime] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileName(file?.name ?? '')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">보고서 등록</h1>
        <p className="text-sm text-foreground-muted">멘토링 보고서를 작성하세요.</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">보고서 정보</h2>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Field className="space-y-3" name="reportType">
                <FieldLabel>보고서 유형</FieldLabel>
                <RadioGroup name="reportType" value={reportType} onValueChange={setReportType}>
                  {reportTypes.map((type) => (
                    <RadioItem key={type.value} value={type.value}>
                      {type.label}
                    </RadioItem>
                  ))}
                </RadioGroup>
              </Field>

              <Field className="space-y-3" name="menteeRegion">
                <FieldLabel>멘티 지역</FieldLabel>
                <RadioGroup name="menteeRegion" value={region} onValueChange={setRegion}>
                  {regions.map((r) => (
                    <RadioItem key={r.value} value={r.value}>
                      {r.label}
                    </RadioItem>
                  ))}
                </RadioGroup>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field name="progressDate">
                <FieldLabel>진행일</FieldLabel>
                <DatePicker
                  name="progressDate"
                  value={progressDate}
                  onValueChange={setProgressDate}
                  placeholder="날짜를 선택하세요"
                />
              </Field>

              <Field name="venue">
                <FieldLabel>장소</FieldLabel>
                <Select value={venue} onValueChange={setVenue}>
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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field name="progressStartTime">
                <FieldLabel>시작 시간</FieldLabel>
                <Select value={startTime} onValueChange={setStartTime}>
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

              <Field name="progressEndTime">
                <FieldLabel>종료 시간</FieldLabel>
                <Select value={endTime} onValueChange={setEndTime}>
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

            <div className="grid gap-6 md:grid-cols-2">
              <Field name="attendanceCount">
                <FieldLabel>참석 인원</FieldLabel>
                <Input name="attendanceCount" min={1} placeholder="예: 4" type="number" />
              </Field>

              <Field name="teamNames">
                <FieldLabel>팀명</FieldLabel>
                <FieldDescription>참여한 팀명을 쉼표로 구분하여 입력하세요.</FieldDescription>
                <Input name="teamNames" placeholder="예: 팀 A, 팀 B" />
              </Field>
            </div>

            <Field name="attendanceNames">
              <FieldLabel>참석자 명단</FieldLabel>
              <FieldDescription>참석자 이름을 쉼표로 구분하여 입력하세요.</FieldDescription>
              <Textarea name="attendanceNames" placeholder="예: 홍길동, 김철수, 이영희" rows={2} />
            </Field>

            <Field name="nonAttendanceNames">
              <FieldLabel>불참자 명단</FieldLabel>
              <FieldDescription>불참자 이름을 쉼표로 구분하여 입력하세요.</FieldDescription>
              <Textarea name="nonAttendanceNames" placeholder="예: 박민수 (선택사항)" rows={2} />
            </Field>

            <Collapsible>
              <CollapsibleTrigger>휴식 시간 (선택사항)</CollapsibleTrigger>
              <CollapsiblePanel>
                <div className="grid gap-6 pt-4 md:grid-cols-2">
                  <Field name="exceptStartTime">
                    <FieldLabel>휴식 시작</FieldLabel>
                    <Select value={exceptStartTime} onValueChange={setExceptStartTime}>
                      <SelectTrigger placeholder="휴식 시작 시간" />
                      <SelectPopup>
                        <SelectGroup label="휴식 시작">
                          {startTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectPopup>
                    </Select>
                  </Field>

                  <Field name="exceptEndTime">
                    <FieldLabel>휴식 종료</FieldLabel>
                    <Select value={exceptEndTime} onValueChange={setExceptEndTime}>
                      <SelectTrigger placeholder="휴식 종료 시간" />
                      <SelectPopup>
                        <SelectGroup label="휴식 종료">
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

                <Field name="exceptReason" className="mt-4">
                  <FieldLabel>휴식 사유</FieldLabel>
                  <Input name="exceptReason" placeholder="예: 점심 시간" />
                </Field>
              </CollapsiblePanel>
            </Collapsible>

            <Field name="subject">
              <FieldLabel>주제</FieldLabel>
              <FieldDescription>최소 10자 이상 입력해야 합니다.</FieldDescription>
              <Input name="subject" placeholder="멘토링 주제를 입력하세요" />
            </Field>

            <Field name="content">
              <FieldLabel>내용</FieldLabel>
              <FieldDescription>최소 100자 이상 입력해야 합니다.</FieldDescription>
              <Textarea name="content" placeholder="멘토링 내용을 입력하세요" rows={8} />
            </Field>

            <Field name="mentorOpinion">
              <FieldLabel>멘토 의견</FieldLabel>
              <Textarea
                name="mentorOpinion"
                placeholder="멘토링에 대한 의견이나 소감을 작성하세요 (선택사항)"
                rows={4}
              />
            </Field>

            <Field name="etc">
              <FieldLabel>기타</FieldLabel>
              <Textarea name="etc" placeholder="기타 사항을 입력하세요 (선택사항)" rows={2} />
            </Field>

            <Field name="evidenceFile">
              <FieldLabel>증빙 파일</FieldLabel>
              <FieldDescription>멘토링 증빙 파일을 첨부해주세요 (필수)</FieldDescription>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  accept="*/*"
                  name="evidenceFile"
                  onChange={handleFileChange}
                  type="file"
                  className="hidden"
                />
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  파일 선택
                </Button>
                <span className="text-sm text-foreground-muted">{fileName || '선택된 파일 없음'}</span>
              </div>
            </Field>

            {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button formAction="/report" formMethod="get" type="submit" variant="ghost">
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
