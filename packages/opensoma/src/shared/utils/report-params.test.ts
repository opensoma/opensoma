import { describe, expect, it } from 'bun:test'

import type { ReportListItem } from '../../types'
import { enrichReportsWithRegion, filterReportsByCampus } from './report-params'

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

const detailHtml = (region: string): string => `
  <div class="board-view"><table><tbody>
  <tr><th>멘토링 대상</th><td>${region}</td><th>구분</th><td>자유 멘토링</td></tr>
  <tr><th>진행 날짜</th><td>2026-04-10</td><th>작성자</th><td>Mentor One</td></tr>
  <tr><th>주제</th><td>테스트 주제입니다.</td></tr>
  <tr><th>추진 내용</th><td>테스트 내용입니다. 100자 이상 작성해야 하므로 충분히 긴 본문을 채워 스키마 검증을 통과하도록 작성합니다.</td></tr>
  <tr><th>상태</th><td>승인</td><th>인정시간</th><td>2시간</td></tr>
  <tr><th>지급액</th><td>200,000</td></tr>
  </tbody></table></div>
`

describe('enrichReportsWithRegion', () => {
  it('fetches each report detail and attaches its menteeRegion', async () => {
    const regionById: Record<number, string> = { 1: '서울 연수생', 2: '부산 연수생' }
    const requested: number[] = []
    const http = {
      get: async (path: string, params?: Record<string, string>) => {
        expect(path).toBe('/mypage/mentoringReport/view.do')
        const id = Number(params?.reportId)
        requested.push(id)
        return detailHtml(regionById[id] ?? '서울 연수생')
      },
    }

    const result = await enrichReportsWithRegion(http, [
      { ...baseItem, id: 1 },
      { ...baseItem, id: 2 },
    ])

    expect(requested.sort()).toEqual([1, 2])
    expect(result.find((item) => item.id === 1)?.menteeRegion).toBe('서울 연수생')
    expect(result.find((item) => item.id === 2)?.menteeRegion).toBe('부산 연수생')
  })
})

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

  it('drops items that were never enriched with a region', () => {
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
})
