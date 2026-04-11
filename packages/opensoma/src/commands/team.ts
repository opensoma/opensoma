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
    const html = await http.get('/mypage/myTeam/team.do', { menuNo: MENU_NO.TEAM })
    console.log(formatOutput(formatters.parseTeamInfo(html), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const teamCommand = new Command('team')
  .description('Show team information')
  .addCommand(
    new Command('show').description('Show team').option('--pretty', 'Pretty print JSON output').action(showAction),
  )
