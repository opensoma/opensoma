import { describe, expect, it } from 'bun:test'

import type { ReportListItem } from '../../types'
import { filterReportsByCampus } from './report-params'

const baseItem: ReportListItem = {
  id: 1,
  category: '자유 멘토링',
  title: '[자유 멘토링] 멘토링 보고',
  progressDate: '2026-04-10',
  status: '[승인]',
  author: 'Mentor One',
  createdAt: '2026-04-10',
  acceptedTime: '2시간',
  payAmount: '200,000',
}

describe('filterReportsByCampus', () => {
  it('keeps only Seoul-region reports when filtering by seoul', () => {
    const items: ReportListItem[] = [
      { ...baseItem, id: 1, menteeRegion: '서울 연수생' },
      { ...baseItem, id: 2, menteeRegion: '부산 연수생' },
      { ...baseItem, id: 3, menteeRegion: '서울 연수생' },
    ]

    const result = filterReportsByCampus(items, 'seoul')

    expect(result.map((item) => item.id)).toEqual([1, 3])
  })

  it('keeps only Busan-region reports when filtering by busan', () => {
    const items: ReportListItem[] = [
      { ...baseItem, id: 1, menteeRegion: '서울 연수생' },
      { ...baseItem, id: 2, menteeRegion: '부산 연수생' },
    ]

    const result = filterReportsByCampus(items, 'busan')

    expect(result.map((item) => item.id)).toEqual([2])
  })

  it('drops items that have no region', () => {
    const items: ReportListItem[] = [
      { ...baseItem, id: 1, menteeRegion: '서울 연수생' },
      { ...baseItem, id: 2 },
    ]

    const result = filterReportsByCampus(items, 'seoul')

    expect(result.map((item) => item.id)).toEqual([1])
  })

  it('treats any non-Busan region string as Seoul', () => {
    const items: ReportListItem[] = [{ ...baseItem, id: 1, menteeRegion: '서울' }]

    expect(filterReportsByCampus(items, 'seoul').map((item) => item.id)).toEqual([1])
    expect(filterReportsByCampus(items, 'busan')).toEqual([])
  })

  it('drops rows whose extracted region is empty or blank instead of defaulting to Seoul', () => {
    const items: ReportListItem[] = [
      { ...baseItem, id: 1, menteeRegion: '' },
      { ...baseItem, id: 2, menteeRegion: '   ' },
      { ...baseItem, id: 3, menteeRegion: '서울 연수생' },
    ]

    expect(filterReportsByCampus(items, 'seoul').map((item) => item.id)).toEqual([3])
  })
})
