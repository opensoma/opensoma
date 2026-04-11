import { afterEach, describe, expect, mock, test } from 'bun:test'

import { MENU_NO } from './constants'
import { SomaHttp } from './http'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

describe('SomaHttp', () => {
  test('get sends query params and stores cookies', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(`https://www.swmaestro.ai/sw/member/user/forLogin.do?menuNo=${MENU_NO.LOGIN}`)
      return createResponse('<html></html>', ['JSESSIONID=session-1; Path=/', 'XSRF-TOKEN=csrf-1; Path=/'])
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new SomaHttp()
    const html = await http.get('/member/user/forLogin.do', { menuNo: MENU_NO.LOGIN })

    expect(html).toBe('<html></html>')
    expect(http.getCookies()).toEqual({ JSESSIONID: 'session-1', 'XSRF-TOKEN': 'csrf-1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('post encodes body and injects csrf token', async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      expect(init?.headers).toEqual({
        cookie: 'JSESSIONID=session-1',
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      expect(init?.body).toBe('title=%ED%85%8C%EC%8A%A4%ED%8A%B8&csrfToken=csrf-1')
      return createResponse('<html>ok</html>')
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new SomaHttp({ sessionCookie: 'session-1', csrfToken: 'csrf-1' })
    const html = await http.post('/mypage/mentoLec/insert.do', { title: '테스트' })

    expect(html).toBe('<html>ok</html>')
  })

  test('postJson returns parsed json', async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        cookie: 'JSESSIONID=session-1',
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      return createResponse(JSON.stringify({ resultCode: 'SUCCESS' }), [], 'application/json')
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new SomaHttp({ sessionCookie: 'session-1', csrfToken: 'csrf-1' })
    const json = await http.postJson<{ resultCode: string }>('/mypage/officeMng/rentTime.do', {
      itemId: '17',
    })

    expect(json).toEqual({ resultCode: 'SUCCESS' })
  })

  test('login fetches csrf token then posts credentials', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/forLogin.do')) {
        expect(init?.method).toBe('GET')
        return createResponse('<form><input type="hidden" name="csrfToken" value="csrf-login"></form>', [
          'JSESSIONID=session-2; Path=/',
        ])
      }

      expect(url).toBe('https://www.swmaestro.ai/sw/member/user/toLogin.do')
      expect(init?.method).toBe('POST')
      expect(init?.headers).toEqual({
        cookie: 'JSESSIONID=session-2',
        'Content-Type': 'application/x-www-form-urlencoded',
      })

      const body = new URLSearchParams(String(init?.body))
      expect(body.get('username')).toBe('neo@example.com')
      expect(body.get('password')).toBe('secret')
      expect(body.get('csrfToken')).toBe('csrf-login')
      expect(body.get('menuNo')).toBe(MENU_NO.LOGIN)
      return createResponse('<html>logged-in</html>', ['JSESSIONID=session-3; Path=/'])
    })
    globalThis.fetch = fetchMock as typeof fetch

    const http = new SomaHttp()
    await http.login('neo@example.com', 'secret')

    expect(http.getSessionCookie()).toBe('session-3')
    expect(http.getCsrfToken()).toBe('csrf-login')
  })

  test('checkLogin returns user identity when logged in, null otherwise', async () => {
    const loggedInMock = mock(async () =>
      createResponse(
        JSON.stringify({
          resultCode: 'fail',
          userVO: { userId: 'user@example.com', userNm: 'Test' },
        }),
        [],
        'application/json',
      ),
    )
    globalThis.fetch = loggedInMock as typeof fetch

    await expect(new SomaHttp().checkLogin()).resolves.toEqual({
      userId: 'user@example.com',
      userNm: 'Test',
    })

    const notLoggedInMock = mock(async () =>
      createResponse(JSON.stringify({ resultCode: 'fail', userVO: { userId: '', userSn: 0 } }), [], 'application/json'),
    )
    globalThis.fetch = notLoggedInMock as typeof fetch

    await expect(new SomaHttp().checkLogin()).resolves.toBeNull()
  })

  test('logout calls logout endpoint', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('https://www.swmaestro.ai/sw/member/user/logout.do')
      return createResponse('<html>bye</html>')
    })
    globalThis.fetch = fetchMock as typeof fetch

    await new SomaHttp({ sessionCookie: 'session-1' }).logout()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('extractCsrfToken reads hidden input', async () => {
    const fetchMock = mock(async () => createResponse('<input type="hidden" name="csrfToken" value="csrf-token">'))
    globalThis.fetch = fetchMock as typeof fetch

    const http = new SomaHttp()

    await expect(http.extractCsrfToken()).resolves.toBe('csrf-token')
    expect(http.getCsrfToken()).toBe('csrf-token')
  })
})

function createResponse(body: string, cookies: string[] = [], contentType = 'text/html'): Response {
  const headers = new Headers({ 'Content-Type': contentType })
  const response = new Response(body, { headers })
  const cookieHeaders = cookies

  Object.defineProperty(response.headers, 'getSetCookie', {
    value: () => cookieHeaders,
    configurable: true,
  })

  return response
}
