import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  isReservationConfirmSuccess,
  parseBookingPageBranches,
  parseBookingPageMeetings,
  parseMypageReservations,
  parseTozBoothes,
  parseTozDurations,
  parseTozReserved,
} from './toz-formatters'

const FIXTURES_DIR = join(__dirname, '__fixtures__', 'toz')

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf8')
}

function readJsonFixture<T>(name: string): T {
  return JSON.parse(readFixture(name)) as T
}

describe('parseBookingPageBranches', () => {
  it('extracts all 9 SW마에스트로 partner branches', () => {
    const html = readFixture('toz_booking.html')
    const branches = parseBookingPageBranches(html)

    expect(branches).toEqual([
      { id: 27, name: '강남토즈타워점' },
      { id: 145, name: '강남컨퍼런스센터' },
      { id: 19, name: '양재점' },
      { id: 20, name: '건대점' },
      { id: 15, name: '선릉점' },
      { id: 139, name: '마이스 역삼센터' },
      { id: 134, name: '마이스 광화문센터' },
      { id: 30, name: '신촌비즈센터' },
      { id: 149, name: '홍대점' },
    ])
  })
})

describe('parseBookingPageMeetings', () => {
  it('extracts meeting options excluding placeholder and 새모임', () => {
    const html = readFixture('toz_booking.html')
    const meetings = parseBookingPageMeetings(html)

    expect(meetings.length).toBeGreaterThan(50)
    expect(meetings[0]).toEqual({ id: 2305094, name: '멘토특강_김현동 님' })
    expect(meetings.find((m) => m.id === 2322942)).toEqual({
      id: 2322942,
      name: '자유멘토링_SW마에스트로',
    })

    expect(meetings.find((m) => m.name === '[새 모임]')).toBeUndefined()
    for (const meeting of meetings) {
      expect(Number.isInteger(meeting.id)).toBe(true)
      expect(meeting.id).toBeGreaterThan(0)
    }
  })
})

describe('parseTozDurations', () => {
  it('parses duration JSON with computed minutes', () => {
    const json = readJsonFixture('toz_duration.json')
    const durations = parseTozDurations(json)

    expect(durations[0]).toEqual({ key: '0200', value: '2시간', minutes: 120 })
    expect(durations[1]).toEqual({ key: '0230', value: '2시간 30분', minutes: 150 })
    expect(durations[2]).toEqual({ key: '0300', value: '3시간', minutes: 180 })
  })

  it('returns [] for non-array', () => {
    expect(parseTozDurations(null)).toEqual([])
    expect(parseTozDurations({})).toEqual([])
  })
})

describe('parseTozBoothes', () => {
  it('parses booth JSON array', () => {
    const json = readJsonFixture('toz_boothes.json')
    const boothes = parseTozBoothes(json)

    expect(boothes).toHaveLength(3)
    expect(boothes[0]).toEqual({
      id: 740,
      name: '304 _ A',
      branchName: '토즈타워점',
      branchTel: '02-3454-0116',
      minUseUserCount: 1,
      enableMaxUserCount: 2,
      boothGroupName: '2인부스 A타입',
      boothGroupUrl: 'https://moim.toz.co.kr/branchDetail?branch_id=28&url=&path=',
      boothMemoForUser: '15,000원(기본2시간)  / 기업, 학생할인 적용',
      isLargeBooth: false,
    })
  })

  it('throws on non-SUCCESS error response', () => {
    const error = [{ resultMsg: '예약 가능한 부스가 없습니다.' }]
    expect(() => parseTozBoothes(error)).toThrow('예약 가능한 부스가 없습니다.')
  })

  it('returns [] for empty', () => {
    expect(parseTozBoothes([])).toEqual([])
    expect(parseTozBoothes(null)).toEqual([])
  })
})

describe('parseTozReserved', () => {
  it('parses successful booth reservation response', () => {
    const reserved = parseTozReserved({
      result: 'SUCCESS',
      resultMsg: 'abc-123',
      branchName: '토즈타워점',
      branchTel: '02-3454-0116',
      boothGroupName: '2인부스 A타입',
      boothIsLarge: false,
      entitys: [],
    })

    expect(reserved).toEqual({
      reservationId: 'abc-123',
      branchName: '토즈타워점',
      branchTel: '02-3454-0116',
      boothGroupName: '2인부스 A타입',
      isLargeBooth: false,
    })
  })

  it('throws on failure response', () => {
    expect(() => parseTozReserved({ result: 'FAIL', resultMsg: '이미 예약된 부스입니다.' })).toThrow(
      '이미 예약된 부스입니다.',
    )
  })
})

describe('isReservationConfirmSuccess', () => {
  it('detects standard success', () => {
    expect(isReservationConfirmSuccess('예약 되었습니다.')).toBe(true)
  })

  it('detects large-booth success', () => {
    expect(isReservationConfirmSuccess('대형부스 예약 신청되었습니다. 지점에서 확인 전화를 드릴 예정입니다.')).toBe(
      true,
    )
  })

  it('rejects error messages', () => {
    expect(isReservationConfirmSuccess('인증번호가 올바르지 않습니다.')).toBe(false)
  })
})

describe('parseMypageReservations', () => {
  it('returns empty array when no reservations', () => {
    const html = readFixture('toz_mypage_response.html')
    expect(parseMypageReservations(html)).toEqual([])
  })

  it('parses synthetic reservation row', () => {
    const html = `
      <html><body>
        <table class="reservation"><thead><tr><th>NO</th></tr></thead><tbody>
          <tr><td colspan="7">예약 요청 정보가 없습니다.</td></tr>
        </tbody></table>
        <table class="reservation"><thead></thead><tbody>
          <tr>
            <td>1</td>
            <td>자유멘토링_홍길동</td>
            <td>2026-04-21</td>
            <td>14:00 ~ 16:00</td>
            <td>토즈타워점</td>
            <td>304 _ A</td>
            <td>2026-04-17 18:45</td>
            <td>예약완료 <a href="javascript:destroyReservation(987654)">취소</a></td>
          </tr>
        </tbody></table>
      </body></html>
    `

    expect(parseMypageReservations(html)).toEqual([
      {
        no: 1,
        reservationId: 987654,
        meetingName: '자유멘토링_홍길동',
        date: '2026-04-21',
        startTime: '14:00',
        endTime: '16:00',
        branchName: '토즈타워점',
        boothName: '304 _ A',
        reservedAt: '2026-04-17 18:45',
        status: '예약완료 취소',
      },
    ])
  })
})
