import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { buildMentoringListParams, parseSearchQuery } from '../shared/utils/mentoring-params'
import { formatOutput } from '../shared/utils/output'
import {
  buildApplicationPayload,
  buildCancelApplicationPayload,
  buildDeleteMentoringPayload,
  buildMentoringPayload,
  buildUpdateMentoringPayload,
  type ReceiptType,
} from '../shared/utils/swmaestro'
import { getHttpOrExit } from './helpers'

type ListOptions = {
  status?: string
  type?: string
  search?: string
  page?: string
  pretty?: boolean
}
type GetOptions = { pretty?: boolean }
type CreateOptions = {
  title: string
  type: 'public' | 'lecture'
  date: string
  start: string
  end: string
  venue: string
  maxAttendees?: string
  regStart?: string
  regStartTime?: string
  regEnd?: string
  regEndTime?: string
  receiptType?: string
  content?: string
  pretty?: boolean
}
type UpdateOptions = {
  title?: string
  type?: 'public' | 'lecture'
  date?: string
  start?: string
  end?: string
  venue?: string
  maxAttendees?: string
  regStart?: string
  regStartTime?: string
  regEnd?: string
  regEndTime?: string
  receiptType?: string
  content?: string
  pretty?: boolean
}
type CancelOptions = { applySn: string; qustnrSn: string; pretty?: boolean }
type HistoryOptions = { page?: string; pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const search = options.search ? parseSearchQuery(options.search) : undefined
    const user = search?.me ? ((await http.checkLogin()) ?? undefined) : undefined
    const html = await http.get(
      '/mypage/mentoLec/list.do',
      buildMentoringListParams({
        status: options.status,
        type: options.type,
        page: options.page,
        search,
        user,
      }),
    )
    console.log(
      formatOutput(
        {
          items: formatters.parseMentoringList(html),
          pagination: formatters.parsePagination(html),
        },
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
    const html = await http.get('/mypage/mentoLec/view.do', {
      menuNo: MENU_NO.MENTORING,
      qustnrSn: id,
    })
    console.log(formatOutput(formatters.parseMentoringDetail(html, Number.parseInt(id, 10)), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function createAction(options: CreateOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.postForm(
      '/mypage/mentoLec/insert.do',
      buildMentoringPayload({
        title: options.title,
        type: options.type,
        date: options.date,
        startTime: options.start,
        endTime: options.end,
        venue: options.venue,
        maxAttendees: options.maxAttendees ? Number.parseInt(options.maxAttendees, 10) : undefined,
        regStart: options.regStart,
        regStartTime: options.regStartTime,
        regEnd: options.regEnd,
        regEndTime: options.regEndTime,
        receiptType: parseReceiptType(options.receiptType),
        content: options.content,
      }),
    )
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

function parseReceiptType(value: string | undefined): ReceiptType | undefined {
  if (!value) return undefined
  const normalized = value.toLowerCase()
  if (normalized === 'direct') return 'DIRECT'
  if (normalized === 'lecture' || normalized === 'until-lecture' || normalized === 'until_lecture')
    return 'UNTIL_LECTURE'
  throw new Error(`Invalid receipt type: ${value}. Expected "lecture" or "direct".`)
}

async function updateAction(id: string, options: UpdateOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const numId = Number.parseInt(id, 10)

    const [editHtml, viewHtml] = await Promise.all([
      http.get('/mypage/mentoLec/forUpdate.do', { menuNo: MENU_NO.MENTORING, qustnrSn: id }),
      http.get('/mypage/mentoLec/view.do', { menuNo: MENU_NO.MENTORING, qustnrSn: id }),
    ])
    const existing = formatters.parseMentoringEditForm(editHtml, numId)
    const existingContent = formatters.parseMentoringDetail(viewHtml, numId).content

    await http.postForm(
      '/mypage/mentoLec/update.do',
      buildUpdateMentoringPayload(numId, {
        title: options.title ?? existing.title,
        type: options.type ?? (existing.reportCd === 'MRC020' ? 'lecture' : 'public'),
        date: options.date ?? existing.eventDt,
        startTime: options.start ?? existing.eventStime,
        endTime: options.end ?? existing.eventEtime,
        venue: options.venue ?? existing.place,
        maxAttendees: options.maxAttendees ? Number.parseInt(options.maxAttendees, 10) : existing.applyCnt,
        receiptType: parseReceiptType(options.receiptType) ?? existing.receiptType,
        regStart: options.regStart ?? existing.bgndeDate,
        regStartTime: options.regStartTime ?? existing.bgndeTime,
        regEnd: options.regEnd ?? existing.enddeDate,
        regEndTime: options.regEndTime ?? existing.enddeTime,
        content: options.content ?? existingContent,
      }),
    )
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function deleteAction(id: string, options: GetOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.post('/mypage/mentoLec/delete.do', buildDeleteMentoringPayload(Number.parseInt(id, 10)))
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function applyAction(id: string, options: GetOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.post('/application/application/application.do', buildApplicationPayload(Number.parseInt(id, 10)))
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function cancelAction(options: CancelOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.post(
      '/mypage/userAnswer/cancel.do',
      buildCancelApplicationPayload({
        applySn: Number.parseInt(options.applySn, 10),
        qustnrSn: Number.parseInt(options.qustnrSn, 10),
      }),
    )
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function historyAction(options: HistoryOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/userAnswer/history.do', {
      menuNo: MENU_NO.APPLICATION_HISTORY,
      ...(options.page ? { pageIndex: options.page } : {}),
    })
    console.log(
      formatOutput(
        {
          items: formatters.parseApplicationHistory(html),
          pagination: formatters.parsePagination(html),
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

export const mentoringCommand = new Command('mentoring')
  .description('Manage mentoring sessions')
  .addCommand(
    new Command('list')
      .description('List mentoring sessions')
      .option('--status <status>', 'Status filter (open|closed)')
      .option('--type <type>', 'Type filter (public|lecture)')
      .option('--search <query>', 'Search (e.g. "keyword", "author:@me", "content:text")')
      .option('--page <n>', 'Page number')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('get')
      .description('Get mentoring detail')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
  .addCommand(
    new Command('create')
      .description('Create a mentoring session')
      .requiredOption('--title <title>', 'Title')
      .requiredOption('--type <type>', 'Mentoring type (public|lecture)')
      .requiredOption('--date <date>', 'Session date')
      .requiredOption('--start <time>', 'Start time (HH:MM)')
      .requiredOption('--end <time>', 'End time (HH:MM)')
      .requiredOption('--venue <venue>', 'Venue')
      .option('--max-attendees <count>', 'Maximum attendees (public: 2-5, lecture: 6+)')
      .option('--receipt-type <type>', 'Registration period type (lecture|direct, default: lecture)')
      .option('--reg-start <date>', 'Registration start date (YYYY-MM-DD, default: session date)')
      .option('--reg-start-time <time>', 'Registration start time (HH:MM, default: 00:00)')
      .option('--reg-end <date>', 'Registration end date (YYYY-MM-DD, required when --receipt-type=direct)')
      .option('--reg-end-time <time>', 'Registration end time (HH:MM, required when --receipt-type=direct)')
      .option('--content <html>', 'HTML content')
      .option('--pretty', 'Pretty print JSON output')
      .action(createAction),
  )
  .addCommand(
    new Command('update')
      .description('Update a mentoring session (partial update - only specified fields are changed)')
      .argument('<id>')
      .option('--title <title>', 'Title')
      .option('--type <type>', 'Mentoring type (public|lecture)')
      .option('--date <date>', 'Session date')
      .option('--start <time>', 'Start time (HH:MM)')
      .option('--end <time>', 'End time (HH:MM)')
      .option('--venue <venue>', 'Venue')
      .option('--max-attendees <count>', 'Maximum attendees (public: 2-5, lecture: 6+)')
      .option('--receipt-type <type>', 'Registration period type (lecture|direct)')
      .option('--reg-start <date>', 'Registration start date (YYYY-MM-DD)')
      .option('--reg-start-time <time>', 'Registration start time (HH:MM)')
      .option('--reg-end <date>', 'Registration end date (YYYY-MM-DD)')
      .option('--reg-end-time <time>', 'Registration end time (HH:MM)')
      .option('--content <html>', 'HTML content')
      .option('--pretty', 'Pretty print JSON output')
      .action(updateAction),
  )
  .addCommand(
    new Command('delete')
      .description('Delete a mentoring session')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(deleteAction),
  )
  .addCommand(
    new Command('apply')
      .description('Apply to a mentoring session')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(applyAction),
  )
  .addCommand(
    new Command('cancel')
      .description('Cancel a mentoring application')
      .requiredOption('--apply-sn <id>', 'Application serial number')
      .requiredOption('--qustnr-sn <id>', 'Mentoring serial number')
      .option('--pretty', 'Pretty print JSON output')
      .action(cancelAction),
  )
  .addCommand(
    new Command('history')
      .description('List mentoring application history')
      .option('--page <n>', 'Page number')
      .option('--pretty', 'Pretty print JSON output')
      .action(historyAction),
  )
