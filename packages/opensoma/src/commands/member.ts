import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { getHttpOrExit } from './helpers'

type ShowOptions = { pretty?: boolean }

async function showAction(options: ShowOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/myInfo/forUpdateMy.do', { menuNo: MENU_NO.MEMBER_INFO })
    console.log(formatOutput(formatters.parseMemberInfo(html), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const memberCommand = new Command('member')
  .description('Show member information')
  .addCommand(
    new Command('show')
      .description('Show member profile')
      .option('--pretty', 'Pretty print JSON output')
      .action(showAction),
  )
