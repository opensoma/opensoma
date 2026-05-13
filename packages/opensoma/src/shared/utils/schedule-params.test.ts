import { describe, expect, it } from 'bun:test'

import { MENU_NO } from '../../constants'
import { buildScheduleListParams } from './schedule-params'

describe('buildScheduleListParams', () => {
  it('returns only menuNo when no options are passed', () => {
    expect(buildScheduleListParams()).toEqual({ menuNo: MENU_NO.SCHEDULE })
  })

  it('maps a YYYY-MM month to native sYear and sMonth params', () => {
    expect(buildScheduleListParams({ month: '2026-06' })).toEqual({
      menuNo: MENU_NO.SCHEDULE,
      sYear: '2026',
      sMonth: '06',
    })
  })

  it('preserves pageIndex with month params', () => {
    expect(buildScheduleListParams({ page: 3, month: '2026-11' })).toEqual({
      menuNo: MENU_NO.SCHEDULE,
      pageIndex: '3',
      sYear: '2026',
      sMonth: '11',
    })
  })

  it('rejects malformed month values', () => {
    expect(() => buildScheduleListParams({ month: '2026-6' })).toThrow('YYYY-MM')
    expect(() => buildScheduleListParams({ month: '2026-13' })).toThrow('YYYY-MM')
  })
})
