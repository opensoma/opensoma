import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { getHttpOrExit } from './helpers'

type ListOptions = { page?: string; pretty?: boolean }
type GetOptions = { pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/myNotice/list.do', {
      menuNo: MENU_NO.NOTICE,
      ...(options.page ? { pageIndex: options.page } : {}),
    })
    console.log(
      formatOutput(
        { items: formatters.parseNoticeList(html), pagination: formatters.parsePagination(html) },
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
    const html = await http.get('/mypage/myNotice/view.do', { menuNo: MENU_NO.NOTICE, nttId: id })
    console.log(formatOutput(formatters.parseNoticeDetail(html, Number.parseInt(id, 10)), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const noticeCommand = new Command('notice')
  .description('Browse notices')
  .addCommand(
    new Command('list')
      .description('List notices')
      .option('--page <n>', 'Page number')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('get')
      .description('Get notice detail')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
