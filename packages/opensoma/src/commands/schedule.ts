import { Command } from 'commander'

import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { buildScheduleListParams } from '../shared/utils/schedule-params'
import { getHttpOrExit } from './helpers'

type ListOptions = { page?: string; month?: string; pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get(
      '/mypage/schedule/list.do',
      buildScheduleListParams({ page: options.page, month: options.month }),
    )
    console.log(formatOutput(formatters.parseScheduleList(html), options.pretty))
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
      .option('--month <yyyy-mm>', 'Month to list (YYYY-MM)')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
