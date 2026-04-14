import { Command } from 'commander'

import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { getHttpOrExit } from './helpers'

type ListOptions = {
  page?: string
  searchField?: string
  search?: string
  pretty?: boolean
}

type GetOptions = { pretty?: boolean }

type ApprovalOptions = {
  page?: string
  month?: string
  type?: string
  pretty?: boolean
}

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoringReport/list.do', {
      menuNo: '200049',
      pageIndex: options.page ?? '1',
      ...(options.searchField ? { searchCnd: options.searchField } : {}),
      ...(options.search ? { searchWrd: options.search } : {}),
    })

    console.log(
      formatOutput(
        { items: formatters.parseReportList(html), pagination: formatters.parsePagination(html) },
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
    const html = await http.get('/mypage/mentoringReport/view.do', {
      menuNo: '200049',
      reportId: id,
    })

    console.log(formatOutput(formatters.parseReportDetail(html, Number(id)), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function approvalAction(options: ApprovalOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.get('/mypage/mentoringReport/resultList.do', {
      menuNo: '200073',
      pageIndex: options.page ?? '1',
      ...(options.month ? { searchMonth: options.month } : {}),
      ...(options.type ? { searchReport: options.type } : {}),
    })

    console.log(
      formatOutput(
        { items: formatters.parseApprovalList(html), pagination: formatters.parsePagination(html) },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

export const reportCommand = new Command('report')
  .description('Browse mentoring reports and approvals')
  .addCommand(
    new Command('list')
      .description('List mentoring reports')
      .option('--page <n>', 'Page number')
      .option('--search-field <field>', 'Search field (전체/제목/내용)')
      .option('--search <keyword>', 'Search keyword')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('get')
      .description('Get mentoring report detail')
      .argument('<id>')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
  .addCommand(
    new Command('approval')
      .description('List report approvals')
      .option('--page <n>', 'Page number')
      .option('--month <mm>', 'Filter by month (01-12)')
      .option('--type <type>', 'Filter by report type (MRC010/MRC020)')
      .option('--pretty', 'Pretty print JSON output')
      .action(approvalAction),
  )
