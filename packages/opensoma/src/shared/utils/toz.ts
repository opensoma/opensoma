import {
  TOZ_EMAIL_DOMAIN_CUSTOM,
  TOZ_EMAIL_DOMAINS,
  TOZ_MAX_DURATION_MINUTES,
  TOZ_MIN_DURATION_MINUTES,
  TOZ_PHONE_PREFIXES,
} from '../../constants'

export interface ParsedPhone {
  phone1: string
  phone2: string
  phone3: string
}

export interface ParsedEmail {
  email1: string
  email2: string
  email3: string
}

export function formatDuration(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error(`Invalid duration minutes: ${minutes}`)
  }
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}`
}

export function parseDurationKey(key: string): number {
  if (!/^\d{4}$/.test(key)) {
    throw new Error(`Invalid duration key: ${key}`)
  }
  const hh = Number.parseInt(key.slice(0, 2), 10)
  const mm = Number.parseInt(key.slice(2, 4), 10)
  return hh * 60 + mm
}

export function formatStartTime(time: string): { hour: string; minute: string } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) {
    throw new Error(`Invalid time: ${time} (expected HH:MM)`)
  }
  return { hour: match[1].padStart(2, '0'), minute: match[2] }
}

export function buildStartTimeParam(time: string): string {
  const { hour, minute } = formatStartTime(time)
  return `${hour}${minute}`
}

export function buildBranchIdsParam(branchIds: readonly number[]): string {
  if (branchIds.length === 0) {
    throw new Error('At least one branchId is required')
  }
  return `${branchIds.join(',')},`
}

export function parsePhone(phone: string): ParsedPhone {
  const digits = phone.replace(/[^0-9]/g, '')
  const prefix = TOZ_PHONE_PREFIXES.find((p) => digits.startsWith(p))
  if (!prefix) {
    throw new Error(`Unsupported phone prefix in: ${phone}`)
  }
  const rest = digits.slice(prefix.length)
  if (rest.length !== 7 && rest.length !== 8) {
    throw new Error(`Invalid phone number: ${phone}`)
  }
  const split = rest.length - 4
  return {
    phone1: prefix,
    phone2: rest.slice(0, split),
    phone3: rest.slice(split),
  }
}

export function formatPhone(parsed: ParsedPhone): string {
  return `${parsed.phone1}-${parsed.phone2}-${parsed.phone3}`
}

export function parseEmail(email: string): ParsedEmail {
  const at = email.indexOf('@')
  if (at <= 0 || at === email.length - 1) {
    throw new Error(`Invalid email: ${email}`)
  }
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const known = (TOZ_EMAIL_DOMAINS as readonly string[]).includes(domain)
  return known
    ? { email1: local, email2: domain, email3: '' }
    : { email1: local, email2: TOZ_EMAIL_DOMAIN_CUSTOM, email3: domain }
}

export function assertDurationInRange(minutes: number): void {
  if (minutes < TOZ_MIN_DURATION_MINUTES || minutes > TOZ_MAX_DURATION_MINUTES) {
    throw new Error(
      `SW마에스트로 partnership requires duration between ${TOZ_MIN_DURATION_MINUTES / 60}h and ${TOZ_MAX_DURATION_MINUTES / 60}h (got ${minutes} minutes)`,
    )
  }
}
