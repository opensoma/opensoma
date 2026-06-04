import { describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createReport, resolveContent, updateReport } from './report'
import type { ReportDetail } from '../types'

describe('resolveContent', () => {
  it('returns inline text passed via --content', async () => {
    const result = await resolveContent({ content: 'inline content' })
    expect(result).toBe('inline content')
  })

  it('reads from stdin when --content is "-"', async () => {
    const fakeStdin = async () => 'stdin content'
    const result = await resolveContent({ content: '-' }, fakeStdin)
    expect(result).toBe('stdin content')
  })

  it('reads from a file when --content-file is provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'report-test-'))
    const filePath = join(dir, 'content.txt')
    await writeFile(filePath, '파일에서 읽은 내용입니다.')

    try {
      const result = await resolveContent({ contentFile: filePath })
      expect(result).toBe('파일에서 읽은 내용입니다.')
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('prefers --content over --content-file when both are provided', async () => {
    const result = await resolveContent({ content: 'inline', contentFile: '/nonexistent' })
    expect(result).toBe('inline')
  })

  it('prefers stdin (--content -) over --content-file', async () => {
    const fakeStdin = async () => 'from stdin'
    const result = await resolveContent({ content: '-', contentFile: '/nonexistent' }, fakeStdin)
    expect(result).toBe('from stdin')
  })

  it('throws when neither --content nor --content-file is provided', async () => {
    await expect(resolveContent({})).rejects.toThrow(
      'Either --content <text> or --content-file <path> is required. Use --content - to read from stdin.',
    )
  })
})

describe('createReport', () => {
  const regularContent =
    '정규 멘토링에서 담당 팀 연수생과 진행한 내용을 충분히 기록합니다. 팀명은 사용자에게 확인한 담당 팀을 사용해야 합니다. 보고 내용은 기존 보고서 길이 기준을 충족하도록 자세히 작성합니다.'

  it('allows regular mentoring reports without an approval file when team name is confirmed', async () => {
    const posted: Array<{ readonly path: string; readonly formData: FormData }> = []
    const outputs: string[] = []

    await createReport(
      {
        region: 'S',
        type: 'MRC990',
        date: '2026-06-04',
        venue: '스페이스 A1',
        attendanceCount: '2',
        attendanceNames: 'Trainee One, Trainee Two',
        team: 'Team Alpha',
        startTime: '10:00',
        endTime: '12:00',
        subject: '정규 멘토링 보고 주제',
        content: regularContent,
      },
      {
        getHttp: async () => ({
          postMultipart: async (path: string, formData: FormData) => {
            posted.push({ path, formData })
          },
        }),
        readBinaryFile: async () => {
          throw new Error('regular mentoring report must not read an approval file')
        },
        write: (output) => outputs.push(output),
      },
    )

    expect(posted).toHaveLength(1)
    expect(posted[0]?.path).toBe('/mypage/mentoringReport/insert.do')
    expect(posted[0]?.formData.get('reportGubunCd')).toBe('MRC990')
    expect(posted[0]?.formData.get('teamNms')).toBe('Team Alpha')
    expect(posted[0]?.formData.has('file_1_1')).toBe(false)
    expect(posted[0]?.formData.has('fileFieldNm_1')).toBe(false)
    expect(posted[0]?.formData.has('atchFileId')).toBe(false)
    expect(outputs).toEqual(['{"ok":true}'])
  })

  it('rejects regular mentoring reports without a team name', async () => {
    const posted: Array<{ readonly path: string; readonly formData: FormData }> = []

    await expect(
      createReport(
        {
          region: 'S',
          type: 'MRC990',
          date: '2026-06-04',
          venue: '스페이스 A1',
          attendanceCount: '2',
          attendanceNames: 'Trainee One, Trainee Two',
          startTime: '10:00',
          endTime: '12:00',
          subject: '정규 멘토링 보고 주제',
          content: regularContent,
        },
        {
          getHttp: async () => ({
            postMultipart: async (path: string, formData: FormData) => {
              posted.push({ path, formData })
            },
          }),
        },
      ),
    ).rejects.toThrow('--team <names> is required for MRC990 reports.')

    expect(posted).toEqual([])
  })

  it('still requires an approval file for public and lecture reports', async () => {
    const posted: Array<{ readonly path: string; readonly formData: FormData }> = []

    for (const reportType of ['MRC010', 'MRC020']) {
      await expect(
        createReport(
          {
            region: 'S',
            type: reportType,
            date: '2026-06-04',
            venue: '스페이스 A1',
            attendanceCount: '2',
            attendanceNames: 'Trainee One, Trainee Two',
            startTime: '10:00',
            endTime: '12:00',
            subject: '기존 보고서 작성 주제',
            content: regularContent,
          },
          {
            getHttp: async () => ({
              postMultipart: async (path: string, formData: FormData) => {
                posted.push({ path, formData })
              },
            }),
          },
        ),
      ).rejects.toThrow('--file <path> is required for MRC010 and MRC020 reports.')
    }

    expect(posted).toEqual([])
  })
})

describe('updateReport', () => {
  const existingRegularReport = {
    id: 123,
    category: '정규 멘토링',
    title: '정규 멘토링 보고',
    progressDate: '2026-06-04',
    status: '접수중',
    author: 'Mentor One',
    createdAt: '2026-06-04',
    acceptedTime: '',
    payAmount: '',
    content:
      '정규 멘토링에서 담당 팀 연수생과 진행한 내용을 충분히 기록합니다. 팀명은 사용자에게 확인한 담당 팀을 사용해야 합니다. 보고 내용은 기존 보고서 길이 기준을 충족하도록 자세히 작성합니다.',
    subject: '정규 멘토링 보고 주제',
    menteeRegion: '서울',
    reportType: '정규 멘토링',
    teamNames: 'Team Alpha',
    venue: '스페이스 A1',
    attendanceCount: 2,
    attendanceNames: 'Trainee One, Trainee Two',
    progressStartTime: '10:00',
    progressEndTime: '12:00',
    exceptStartTime: '',
    exceptEndTime: '',
    exceptReason: '',
    mentorOpinion: '',
    nonAttendanceNames: '',
    etc: '',
    files: [],
  } satisfies ReportDetail

  it('rejects updating a regular mentoring report to a file-required type when no attachment is available', async () => {
    const posted: Array<{ readonly path: string; readonly formData: FormData }> = []

    await expect(
      updateReport(
        '123',
        { type: 'MRC010' },
        {
          getHttp: async () => ({
            get: async () => '<html></html>',
            postMultipart: async (path: string, formData: FormData) => {
              posted.push({ path, formData })
            },
          }),
          parseReportDetail: () => existingRegularReport,
        },
      ),
    ).rejects.toThrow('--file <path> is required for MRC010 and MRC020 reports.')

    expect(posted).toEqual([])
  })
})
