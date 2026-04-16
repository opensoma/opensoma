import { afterEach, describe, expect, mock, test } from 'bun:test'

import { TOZ_BASE_URL } from './constants'
import { TozClient } from './toz-client'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

function jsonResponse(body: unknown, cookies: string[] = []): Response {
  const response = new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
  Object.defineProperty(response.headers, 'getSetCookie', {
    value: () => cookies,
    configurable: true,
  })
  return response
}

function textResponse(body: string, cookies: string[] = []): Response {
  const response = new Response(body, { status: 200, headers: { 'Content-Type': 'text/html' } })
  Object.defineProperty(response.headers, 'getSetCookie', {
    value: () => cookies,
    configurable: true,
  })
  return response
}

describe('TozClient.available', () => {
  test('builds correct AJAX payload and parses booth response', async () => {
    const calls: { url: string; body: string }[] = []
    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const body = String(init?.body ?? '')
      calls.push({ url, body })

      if (url.endsWith('/index.htm')) return textResponse('ok', ['JSESSIONID=ABC'])
      if (url.endsWith('/ajaxGetEnableBoothes.htm')) {
        return jsonResponse([
          {
            resultMsg: 'SUCCESS',
            id: 740,
            name: '304 _ A',
            branchName: '토즈타워점',
            branchTel: '02-3454-0116',
            minUseUserCount: 1,
            enableMaxUserCount: 2,
            boothGroupName: '2인부스 A타입',
            boothGroupUrl: null,
            boothMemoForUser: '15,000원',
            isLargeBooth: false,
          },
        ])
      }
      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const client = new TozClient()
    const booths = await client.available({
      date: '2026-04-21',
      startTime: '14:00',
      durationMinutes: 120,
      userCount: 2,
      branchIds: [27, 145],
    })

    expect(booths).toHaveLength(1)
    expect(booths[0]?.id).toBe(740)
    expect(calls[1]?.url).toBe(`${TOZ_BASE_URL}/ajaxGetEnableBoothes.htm`)
    expect(calls[1]?.body).toBe(
      'basedate=2026-04-21&starttime=1400&durationTime=0200&userCount=2&branchIds=27%2C145%2C',
    )
  })

  test('throws on out-of-range duration', async () => {
    const client = new TozClient()
    await expect(
      client.available({ date: '2026-04-21', startTime: '14:00', durationMinutes: 60, userCount: 2, branchIds: [27] }),
    ).rejects.toThrow(/2h and 3h/)
  })
})

describe('TozClient.check', () => {
  test('rejects empty time list', async () => {
    const client = new TozClient()
    await expect(
      client.check({ date: '2026-04-21', startTimes: [], durationMinutes: 120, userCount: 2, branchIds: [27] }),
    ).rejects.toThrow(/at least one --time/)
  })

  test('rejects more than 6 times', async () => {
    const client = new TozClient()
    await expect(
      client.check({
        date: '2026-04-21',
        startTimes: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
        durationMinutes: 120,
        userCount: 2,
        branchIds: [27],
      }),
    ).rejects.toThrow(/Too many times/)
  })

  test('returns one result per time, captures errors per slot', async () => {
    let call = 0
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/index.htm')) return textResponse('ok', ['JSESSIONID=A'])
      call += 1
      if (call === 1) return jsonResponse([])
      if (call === 2) return jsonResponse([{ resultMsg: '예약 가능한 부스가 없습니다.' }])
      throw new Error(`Unexpected call ${call}`)
    }) as typeof fetch

    const client = new TozClient()
    const results = await client.check({
      date: '2026-04-21',
      startTimes: ['10:00', '14:00'],
      durationMinutes: 120,
      userCount: 2,
      branchIds: [27],
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ startTime: '10:00', booths: [] })
    expect(results[1]?.startTime).toBe('14:00')
    expect(results[1]?.error).toContain('예약 가능한 부스가 없습니다.')
  })
})

describe('TozClient.reserveBooth', () => {
  test('rejects large booth', async () => {
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/index.htm')) return textResponse('ok', ['JSESSIONID=A'])
      if (url.endsWith('/ajaxReservationBooth.htm')) {
        return jsonResponse({
          result: 'SUCCESS',
          resultMsg: 'res-1',
          branchName: 'X',
          branchTel: 'tel',
          boothGroupName: '대형부스',
          boothIsLarge: true,
        })
      }
      throw new Error(url)
    }) as typeof fetch

    const client = new TozClient()
    await expect(
      client.reserveBooth({ date: '2026-04-21', startTime: '14:00', durationMinutes: 120, userCount: 8, boothId: 999 }),
    ).rejects.toThrow(/대형부스/)
  })
})

describe('TozClient.confirm', () => {
  test('throws on non-success message', async () => {
    globalThis.fetch = mock(async () => jsonResponse({ resultMsg: '인증번호가 올바르지 않습니다.' })) as typeof fetch

    const client = new TozClient({ sessionCookie: 'A' })
    await expect(
      client.confirm({
        reservationId: 'r1',
        date: '2026-04-21',
        startTime: '14:00',
        durationMinutes: 120,
        name: '홍길동',
        phone: '010-1234-5678',
        email: 'me@gmail.com',
        pinNum: '000000',
        meetingId: 1234,
      }),
    ).rejects.toThrow('인증번호가 올바르지 않습니다.')
  })

  test('requires meetingId or newMeetingName', async () => {
    const client = new TozClient({ sessionCookie: 'A' })
    await expect(
      client.confirm({
        reservationId: 'r1',
        date: '2026-04-21',
        startTime: '14:00',
        durationMinutes: 120,
        name: '홍길동',
        phone: '010-1234-5678',
        email: 'me@gmail.com',
        pinNum: '123456',
      }),
    ).rejects.toThrow(/meetingId/)
  })
})
