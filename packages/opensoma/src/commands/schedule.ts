import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { getHttpOrExit } from './helpers'

type ListOptions = { page?: string; pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/schedule/list.do', {
      menuNo: MENU_NO.SCHEDULE,
      ...(options.page ? { pageIndex: options.page } : {}),
    })
    const items = formatters.parseScheduleList(html)
    const pagination = formatters.parsePagination(html)

    console.log(
      formatOutput(
        {
          items,
          pagination:
            pagination.total === 0 && items.length > 0
              ? { total: items.length, currentPage: 1, totalPages: 1 }
              : pagination,
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

export const scheduleCommand = new Command('schedule')
  .description('Browse monthly schedules')
  .addCommand(
    new Command('list')
      .description('List monthly schedules')
      .option('--page <n>', 'Page number')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
