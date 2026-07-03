import type { SomaCampus } from '../../campus'
import type { ReportListItem } from '../../types'
import { toRegionCode } from './swmaestro'

export function filterReportsByCampus<T extends Pick<ReportListItem, 'menteeRegion'>>(
  items: readonly T[],
  campus: SomaCampus,
): T[] {
  const target = campus === 'busan' ? 'B' : 'S'
  return items.filter((item) => {
    const region = item.menteeRegion?.trim()
    return region !== undefined && region !== '' && toRegionCode(region) === target
  })
}

export function buildReportListParams(options?: {
  page?: number
  searchField?: string // '' | '0' | '1' (전체/제목/내용)
  searchKeyword?: string
}): Record<string, string> {
  const params: Record<string, string> = {
    pageIndex: String(options?.page ?? 1),
    menuNo: '200049',
  }

  if (options?.searchField !== undefined) {
    params.searchCnd = options.searchField
  }

  if (options?.searchKeyword) {
    params.searchWrd = options.searchKeyword
  }

  return params
}

export function buildApprovalListParams(options?: {
  page?: number
  month?: string // '01'-'12' or 'all'
  reportType?: string // '' | 'MRC010' | 'MRC020' | 'MRC990'
}): Record<string, string> {
  const params: Record<string, string> = {
    pageIndex: String(options?.page ?? 1),
    menuNo: '200073',
  }

  if (options?.month) {
    params.searchMonth = options.month
  }

  if (options?.reportType !== undefined) {
    params.searchReport = options.reportType
  }

  return params
}
