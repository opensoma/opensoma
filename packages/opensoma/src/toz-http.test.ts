import { afterEach, describe, expect, mock, test } from 'bun:test'

import { TOZ_BASE_URL } from './constants'
import { TozHttp } from './toz-http'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

describe('TozHttp', () => {
  test('bootstrap GETs index.htm to seed JSESSIONID', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(`${TOZ_BASE_URL}/index.htm`)
      expect(init?.method).toBe('GET')
      return createResponse('ok', ['JSESSIONID=ABC123; Path=/; HttpOnly'])
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new TozHttp()
    await http.bootstrap()

    expect(http.getSessionCookie()).toBe('ABC123')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('bootstrap is no-op when JSESSIONID already set', async () => {
    const fetchMock = mock(async () => createResponse('ok'))
    globalThis.fetch = fetchMock as typeof fetch

    const http = new TozHttp({ sessionCookie: 'JSESSIONID=EXISTING' })
    await http.bootstrap()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(http.getSessionCookie()).toBe('EXISTING')
  })

  test('post sends URL-encoded body with required headers and cookie', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(`${TOZ_BASE_URL}/ajaxGetEnableBoothes.htm`)
      expect(init?.method).toBe('POST')

      const headers = init?.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded; charset=UTF-8')
      expect(headers['X-Requested-With']).toBe('XMLHttpRequest')
      expect(headers.Referer).toBe(`${TOZ_BASE_URL}/booking.htm`)
      expect(headers.cookie).toBe('JSESSIONID=ABC123')

      expect(init?.body).toBe('basedate=2026-04-21&starttime=1400&durationTime=0200&userCount=2&branchIds=27%2C')
      return createResponse('[]', [], 'application/json')
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new TozHttp({ sessionCookie: 'ABC123' })
    const text = await http.post('/ajaxGetEnableBoothes.htm', {
      basedate: '2026-04-21',
      starttime: '1400',
      durationTime: '0200',
      userCount: '2',
      branchIds: '27,',
    })

    expect(text).toBe('[]')
  })

  test('postJson parses JSON response', async () => {
    globalThis.fetch = mock(async () => createResponse('{"result":"SUCCESS","resultMsg":"abc"}')) as typeof fetch

    const http = new TozHttp({ sessionCookie: 'ABC' })
    const json = await http.postJson<{ result: string; resultMsg: string }>('/ajaxReservationBooth.htm', {})

    expect(json).toEqual({ result: 'SUCCESS', resultMsg: 'abc' })
  })

  test('postText trims plain-text response', async () => {
    globalThis.fetch = mock(async () => createResponse('SUCCESS\n')) as typeof fetch

    const http = new TozHttp({ sessionCookie: 'ABC' })
    expect(await http.postText('/ajaxHpVerify.htm', {})).toBe('SUCCESS')
  })

  test('strips JSESSIONID= prefix when constructed with full cookie string', async () => {
    const http = new TozHttp({ sessionCookie: 'JSESSIONID=XYZ789' })
    expect(http.getSessionCookie()).toBe('XYZ789')
    expect(http.getCookies()).toEqual({ JSESSIONID: 'XYZ789' })
  })

  test('constructor with cookies map preserves all cookies', async () => {
    const http = new TozHttp({ cookies: { JSESSIONID: 'A', other: 'B' } })
    expect(http.getCookies()).toEqual({ JSESSIONID: 'A', other: 'B' })
  })

  test('throws on non-2xx response', async () => {
    globalThis.fetch = mock(async () => createResponse('Server Error', [], 'text/html', { status: 500 })) as typeof fetch

    const http = new TozHttp({ sessionCookie: 'ABC' })
    await expect(http.get('/index.htm')).rejects.toThrow(/HTTP 500/)
  })
})

function createResponse(
  body: string,
  cookies: string[] = [],
  contentType = 'text/html',
  options: { status?: number } = {},
): Response {
  const headers = new Headers({ 'Content-Type': contentType })
  const response = new Response(body, { headers, status: options.status ?? 200 })
  Object.defineProperty(response.headers, 'getSetCookie', {
    value: () => cookies,
    configurable: true,
  })
  return response
}
