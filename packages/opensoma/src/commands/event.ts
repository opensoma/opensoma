import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { buildApplicationPayload, parseEventDetail } from '../shared/utils/swmaestro'
import { getHttpOrExit } from './helpers'

type ListOptions = { page?: string; pretty?: boolean }
type GetOptions = { pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/applicants/list.do', {
      menuNo: MENU_NO.EVENT,
      ...(options.page ? { pageIndex: options.page } : {}),
    })
    console.log(
      formatOutput(
        { items: formatters.parseEventList(html), pagination: formatters.parsePagination(html) },
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
    const html = await http.get('/mypage/applicants/view.do', { menuNo: MENU_NO.EVENT, bbsId: id })
    console.log(formatOutput(parseEventDetail(html), options.pretty))
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

export const eventCommand = new Command('event')
  .description('Browse and apply to events')
  .addCommand(
    new Command('list')
      .description('List events')
      .option('--page <n>', 'Page number')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('get')
      .description('Get event detail')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
  .addCommand(
    new Command('apply')
      .description('Apply to an event')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(applyAction),
  )
