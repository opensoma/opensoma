import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { buildMentoringListParams } from '../shared/utils/mentoring-params'
import { formatOutput } from '../shared/utils/output'
import { getHttpOrExit } from './helpers'

type ShowOptions = { pretty?: boolean }

async function showAction(options: ShowOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const user = (await http.checkLogin()) ?? undefined
    const search = { field: 'author' as const, value: '@me', me: true }
    const [dashboardHtml, mentoringHtml] = await Promise.all([
      http.get('/mypage/myMain/dashboard.do', { menuNo: MENU_NO.DASHBOARD }),
      http.get('/mypage/mentoLec/list.do', buildMentoringListParams({ search, user })),
    ])
    const dashboard = formatters.parseDashboard(dashboardHtml)
    const myMentoring = formatters.parseMentoringList(mentoringHtml)
    dashboard.mentoringSessions = myMentoring.map((item) => ({
      title: item.title,
      url: `/mypage/mentoLec/view.do?qustnrSn=${item.id}`,
      status: item.status,
    }))
    console.log(formatOutput(dashboard, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const dashboardCommand = new Command('dashboard')
  .description('Show dashboard information')
  .addCommand(
    new Command('show').description('Show dashboard').option('--pretty', 'Pretty print JSON output').action(showAction),
  )
