import { Command } from 'commander'

import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { buildTeamActionPayload } from '../shared/utils/team-action-params'
import { buildTeamListParams, parseTeamSearchQuery } from '../shared/utils/team-params'
import { getHttpOrExit } from './helpers'

type ListOptions = { search?: string; pretty?: boolean }
type ActionOptions = { pretty?: boolean }

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const search = options.search ? parseTeamSearchQuery(options.search) : undefined
    const user = search?.me ? ((await http.checkLogin()) ?? undefined) : undefined
    const html = await http.get('/mypage/myTeam/team.do', buildTeamListParams({ search, user }))
    console.log(formatOutput(formatters.parseTeamInfo(html), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function joinAction(teamId: string, options: ActionOptions): Promise<void> {
  await runTeamAction({
    teamId,
    path: '/mypage/myTeam/updateUserTeamIn.json',
    failureMessage: '팀 참여에 실패했습니다.',
    pretty: options.pretty,
  })
}

async function leaveAction(teamId: string, options: ActionOptions): Promise<void> {
  await runTeamAction({
    teamId,
    path: '/mypage/myTeam/updateUserTeamOut.json',
    failureMessage: '팀 탈퇴에 실패했습니다.',
    pretty: options.pretty,
  })
}

async function runTeamAction(params: {
  teamId: string
  path: string
  failureMessage: string
  pretty?: boolean
}): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const user = await http.checkLogin()
    if (!user) throw new Error('Not logged in. Run: opensoma auth login or opensoma auth extract')
    if (!user.userNo) throw new Error('현재 사용자의 userNo를 확인할 수 없습니다.')

    const response = await http.postJson<{ resultCode?: string }>(
      params.path,
      buildTeamActionPayload(params.teamId, user),
    )
    if (response.resultCode !== 'success') {
      throw new Error(params.failureMessage)
    }
    console.log(formatOutput({ ok: true }, params.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const teamCommand = new Command('team')
  .description('Show team information')
  .addCommand(
    new Command('list')
      .description('List teams')
      .option(
        '--search <query>',
        'Search (e.g. "keyword", "team:오픈소마", "mentor:@me", "member:@me", "project:Previzion")',
      )
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('join')
      .description('Join a team')
      .argument('<teamId>')
      .option('--pretty', 'Pretty print JSON output')
      .action(joinAction),
  )
  .addCommand(
    new Command('leave')
      .description('Leave a team')
      .argument('<teamId>')
      .option('--pretty', 'Pretty print JSON output')
      .action(leaveAction),
  )
