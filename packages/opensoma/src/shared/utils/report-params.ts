import type { SomaCampus } from '../../campus'
import { MENU_NO } from '../../constants'
import { parseReportDetail } from '../../formatters'
import type { ReportListItem } from '../../types'
import { toRegionCode } from './swmaestro'

type ReportDetailHttp = {
  readonly get: (path: string, params?: Record<string, string>) => Promise<string>
}

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

export async function enrichReportsWithRegion(
  http: ReportDetailHttp,
  items: readonly ReportListItem[],
): Promise<ReportListItem[]> {
  // A failed detail fetch must drop only that row, not the whole page — matching how the
  // campus filter silently drops rows whose region could not be resolved.
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const detailHtml = await http.get('/mypage/mentoringReport/view.do', {
        menuNo: MENU_NO.REPORT,
        reportId: String(item.id),
      })
      return { ...item, menteeRegion: parseReportDetail(detailHtml, item.id).menteeRegion }
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
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
