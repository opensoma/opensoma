'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/client'
import { AuthenticationError } from '@/lib/sdk'

interface CreateReportState {
  error: string
}

export async function createReport(_prevState: CreateReportState, formData: FormData): Promise<CreateReportState> {
  const menteeRegion = String(formData.get('menteeRegion') ?? '')
  const reportType = String(formData.get('reportType') ?? '')
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

  if (
    !menteeRegion ||
    !reportType ||
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

  if (progressStartTime >= progressEndTime) {
    return { error: '종료 시간은 시작 시간보다 늦어야 합니다.' }
  }

  if (subject.length < 10) {
    return { error: '주제는 최소 10자 이상 입력해야 합니다.' }
  }

  if (content.length < 100) {
    return { error: '내용은 최소 100자 이상 입력해야 합니다.' }
  }

  const file = formData.get('evidenceFile') as File | null
  if (!file || file.size === 0) {
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
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const tempFileName = file.name

    await client.report.create(
      {
        menteeRegion: menteeRegion as 'S' | 'B',
        reportType: reportType as 'MRC010' | 'MRC020',
        progressDate,
        teamNames: teamNames || undefined,
        venue,
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
      buffer,
      tempFileName,
    )
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return { error: error instanceof Error ? error.message : '보고서 등록에 실패했습니다.' }
  }

  redirect('/report')
}
