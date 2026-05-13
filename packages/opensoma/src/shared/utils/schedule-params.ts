import { MENU_NO } from '../../constants'

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export function buildScheduleListParams(options?: { page?: number | string; month?: string }): Record<string, string> {
  const params: Record<string, string> = { menuNo: MENU_NO.SCHEDULE }

  if (options?.page) {
    params.pageIndex = String(options.page)
  }

  if (options?.month) {
    const match = MONTH_PATTERN.exec(options.month)
    if (!match) {
      throw new Error('Schedule month must be in YYYY-MM format')
    }
    params.sYear = match[1]
    params.sMonth = match[2]
  }

  return params
}
