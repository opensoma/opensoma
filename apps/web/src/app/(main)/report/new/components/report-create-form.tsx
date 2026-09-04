'use client'

import { useSearchParams } from 'next/navigation'
import { useActionState, useRef, useState } from 'react'

import { createReport } from '@/app/(main)/report/new/actions'
import { reportPlaceForRegion, reportPlacesForRegion, toMenteeRegion } from '@/lib/report-places'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/ui/collapsible'
import { DatePicker } from '@/ui/date-picker'
import { Field, FieldDescription, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import { RadioGroup, RadioItem } from '@/ui/radio-group'
import { Select, SelectGroup, SelectItem, SelectPopup, SelectTrigger } from '@/ui/select'
import { Textarea } from '@/ui/textarea'

import type { RegularReportDefaults } from '../lib/regular-report-defaults'

const initialState = { error: '' }

const reportTypes = [
  { value: 'MRC010', label: '자유 멘토링' },
  { value: 'MRC020', label: '멘토 특강' },
  { value: 'MRC990', label: '정규 멘토링' },
]

const regions = [
  { value: 'S', label: '서울' },
  { value: 'B', label: '부산' },
]

const startTimes = createTimeRange(9, 0, 23, 0)
const endTimes = [...createTimeRange(10, 0, 23, 30), '24:00']

const emptyDefaults: RegularReportDefaults = {
  teamNames: '',
  attendanceNames: '',
  attendanceCount: '',
}

export function ReportCreateForm({ defaults = emptyDefaults }: { readonly defaults?: RegularReportDefaults }) {
  const searchParams = useSearchParams()
  const [state, formAction, isPending] = useActionState(createReport, initialState)
  const initialReportType = searchParams.get('reportType') ?? 'MRC010'
  const [reportType, setReportType] = useState(initialReportType)
  const initialRegion = toMenteeRegion(searchParams.get('menteeRegion') ?? '')
  const [region, setRegion] = useState<string>(initialRegion)
  const [progressDate, setProgressDate] = useState(searchParams.get('progressDate') ?? '')
  const [venue, setVenue] = useState(reportPlaceForRegion(searchParams.get('venue') ?? '', initialRegion))
  const [startTime, setStartTime] = useState(searchParams.get('progressStartTime') ?? '')
  const [endTime, setEndTime] = useState(searchParams.get('progressEndTime') ?? '')
  const [attendanceCount, setAttendanceCount] = useState(
    searchParams.get('attendanceCount') ?? (initialReportType === 'MRC990' ? defaults.attendanceCount : ''),
  )
  const [teamNames, setTeamNames] = useState(
    searchParams.get('teamNames') ?? (initialReportType === 'MRC990' ? defaults.teamNames : ''),
  )
  const [attendanceNames, setAttendanceNames] = useState(
    searchParams.get('attendanceNames') ?? (initialReportType === 'MRC990' ? defaults.attendanceNames : ''),
  )
  const [exceptStartTime, setExceptStartTime] = useState('')
  const [exceptEndTime, setExceptEndTime] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isRegularReport = reportType === 'MRC990'
  const places = reportPlacesForRegion(region)

  // Native refetches the place list on every 멘티 지역 change and rebuilds the select
  // with an empty selection, so the previous pick never carries over.
  const handleRegionChange = (nextRegion: string) => {
    setRegion(nextRegion)
    setVenue('')
  }

  const handleReportTypeChange = (nextReportType: string) => {
    setReportType(nextReportType)
    if (nextReportType !== 'MRC990') return

    setAttendanceCount((current) => current || defaults.attendanceCount)
    setTeamNames((current) => current || defaults.teamNames)
    setAttendanceNames((current) => current || defaults.attendanceNames)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []))
  }

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      for (const f of updated) dt.items.add(f)
      fileInputRef.current.files = dt.files
    }
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
                <RadioGroup name="reportType" value={reportType} onValueChange={handleReportTypeChange}>
                  {reportTypes.map((type) => (
                    <RadioItem key={type.value} value={type.value}>
                      {type.label}
                    </RadioItem>
                  ))}
                </RadioGroup>
              </Field>

              <Field className="space-y-3" name="menteeRegion">
                <FieldLabel>멘티 지역</FieldLabel>
                <RadioGroup name="menteeRegion" value={region} onValueChange={handleRegionChange}>
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
                    <SelectGroup label="장소">
                      {places.map((place) => (
                        <SelectItem key={place.cd} value={place.cd}>
                          {place.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
                <Input
                  name="attendanceCount"
                  min={1}
                  placeholder="예: 4"
                  type="number"
                  value={attendanceCount}
                  onChange={(event) => setAttendanceCount(event.currentTarget.value)}
                />
              </Field>

              <Field name="teamNames">
                <FieldLabel>팀명</FieldLabel>
                <FieldDescription>
                  {isRegularReport
                    ? '정규 멘토링은 참여한 담당 팀명을 반드시 입력해야 합니다.'
                    : '참여한 팀명을 쉼표로 구분하여 입력하세요.'}
                </FieldDescription>
                <Input
                  name="teamNames"
                  placeholder={isRegularReport ? '담당 팀명' : '예: Team Alpha'}
                  required={isRegularReport}
                  value={teamNames}
                  onChange={(event) => setTeamNames(event.currentTarget.value)}
                />
              </Field>
            </div>

            <Field name="attendanceNames">
              <FieldLabel>참석자 명단</FieldLabel>
              <FieldDescription>참석자 이름을 쉼표로 구분하여 입력하세요.</FieldDescription>
              <Textarea
                name="attendanceNames"
                placeholder="예: Trainee One, Trainee Two"
                rows={2}
                value={attendanceNames}
                onChange={(event) => setAttendanceNames(event.currentTarget.value)}
              />
            </Field>

            <Field name="nonAttendanceNames">
              <FieldLabel>불참자 명단</FieldLabel>
              <FieldDescription>불참자 이름을 쉼표로 구분하여 입력하세요.</FieldDescription>
              <Textarea name="nonAttendanceNames" placeholder="예: Trainee Three (선택사항)" rows={2} />
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
              <Input
                name="subject"
                placeholder="멘토링 주제를 입력하세요"
                defaultValue={searchParams.get('subject') ?? ''}
              />
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
              <FieldDescription>
                {isRegularReport
                  ? '정규 멘토링은 증빙 파일 없이 등록할 수 있습니다.'
                  : '멘토링 증빙 파일을 첨부해주세요 (필수)'}
              </FieldDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    accept="*/*"
                    multiple
                    name="evidenceFile"
                    onChange={handleFileChange}
                    type="file"
                    className="hidden"
                  />
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    파일 선택
                  </Button>
                  {files.length === 0 && <span className="text-sm text-foreground-muted">선택된 파일 없음</span>}
                </div>
                {files.length > 0 && (
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center gap-2 text-sm">
                        <span className="max-w-xs truncate text-foreground">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          aria-label={`${file.name} 삭제`}
                        >
                          ✕
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
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
