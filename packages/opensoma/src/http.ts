import { BASE_URL, MENU_NO } from './constants'
import { AuthenticationError } from './errors'
import { parseCsrfToken } from './formatters'

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
const DEFAULT_ACCEPT_LANGUAGE = 'ko,en-US;q=0.9,en;q=0.8'

interface RequestOptions {
  sessionCookie?: string
  cookies?: string
  csrfToken?: string
  verbose?: boolean
}

interface CheckLoginResponse {
  resultCode?: string
  userVO?: { userId?: string; userNm?: string; userSn?: number }
}

export interface UserIdentity {
  userId: string
  userNm: string
}

interface HeadersWithCookieHelpers extends Omit<Headers, 'getSetCookie'> {
  getSetCookie?: () => string[]
}

export class SomaHttp {
  private cookies = new Map<string, string>()
  private csrfToken: string | null
  private verbose: boolean

  constructor(options?: RequestOptions) {
    this.csrfToken = options?.csrfToken ?? null
    this.verbose = options?.verbose ?? false

    if (options?.cookies) {
      for (const cookie of options.cookies.split(';')) {
        this.setCookie(cookie.trim())
      }
    } else if (options?.sessionCookie) {
      this.setCookie(
        options.sessionCookie.includes('=') ? options.sessionCookie : `JSESSIONID=${options.sessionCookie}`,
      )
    }
  }

  async get(path: string, params?: Record<string, string>): Promise<string> {
    const response = await fetch(this.buildUrl(path, params), {
      method: 'GET',
      headers: this.buildHeaders(),
    })

    this.updateFromResponse(response)
    const body = await response.text()

    const errorInfo = this.extractErrorFromResponse(body, null, path)
    if (errorInfo === '__AUTH_ERROR__') {
      throw new AuthenticationError()
    }

    return body
  }

  async post(path: string, body: Record<string, string>): Promise<string> {
    const url = this.buildUrl(path)
    const formBody = new URLSearchParams(this.buildBody(body))

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
      redirect: 'manual',
    })

    this.updateFromResponse(response)

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      const intermediateBody = await response.clone().text()
      const errorInfo = this.extractErrorFromResponse(intermediateBody, location, path)
      if (errorInfo) {
        if (errorInfo === '__AUTH_ERROR__') {
          throw new AuthenticationError()
        }
        throw new Error(errorInfo)
      }
    }

    let finalUrl = url
    while (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break

      const redirectUrl = location.startsWith('http') ? location : new URL(location, `${BASE_URL}/`).toString()
      finalUrl = redirectUrl
      response = await fetch(redirectUrl, {
        method: 'GET',
        headers: this.buildHeaders(),
        redirect: 'manual',
      })
      this.updateFromResponse(response)
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const finalBody = await response.text()
    this.log('POST', path, '-> Final URL:', finalUrl)
    this.log('POST', path, '-> Response body (first 200 chars):', finalBody.slice(0, 200))

    // Use final URL path for auth check, not original path (login flow redirects to main page)
    const finalPath = new URL(finalUrl).pathname
    const errorInfo = this.extractErrorFromResponse(finalBody, null, finalPath)
    if (errorInfo) {
      this.log('POST', path, '-> Error detected:', errorInfo)
      if (errorInfo === '__AUTH_ERROR__') {
        throw new AuthenticationError()
      }
      throw new Error(errorInfo)
    }

    if (finalPath.includes('insertForm') || finalPath.includes('error') || finalPath.includes('fail')) {
      this.log('POST', path, '-> Suspicious final URL:', finalUrl)
      throw new Error('멘토링 등록에 실패했습니다.')
    }

    return finalBody
  }

  private extractErrorFromResponse(body: string, location: string | null, path?: string): string | null {
    this.log(
      'extractErrorFromResponse',
      path,
      'body length:',
      body.length,
      'title:',
      body.match(/<title>([^<]*)<\/title>/)?.[1],
    )

    const alertMatch = body.match(/<script>\s*alert\(['"](.+?)['"]\)\s*<\/script>/)
    if (alertMatch) {
      this.log('Found alert match:', alertMatch[1])
      return alertMatch[1]
    }

    const titleMatch = body.match(/<title>([^<]*)<\/title>/i)
    const pageTitle = titleMatch?.[1] ?? ''

    // Check for login page - server returns login page HTML (with login form) when session is invalid
    // The login page has both the SW마에스트로 title AND a login form with username/password inputs
    // Skip this check during login flow (forLogin = GET for CSRF, toLogin = POST credentials)
    const isLoginPath = path?.includes('/member/user/forLogin') || path?.includes('/member/user/toLogin')
    const hasUsername = body.includes('name="username"')
    const hasPassword = body.includes('name="password"')
    if (
      !isLoginPath &&
      hasUsername &&
      hasPassword &&
      (pageTitle.includes('AI·SW마에스트로') || pageTitle.includes('SW마에스트로'))
    ) {
      return '__AUTH_ERROR__'
    }

    const errorTitleMatch = body.match(/<title>(에러안내|오류|Error)[^<]*<\/title>/i)
    if (errorTitleMatch) {
      this.log('Found error title match')
      const msgVarMatch = body.match(/var\s+msg\s*=\s*['"](.+?)['"];/)
      if (msgVarMatch) {
        this.log('Found msg var:', msgVarMatch[1].slice(0, 100))
        return msgVarMatch[1]
      }
      const errorPatterns = [
        '등록에 실패',
        '저장에 실패',
        '오류가 발생',
        '실패하였습니다',
        '잘못된 접근',
        '권한이 없습니다',
        'SQLException',
        'Error updating database',
      ]
      for (const pattern of errorPatterns) {
        if (body.includes(pattern)) {
          this.log('Found error pattern:', pattern)
          return '멘토링 등록에 실패했습니다: ' + pattern
        }
      }
      return '에러가 발생했습니다'
    }

    return null
  }

  async postJson<T>(path: string, body: Record<string, string>): Promise<T> {
    const formBody = new URLSearchParams(this.buildBody(body))
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    this.updateFromResponse(response)
    return (await response.json()) as T
  }

  async login(username: string, password: string): Promise<void> {
    const csrfToken = await this.extractCsrfToken()

    const html = await this.post('/member/user/toLogin.do', {
      username,
      password,
      csrfToken,
      loginFlag: '',
      menuNo: MENU_NO.LOGIN,
    })

    // SWMaestro returns an intermediate form that auto-submits via JS:
    //   <form action="/sw/login.do"><input name="password" value="bcrypt_hash"/>...
    // We need to parse and submit this form to complete authentication.
    const actionMatch = html.match(/action=["']([^"']+)["']/)
    const fields: Record<string, string> = {}

    // Match name="..." or name='...' followed by value="..." or value='...'
    // Uses backreferences (\1 and \3) to match the same quote type for closing
    for (const match of html.matchAll(/name=(['"])([^'"]+)\1\s+value=(['"])(.*?)\3/g)) {
      fields[match[2]] = match[4]
    }

    if (actionMatch?.[1] && Object.keys(fields).length > 0) {
      const action = actionMatch[1].replace(/^\/sw/, '')
      await this.post(action, fields)
    }
  }

  async checkLogin(): Promise<UserIdentity | null> {
    const response = await fetch(this.buildUrl('/member/user/checkLogin.json'), {
      method: 'GET',
      headers: {
        ...this.buildHeaders(),
        Accept: 'application/json',
      },
    })

    this.updateFromResponse(response)
    const json = (await response.json()) as CheckLoginResponse
    const userId = json.userVO?.userId
    if (!userId) return null
    return { userId, userNm: json.userVO?.userNm ?? '' }
  }

  async logout(): Promise<void> {
    await this.get('/member/user/logout.do')
  }

  async extractCsrfToken(): Promise<string> {
    const html = await this.get('/member/user/forLogin.do', { menuNo: MENU_NO.LOGIN })
    const token = parseCsrfToken(html)
    this.csrfToken = token
    return token
  }

  getCookies(): Record<string, string> {
    return Object.fromEntries(this.cookies)
  }

  getSessionCookie(): string | undefined {
    return this.cookies.get('JSESSIONID')
  }

  getCsrfToken(): string | null {
    return this.csrfToken
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const url = new URL(normalizedPath, `${BASE_URL}/`)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }

    return url.toString()
  }

  private buildHeaders(): Record<string, string> {
    const cookieHeader = this.serializeCookies()
    return {
      'Accept-Language': DEFAULT_ACCEPT_LANGUAGE,
      'User-Agent': DEFAULT_USER_AGENT,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    }
  }

  private buildBody(body: Record<string, string>): Record<string, string> {
    if (this.csrfToken && !('csrfToken' in body)) {
      return { ...body, csrfToken: this.csrfToken }
    }

    return body
  }

  private updateFromResponse(response: Response): void {
    const setCookies = this.readSetCookies(response.headers)

    for (const cookie of setCookies) {
      this.setCookie(cookie)
    }
  }

  private readSetCookies(headers: Headers): string[] {
    const enhancedHeaders = headers as HeadersWithCookieHelpers

    if (typeof enhancedHeaders.getSetCookie === 'function') {
      return enhancedHeaders.getSetCookie()
    }

    const singleHeader = headers.get('set-cookie')
    return singleHeader ? [singleHeader] : []
  }

  private setCookie(cookieHeader: string): void {
    const cookiePair = cookieHeader.split(';')[0]?.trim()
    if (!cookiePair) {
      return
    }

    const separatorIndex = cookiePair.indexOf('=')
    if (separatorIndex === -1) {
      return
    }

    const name = cookiePair.slice(0, separatorIndex).trim()
    const value = cookiePair.slice(separatorIndex + 1).trim()

    if (name) {
      this.cookies.set(name, value)
    }
  }

  private serializeCookies(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
  }

  private log(...args: unknown[]): void {
    if (this.verbose) {
      console.log('[opensoma]', ...args)
    }
  }
}
