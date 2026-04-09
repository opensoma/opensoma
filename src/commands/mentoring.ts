import { Command } from 'commander'

import { MENU_NO } from '@/constants'
import * as formatters from '@/formatters'
import { handleError } from '@/shared/utils/error-handler'
import { formatOutput } from '@/shared/utils/output'
import {
  buildApplicationPayload,
  buildCancelApplicationPayload,
  buildDeleteMentoringPayload,
  buildMentoringPayload,
} from '@/shared/utils/swmaestro'

import { getHttpOrExit } from './helpers'

type ListOptions = { status?: string; type?: string; page?: string; pretty?: boolean }
type GetOptions = { pretty?: boolean }
type CreateOptions = {
  title: string
  type: 'free' | 'lecture'
  date: string
  start: string
  end: string
  venue: string
  maxAttendees?: string
  regStart?: string
  regEnd?: string
  content?: string
  pretty?: boolean
}
type CancelOptions = { applySn: string; qustnrSn: string; pretty?: boolean }
type HistoryOptions = { page?: string; pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoLec/list.do', {
      menuNo: MENU_NO.MENTORING,
      ...(options.status ? { searchStatMentolec: options.status } : {}),
      ...(options.type ? { searchGubunMentolec: options.type } : {}),
      ...(options.page ? { pageIndex: options.page } : {}),
    })
    console.log(
      formatOutput(
        { items: formatters.parseMentoringList(html), pagination: formatters.parsePagination(html) },
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
    const html = await http.get('/mypage/mentoLec/view.do', { menuNo: MENU_NO.MENTORING, qustnrSn: id })
    console.log(formatOutput(formatters.parseMentoringDetail(html, Number.parseInt(id, 10)), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function createAction(options: CreateOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.post(
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
        regEnd: options.regEnd,
        content: options.content,
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
        { items: formatters.parseApplicationHistory(html), pagination: formatters.parsePagination(html) },
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
      .option('--status <status>', 'Status filter (open|closed|my)')
      .option('--type <type>', 'Type filter (free|lecture)')
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
      .requiredOption('--type <type>', 'Mentoring type (free|lecture)')
      .requiredOption('--date <date>', 'Session date')
      .requiredOption('--start <time>', 'Start time')
      .requiredOption('--end <time>', 'End time')
      .requiredOption('--venue <venue>', 'Venue')
      .option('--max-attendees <count>', 'Maximum attendees')
      .option('--reg-start <date>', 'Registration start date')
      .option('--reg-end <date>', 'Registration end date')
      .option('--content <html>', 'HTML content')
      .option('--pretty', 'Pretty print JSON output')
      .action(createAction),
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
