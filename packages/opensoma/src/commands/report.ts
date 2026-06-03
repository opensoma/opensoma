import { readFile } from 'node:fs/promises'

import { Command } from 'commander'

import { REPORT_CD, type ReportCd } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import {
  buildReportPayload,
  requiresReportAttachment,
  requiresReportTeamName,
  toRegionCode,
  toReportTypeCd,
} from '../shared/utils/swmaestro'
import { getHttpOrExit } from './helpers'

type ReportCreateHttp = {
  readonly postMultipart: (path: string, formData: FormData) => Promise<unknown>
}

type ReportUpdateHttp = ReportCreateHttp & {
  readonly get: (path: string, params?: Record<string, string>) => Promise<string>
}

type ListOptions = {
  page?: string
  searchField?: string
  search?: string
  pretty?: boolean
}

type GetOptions = { pretty?: boolean }

type ApprovalOptions = {
  page?: string
  month?: string
  type?: string
  pretty?: boolean
}

export type CreateOptions = {
  region: string
  type: string
  date: string
  team?: string
  venue: string
  attendanceCount: string
  attendanceNames: string
  startTime: string
  endTime: string
  exceptStart?: string
  exceptEnd?: string
  exceptReason?: string
  subject: string
  content?: string
  contentFile?: string
  mentorOpinion?: string
  nonAttendance?: string
  etc?: string
  file?: string
  pretty?: boolean
}

export type UpdateOptions = {
  region?: string
  type?: string
  date?: string
  team?: string
  venue?: string
  attendanceCount?: string
  attendanceNames?: string
  startTime?: string
  endTime?: string
  exceptStart?: string
  exceptEnd?: string
  exceptReason?: string
  subject?: string
  content?: string
  mentorOpinion?: string
  nonAttendance?: string
  etc?: string
  file?: string
  pretty?: boolean
}

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoringReport/list.do', {
      menuNo: '200049',
      pageIndex: options.page ?? '1',
      ...(options.searchField ? { searchCnd: options.searchField } : {}),
      ...(options.search ? { searchWrd: options.search } : {}),
    })

    const items = formatters.parseReportList(html)
    console.log(
      formatOutput(
        { items, pagination: formatters.parsePagination(html, { itemCount: items.length }) },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function getAction(id: string, options: GetOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoringReport/view.do', {
      menuNo: '200049',
      reportId: id,
    })

    console.log(formatOutput(formatters.parseReportDetail(html, Number(id)), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function approvalAction(options: ApprovalOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoringReport/resultList.do', {
      menuNo: '200073',
      pageIndex: options.page ?? '1',
      ...(options.month ? { searchMonth: options.month } : {}),
      ...(options.type ? { searchReport: options.type } : {}),
    })

    const items = formatters.parseApprovalList(html)
    console.log(
      formatOutput(
        { items, pagination: formatters.parsePagination(html, { itemCount: items.length }) },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

export async function resolveContent(
  options: Pick<CreateOptions, 'content' | 'contentFile'>,
  readFromStdin: () => Promise<string> = defaultReadStdin,
): Promise<string> {
  if (options.content === '-') {
    return await readFromStdin()
  }
  if (options.content) {
    return options.content
  }
  if (options.contentFile) {
    return await readFile(options.contentFile, 'utf8')
  }
  throw new Error('Either --content <text> or --content-file <path> is required. Use --content - to read from stdin.')
}

async function defaultReadStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

export type CreateReportDependencies = {
  readonly getHttp?: () => Promise<ReportCreateHttp>
  readonly readBinaryFile?: (path: string) => Promise<Buffer>
  readonly readFromStdin?: () => Promise<string>
  readonly write?: (output: string) => void
}

export type UpdateReportDependencies = {
  readonly getHttp?: () => Promise<ReportUpdateHttp>
  readonly readBinaryFile?: (path: string) => Promise<Buffer>
  readonly parseReportDetail?: typeof formatters.parseReportDetail
  readonly write?: (output: string) => void
}

function parseReportType(value: string): ReportCd {
  switch (value) {
    case REPORT_CD.PUBLIC_MENTORING:
    case REPORT_CD.MENTOR_LECTURE:
    case REPORT_CD.REGULAR_MENTORING:
      return value
    default:
      throw new Error(`Invalid report type: ${value}. Expected MRC010, MRC020, or MRC990.`)
  }
}

function parseRegionCode(value: string): 'S' | 'B' {
  switch (value) {
    case 'S':
    case 'B':
      return value
    default:
      throw new Error(`Invalid region: ${value}. Expected S or B.`)
  }
}

function appendFile(formData: FormData, fileBuffer: Buffer, fileName: string): void {
  const fileBytes = new Uint8Array(fileBuffer.length)
  fileBytes.set(fileBuffer)
  formData.append('file_1_1', new Blob([fileBytes]), fileName)
  formData.append('fileFieldNm_1', 'file_1')
}

function assertReportPreflight(
  reportType: ReportCd,
  options: { readonly teamNames?: string; readonly hasAttachment: boolean },
): void {
  if (requiresReportAttachment(reportType) && !options.hasAttachment) {
    throw new Error('--file <path> is required for MRC010 and MRC020 reports.')
  }
  if (requiresReportTeamName(reportType) && !options.teamNames?.trim()) {
    throw new Error('--team <names> is required for MRC990 reports.')
  }
}

export async function createReport(options: CreateOptions, dependencies: CreateReportDependencies = {}): Promise<void> {
  const reportType = parseReportType(options.type)
  assertReportPreflight(reportType, { teamNames: options.team, hasAttachment: Boolean(options.file) })

  const content = await resolveContent(options, dependencies.readFromStdin)
  const http = await (dependencies.getHttp ?? getHttpOrExit)()
  const payload = buildReportPayload({
    menteeRegion: parseRegionCode(options.region),
    reportType,
    progressDate: options.date,
    teamNames: options.team,
    venue: options.venue,
    attendanceCount: Number.parseInt(options.attendanceCount, 10),
    attendanceNames: options.attendanceNames,
    progressStartTime: options.startTime,
    progressEndTime: options.endTime,
    exceptStartTime: options.exceptStart,
    exceptEndTime: options.exceptEnd,
    exceptReason: options.exceptReason,
    subject: options.subject,
    content,
    mentorOpinion: options.mentorOpinion,
    nonAttendanceNames: options.nonAttendance,
    etc: options.etc,
  })

  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value)
  }

  if (options.file) {
    const fileBuffer = await (dependencies.readBinaryFile ?? readFile)(options.file)
    const fileName = options.file.split('/').pop() ?? 'file'
    appendFile(formData, fileBuffer, fileName)
    formData.append('atchFileId', '')
  }

  await http.postMultipart('/mypage/mentoringReport/insert.do', formData)
  ;(dependencies.write ?? console.log)(formatOutput({ ok: true }, options.pretty))
}

async function createAction(options: CreateOptions): Promise<void> {
  try {
    await createReport(options)
  } catch (error) {
    handleError(error)
  }
}

export async function updateReport(
  id: string,
  options: UpdateOptions,
  dependencies: UpdateReportDependencies = {},
): Promise<void> {
  const reportId = Number.parseInt(id, 10)
  const http = await (dependencies.getHttp ?? getHttpOrExit)()
  const html = await http.get('/mypage/mentoringReport/view.do', {
    menuNo: '200049',
    reportId: id,
  })
  const existing = (dependencies.parseReportDetail ?? formatters.parseReportDetail)(html, reportId)
  const reportType = options.type ? parseReportType(options.type) : toReportTypeCd(existing.reportType)
  const teamNames = options.team ?? existing.teamNames
  assertReportPreflight(reportType, {
    teamNames,
    hasAttachment: Boolean(options.file) || existing.files.length > 0,
  })

  const payload = buildReportPayload({
    menteeRegion: options.region ? parseRegionCode(options.region) : toRegionCode(existing.menteeRegion),
    reportType,
    progressDate: options.date ?? existing.progressDate,
    teamNames,
    venue: options.venue ?? existing.venue,
    attendanceCount: options.attendanceCount ? Number.parseInt(options.attendanceCount, 10) : existing.attendanceCount,
    attendanceNames: options.attendanceNames ?? existing.attendanceNames,
    progressStartTime: options.startTime ?? existing.progressStartTime,
    progressEndTime: options.endTime ?? existing.progressEndTime,
    exceptStartTime: options.exceptStart ?? existing.exceptStartTime,
    exceptEndTime: options.exceptEnd ?? existing.exceptEndTime,
    exceptReason: options.exceptReason ?? existing.exceptReason,
    subject: options.subject ?? existing.subject,
    content: options.content ?? existing.content,
    mentorOpinion: options.mentorOpinion ?? existing.mentorOpinion,
    nonAttendanceNames: options.nonAttendance ?? existing.nonAttendanceNames,
    etc: options.etc ?? existing.etc,
    reportId,
  })

  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value)
  }

  if (options.file) {
    const fileBuffer = await (dependencies.readBinaryFile ?? readFile)(options.file)
    const fileName = options.file.split('/').pop() ?? 'file'
    appendFile(formData, fileBuffer, fileName)
    formData.append('atchFileId', '')
  }

  await http.postMultipart('/mypage/mentoringReport/update.do', formData)
  ;(dependencies.write ?? console.log)(formatOutput({ ok: true }, options.pretty))
}

async function updateAction(id: string, options: UpdateOptions): Promise<void> {
  try {
    await updateReport(id, options)
  } catch (error) {
    handleError(error)
  }
}

export const reportCommand = new Command('report')
  .description('Browse mentoring reports and approvals')
  .addCommand(
    new Command('list')
      .description('List mentoring reports')
      .option('--page <n>', 'Page number')
      .option('--search-field <field>', 'Search field (전체/제목/내용)')
      .option('--search <keyword>', 'Search keyword')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('get')
      .description('Get mentoring report detail')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
  .addCommand(
    new Command('create')
      .description('Create a new mentoring report')
      .requiredOption('--region <S|B>', 'Mentee region (S=Seoul, B=Busan)')
      .requiredOption(
        '--type <MRC010|MRC020|MRC990>',
        'Report type (MRC010=자유 멘토링, MRC020=멘토 특강, MRC990=정규 멘토링)',
      )
      .requiredOption('--date <yyyy-mm-dd>', 'Session date')
      .option('--team <names>', 'Team names (comma-separated)')
      .requiredOption('--venue <venue>', 'Venue name or code')
      .requiredOption('--attendance-count <n>', 'Number of attendees')
      .requiredOption('--attendance-names <names>', 'Attendee names (comma-separated)')
      .requiredOption('--start-time <HH:mm>', 'Session start time')
      .requiredOption('--end-time <HH:mm>', 'Session end time')
      .option('--except-start <HH:mm>', 'Break start time')
      .option('--except-end <HH:mm>', 'Break end time')
      .option('--except-reason <text>', 'Break reason')
      .requiredOption('--subject <text>', 'Session subject (min 10 chars)')
      .option('--content <text>', 'Session content as inline text, or - to read from stdin (min 100 chars)')
      .option('--content-file <path>', 'Read session content from a file')
      .option('--mentor-opinion <text>', 'Mentor opinion')
      .option('--non-attendance <names>', 'Non-attendance names (comma-separated)')
      .option('--etc <text>', 'Additional notes')
      .option('--file <path>', 'Evidence file path (required for MRC010/MRC020, optional for MRC990)')
      .option('--pretty', 'Pretty print JSON output')
      .action(createAction),
  )
  .addCommand(
    new Command('update')
      .description('Update an existing mentoring report')
      .argument('<id>', 'Report ID to update')
      .option('--region <S|B>', 'Mentee region (S=Seoul, B=Busan)')
      .option('--type <MRC010|MRC020|MRC990>', 'Report type (MRC010=자유 멘토링, MRC020=멘토 특강, MRC990=정규 멘토링)')
      .option('--date <yyyy-mm-dd>', 'Session date')
      .option('--team <names>', 'Team names (comma-separated)')
      .option('--venue <venue>', 'Venue name or code')
      .option('--attendance-count <n>', 'Number of attendees')
      .option('--attendance-names <names>', 'Attendee names (comma-separated)')
      .option('--start-time <HH:mm>', 'Session start time')
      .option('--end-time <HH:mm>', 'Session end time')
      .option('--except-start <HH:mm>', 'Break start time')
      .option('--except-end <HH:mm>', 'Break end time')
      .option('--except-reason <text>', 'Break reason')
      .option('--subject <text>', 'Session subject (min 10 chars)')
      .option('--content <text>', 'Session content (min 100 chars)')
      .option('--mentor-opinion <text>', 'Mentor opinion')
      .option('--non-attendance <names>', 'Non-attendance names (comma-separated)')
      .option('--etc <text>', 'Additional notes')
      .option('--file <path>', 'Evidence file path (replaces existing)')
      .option('--pretty', 'Pretty print JSON output')
      .action(updateAction),
  )
  .addCommand(
    new Command('approval')
      .description('List report approvals')
      .option('--page <n>', 'Page number')
      .option('--month <mm>', 'Filter by month (01-12)')
      .option('--type <type>', 'Filter by report type (MRC010/MRC020/MRC990)')
      .option('--pretty', 'Pretty print JSON output')
      .action(approvalAction),
  )
