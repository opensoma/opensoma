import { beforeEach, describe, expect, it, mock } from 'bun:test'

class RedirectSignal extends Error {
  constructor(public readonly target: string) {
    super(`NEXT_REDIRECT:${target}`)
  }
}

class AuthenticationError extends Error {
  override name = 'AuthenticationError'
}

interface ReportCreateCall {
  options: Record<string, unknown>
  files: Array<{ buffer: Buffer; name: string }>
}

const reportCreateCalls: ReportCreateCall[] = []

mock.module('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))

mock.module('@/lib/sdk', () => ({
  AuthenticationError,
  REPORT_CD: {
    PUBLIC_MENTORING: 'MRC010',
    MENTOR_LECTURE: 'MRC020',
    REGULAR_MENTORING: 'MRC990',
  },
}))

mock.module('@/lib/client', () => ({
  createClient: async () => ({
    report: {
      create: async (options: Record<string, unknown>, files: Array<{ buffer: Buffer; name: string }> = []) => {
        reportCreateCalls.push({ options, files })
      },
    },
  }),
}))

const { createReport } = await import('./actions')

function buildReportFormData(reportType: string): FormData {
  const formData = new FormData()
  formData.set('menteeRegion', 'S')
  formData.set('reportType', reportType)
  formData.set('progressDate', '2026-06-04')
  formData.set('teamNames', 'Team Alpha')
  formData.set('venue', '스페이스 A1')
  formData.set('attendanceCount', '2')
  formData.set('attendanceNames', 'Trainee One, Trainee Two')
  formData.set('progressStartTime', '10:00')
  formData.set('progressEndTime', '12:00')
  formData.set('subject', '정규 멘토링 보고 주제')
  formData.set(
    'content',
    '정규 멘토링에서 담당 팀 연수생과 진행한 내용을 충분히 기록합니다. 팀명은 사용자에게 확인한 담당 팀을 사용해야 합니다. 보고 내용은 기존 보고서 길이 기준을 충족하도록 자세히 작성합니다.',
  )
  return formData
}

describe('createReport action', () => {
  beforeEach(() => {
    reportCreateCalls.length = 0
  })

  it('submits regular mentoring reports without evidence files', async () => {
    const thrown = await createReport({ error: '' }, buildReportFormData('MRC990')).catch((error: unknown) => error)

    expect(thrown).toBeInstanceOf(RedirectSignal)
    if (!(thrown instanceof RedirectSignal)) throw new Error('Expected redirect after successful report creation')
    expect(thrown.target).toBe('/report')
    expect(reportCreateCalls).toHaveLength(1)
    expect(reportCreateCalls[0]?.options.reportType).toBe('MRC990')
    expect(reportCreateCalls[0]?.options.teamNames).toBe('Team Alpha')
    expect(reportCreateCalls[0]?.files).toEqual([])
  })

  it('requires a team name for regular mentoring reports', async () => {
    const formData = buildReportFormData('MRC990')
    formData.set('teamNames', '')

    const result = await createReport({ error: '' }, formData)

    expect(result).toEqual({ error: '정규 멘토링은 담당 팀명을 입력해주세요.' })
    expect(reportCreateCalls).toEqual([])
  })

  it('keeps evidence files required for public mentoring reports', async () => {
    const result = await createReport({ error: '' }, buildReportFormData('MRC010'))

    expect(result).toEqual({ error: '증빙 파일을 첨부해주세요.' })
    expect(reportCreateCalls).toEqual([])
  })

  it('rejects a Seoul venue submitted for a Busan report', async () => {
    const formData = buildReportFormData('MRC990')
    formData.set('menteeRegion', 'B')

    const result = await createReport({ error: '' }, formData)

    expect(result).toEqual({ error: '선택한 멘티 지역에서 사용할 수 없는 장소입니다.' })
    expect(reportCreateCalls).toEqual([])
  })

  it('rejects a Busan venue submitted for a Seoul report', async () => {
    const formData = buildReportFormData('MRC990')
    formData.set('venue', '하이텐 - 21호실(6인)')

    const result = await createReport({ error: '' }, formData)

    expect(result).toEqual({ error: '선택한 멘티 지역에서 사용할 수 없는 장소입니다.' })
    expect(reportCreateCalls).toEqual([])
  })

  it('submits a Busan report with a Busan venue', async () => {
    const formData = buildReportFormData('MRC990')
    formData.set('menteeRegion', 'B')
    formData.set('venue', '하이스퀘어 - Q3(6인)')

    const thrown = await createReport({ error: '' }, formData).catch((error: unknown) => error)

    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect(reportCreateCalls).toHaveLength(1)
    expect(reportCreateCalls[0]?.options.menteeRegion).toBe('B')
    expect(reportCreateCalls[0]?.options.venue).toBe('하이스퀘어 - Q3(6인)')
  })
})
