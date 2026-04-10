import { BASE_URL, MENU_NO } from '@/constants'
import { parseCsrfToken } from '@/formatters'

interface RequestOptions {
  sessionCookie?: string
  csrfToken?: string
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

  constructor(options?: RequestOptions) {
    this.csrfToken = options?.csrfToken ?? null

    if (options?.sessionCookie) {
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
    return response.text()
  }

  async post(path: string, body: Record<string, string>): Promise<string> {
    const formBody = new URLSearchParams(this.buildBody(body))
    let response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
      redirect: 'manual',
    })

    this.updateFromResponse(response)

    while (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break

      const redirectUrl = location.startsWith('http') ? location : new URL(location, `${BASE_URL}/`).toString()
      response = await fetch(redirectUrl, {
        method: 'GET',
        headers: this.buildHeaders(),
        redirect: 'manual',
      })
      this.updateFromResponse(response)
    }

    return response.text()
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
    const actionMatch = html.match(/action='([^']+)'/)
    const fields: Record<string, string> = {}

    for (const match of html.matchAll(/name='([^']+)'\s+value='([^']*)'/g)) {
      fields[match[1]] = match[2]
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
    return cookieHeader ? { cookie: cookieHeader } : {}
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
}
