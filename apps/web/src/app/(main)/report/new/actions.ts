'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/client'
import { reportPlaceCdFor } from '@/lib/report-places'
import { AuthenticationError, REPORT_CD, type ReportCd } from '@/lib/sdk'

interface CreateReportState {
  error: string
}

function parseReportType(value: string): ReportCd | null {
  switch (value) {
    case REPORT_CD.PUBLIC_MENTORING:
    case REPORT_CD.MENTOR_LECTURE:
    case REPORT_CD.REGULAR_MENTORING:
      return value
    default:
      return null
  }
}

function parseMenteeRegion(value: string): 'S' | 'B' | null {
  switch (value) {
    case 'S':
    case 'B':
      return value
    default:
      return null
  }
}

export async function createReport(_prevState: CreateReportState, formData: FormData): Promise<CreateReportState> {
  const menteeRegion = parseMenteeRegion(String(formData.get('menteeRegion') ?? ''))
  const reportType = parseReportType(String(formData.get('reportType') ?? ''))
  const progressDate = String(formData.get('progressDate') ?? '')
  const teamNames = String(formData.get('teamNames') ?? '').trim()
  const venue = String(formData.get('venue') ?? '').trim()
  const attendanceCount = String(formData.get('attendanceCount') ?? '')
  const attendanceNames = String(formData.get('attendanceNames') ?? '').trim()
  const progressStartTime = String(formData.get('progressStartTime') ?? '')
  const progressEndTime = String(formData.get('progressEndTime') ?? '')
  const exceptStartTime = String(formData.get('exceptStartTime') ?? '')
  const exceptEndTime = String(formData.get('exceptEndTime') ?? '')
  const exceptReason = String(formData.get('exceptReason') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const mentorOpinion = String(formData.get('mentorOpinion') ?? '').trim()
  const nonAttendanceNames = String(formData.get('nonAttendanceNames') ?? '').trim()
  const etc = String(formData.get('etc') ?? '').trim()

  if (reportType === REPORT_CD.REGULAR_MENTORING && !teamNames) {
    return { error: '정규 멘토링은 담당 팀명을 입력해주세요.' }
  }

  if (
    !menteeRegion ||
    reportType === null ||
    !progressDate ||
    !venue ||
    !attendanceCount ||
    !attendanceNames ||
    !progressStartTime ||
    !progressEndTime ||
    !subject ||
    !content
  ) {
    return { error: '필수 항목을 모두 입력해주세요.' }
  }

  // The server drops a place the region does not offer and saves the report with an
  // empty 장소 instead of failing, so a mismatched pair has to be caught here. Resolve
  // before checking, so a label or an older spelling is accepted and submitted as a cd.
  const progressPlace = reportPlaceCdFor(venue, menteeRegion)
  if (!progressPlace) {
    return { error: '선택한 멘티 지역에서 사용할 수 없는 장소입니다.' }
  }

  if (progressStartTime >= progressEndTime) {
    return { error: '종료 시간은 시작 시간보다 늦어야 합니다.' }
  }

  if (subject.length < 10) {
    return { error: '주제는 최소 10자 이상 입력해야 합니다.' }
  }

  if (content.length < 100) {
    return { error: '내용은 최소 100자 이상 입력해야 합니다.' }
  }

  const evidenceFiles = formData
    .getAll('evidenceFile')
    .filter((file): file is File => file instanceof File && file.size > 0)
  if (evidenceFiles.length === 0 && reportType !== REPORT_CD.REGULAR_MENTORING) {
    return { error: '증빙 파일을 첨부해주세요.' }
  }

  if ((exceptStartTime && !exceptEndTime) || (!exceptStartTime && exceptEndTime)) {
    return { error: '휴식 시작 시간과 종료 시간을 모두 입력하거나 모두 비워두세요.' }
  }

  if (exceptStartTime && exceptEndTime && exceptStartTime >= exceptEndTime) {
    return { error: '휴식 종료 시간은 휴식 시작 시간보다 늦어야 합니다.' }
  }

  try {
    const client = await createClient()
    const fileEntries = await Promise.all(
      evidenceFiles.map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        name: f.name,
      })),
    )

    await client.report.create(
      {
        menteeRegion,
        reportType,
        progressDate,
        teamNames: teamNames || undefined,
        venue: progressPlace,
        attendanceCount: Number(attendanceCount),
        attendanceNames,
        progressStartTime,
        progressEndTime,
        exceptStartTime: exceptStartTime || undefined,
        exceptEndTime: exceptEndTime || undefined,
        exceptReason: exceptReason || undefined,
        subject,
        content,
        mentorOpinion: mentorOpinion || undefined,
        nonAttendanceNames: nonAttendanceNames || undefined,
        etc: etc || undefined,
      },
      fileEntries,
    )
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '보고서 등록에 실패했습니다.' }
  }

  redirect('/report')
}
