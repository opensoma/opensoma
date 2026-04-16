import { TOZ_BASE_URL } from './constants'

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
const DEFAULT_ACCEPT_LANGUAGE = 'ko,en-US;q=0.9,en;q=0.8'

interface HeadersWithCookieHelpers extends Omit<Headers, 'getSetCookie'> {
  getSetCookie?: () => string[]
}

export interface TozHttpOptions {
  sessionCookie?: string
  cookies?: Record<string, string>
}

export interface TozHttpState {
  cookies: Record<string, string>
}

export class TozHttp {
  private cookies = new Map<string, string>()

  constructor(options: TozHttpOptions = {}) {
    if (options.cookies) {
      for (const [name, value] of Object.entries(options.cookies)) {
        this.cookies.set(name, value)
      }
    } else if (options.sessionCookie) {
      this.cookies.set('JSESSIONID', stripJsessionPrefix(options.sessionCookie))
    }
  }

  async bootstrap(): Promise<void> {
    if (this.cookies.has('JSESSIONID')) return
    await this.get('/index.htm')
  }

  async get(path: string, params?: Record<string, string>): Promise<string> {
    const response = await fetch(this.buildUrl(path, params), {
      method: 'GET',
      headers: this.buildHeaders(),
      redirect: 'manual',
    })

    this.updateFromResponse(response)
    return this.readFollowingRedirects(response, 'GET')
  }

  async post(path: string, body: Record<string, string>): Promise<string> {
    const response = await this.rawPost(path, body)
    return this.readFollowingRedirects(response, 'POST')
  }

  async postJson<T>(path: string, body: Record<string, string>): Promise<T> {
    const text = await this.post(path, body)
    try {
      return JSON.parse(text) as T
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response from ${path}: ${error instanceof Error ? error.message : 'unknown'}`,
      )
    }
  }

  async postText(path: string, body: Record<string, string>): Promise<string> {
    return (await this.post(path, body)).trim()
  }

  getCookies(): Record<string, string> {
    return Object.fromEntries(this.cookies)
  }

  getSessionCookie(): string | undefined {
    return this.cookies.get('JSESSIONID')
  }

  getState(): TozHttpState {
    return { cookies: this.getCookies() }
  }

  private async rawPost(path: string, body: Record<string, string>): Promise<Response> {
    const url = this.buildUrl(path)
    const formBody = new URLSearchParams(body).toString()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: this.buildUrl('/booking.htm'),
      },
      body: formBody,
      redirect: 'manual',
    })

    this.updateFromResponse(response)
    return response
  }

  private async readFollowingRedirects(initial: Response, method: string): Promise<string> {
    let response = initial
    let hops = 0

    while (response.status >= 300 && response.status < 400 && hops < 5) {
      const location = response.headers.get('location')
      if (!location) break
      const redirectUrl = location.startsWith('http') ? location : new URL(location, `${TOZ_BASE_URL}/`).toString()
      response = await fetch(redirectUrl, {
        method: 'GET',
        headers: this.buildHeaders(),
        redirect: 'manual',
      })
      this.updateFromResponse(response)
      hops += 1
    }

    if (!response.ok) {
      throw new Error(`Toz ${method} ${initial.url} failed: HTTP ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path
    const url = new URL(normalized, `${TOZ_BASE_URL}/`)
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

  private updateFromResponse(response: Response): void {
    for (const cookie of readSetCookies(response.headers)) {
      this.setCookie(cookie)
    }
  }

  private setCookie(cookieHeader: string): void {
    const pair = cookieHeader.split(';')[0]?.trim()
    if (!pair) return
    const idx = pair.indexOf('=')
    if (idx === -1) return
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    if (name) this.cookies.set(name, value)
  }

  private serializeCookies(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
  }
}

function stripJsessionPrefix(cookie: string): string {
  return cookie.includes('=') ? (cookie.split('=', 2)[1] ?? cookie) : cookie
}

function readSetCookies(headers: Headers): string[] {
  const enhanced = headers as HeadersWithCookieHelpers
  if (typeof enhanced.getSetCookie === 'function') {
    return enhanced.getSetCookie()
  }
  const single = headers.get('set-cookie')
  return single ? [single] : []
}
