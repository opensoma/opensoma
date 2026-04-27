import { Command } from 'commander'

import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { buildTeamShowParams, parseTeamSearchQuery } from '../shared/utils/team-params'
import { getHttpOrExit } from './helpers'

type ShowOptions = { search?: string; pretty?: boolean }

async function showAction(options: ShowOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const search = options.search ? parseTeamSearchQuery(options.search) : undefined
    const user = search?.me ? ((await http.checkLogin()) ?? undefined) : undefined
    const html = await http.get('/mypage/myTeam/team.do', buildTeamShowParams({ search, user }))
    console.log(formatOutput(formatters.parseTeamInfo(html), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const teamCommand = new Command('team')
  .description('Show team information')
  .addCommand(
    new Command('show')
      .description('Show team')
      .option(
        '--search <query>',
        'Search (e.g. "keyword", "team:오픈소마", "mentor:@me", "member:@me", "project:Previzion")',
      )
      .option('--pretty', 'Pretty print JSON output')
      .action(showAction),
  )
