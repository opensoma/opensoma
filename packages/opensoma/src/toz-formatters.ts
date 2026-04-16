import { parse } from 'node-html-parser'

import { decodeHtmlEntities } from './shared/utils/html'
import { parseDurationKey } from './shared/utils/toz'
import {
  type TozBooth,
  TozBoothSchema,
  type TozBranch,
  TozBranchSchema,
  type TozDuration,
  TozDurationSchema,
  type TozMeeting,
  TozMeetingSchema,
  type TozReservation,
  TozReservationSchema,
  type TozReserved,
  TozReservedSchema,
} from './types'

interface RawBooth {
  resultMsg?: string
  id?: number
  name?: string
  branchName?: string
  branchTel?: string
  minUseUserCount?: number
  enableMaxUserCount?: number
  boothGroupName?: string
  boothGroupUrl?: string | null
  boothMemoForUser?: string
  isLargeBooth?: boolean
}

interface RawReserved {
  result?: string
  resultMsg?: string
  branchName?: string
  branchTel?: string
  boothGroupName?: string
  boothIsLarge?: boolean
}

interface RawDuration {
  key: string
  value: string
}

export function parseBookingPageBranches(html: string): TozBranch[] {
  const root = parse(html)
  const inputs = root.querySelectorAll('input[name="branch_id"]')
  const branches: TozBranch[] = []

  for (const input of inputs) {
    const value = input.getAttribute('value')
    if (!value) continue
    const id = Number.parseInt(value, 10)
    if (!Number.isFinite(id)) continue

    const label = input.parentNode
    const name = label ? cleanText(label.text) : ''
    if (!name) continue

    branches.push(TozBranchSchema.parse({ id, name }))
  }

  return branches
}

export function parseBookingPageMeetings(html: string): TozMeeting[] {
  const root = parse(html)
  const select = root.querySelector('select[name="meeting_id"]')
  if (!select) return []

  const meetings: TozMeeting[] = []
  for (const option of select.querySelectorAll('option')) {
    const value = option.getAttribute('value')
    if (!value || value === '새모임') continue
    const id = Number.parseInt(value, 10)
    if (!Number.isFinite(id)) continue

    const name = cleanText(option.text)
    if (!name) continue

    meetings.push(TozMeetingSchema.parse({ id, name }))
  }

  return meetings
}

export function parseTozDurations(json: unknown): TozDuration[] {
  if (!Array.isArray(json)) return []
  const seen = new Set<string>()
  const durations: TozDuration[] = []

  for (const raw of json as RawDuration[]) {
    if (!raw?.key || !raw?.value || seen.has(raw.key)) continue
    seen.add(raw.key)
    durations.push(
      TozDurationSchema.parse({
        key: raw.key,
        value: raw.value,
        minutes: parseDurationKey(raw.key),
      }),
    )
  }

  return durations
}

export function parseTozBoothes(json: unknown): TozBooth[] {
  if (!Array.isArray(json)) return []
  const items = json as RawBooth[]
  if (items.length === 0) return []

  const first = items[0]
  if (first?.resultMsg && first.resultMsg !== 'SUCCESS') {
    throw new Error(first.resultMsg)
  }

  return items
    .filter((raw) => raw.id !== undefined && raw.id !== null)
    .map((raw) =>
      TozBoothSchema.parse({
        id: raw.id,
        name: raw.name ?? '',
        branchName: raw.branchName ?? '',
        branchTel: raw.branchTel ?? '',
        minUseUserCount: raw.minUseUserCount ?? 0,
        enableMaxUserCount: raw.enableMaxUserCount ?? 0,
        boothGroupName: raw.boothGroupName ?? '',
        boothGroupUrl: raw.boothGroupUrl ?? null,
        boothMemoForUser: raw.boothMemoForUser ?? '',
        isLargeBooth: Boolean(raw.isLargeBooth),
      }),
    )
}

export function parseTozReserved(json: unknown): TozReserved {
  const raw = json as RawReserved | null
  if (!raw || raw.result !== 'SUCCESS' || !raw.resultMsg) {
    throw new Error(raw?.resultMsg || '부스 예약에 실패했습니다.')
  }

  return TozReservedSchema.parse({
    reservationId: raw.resultMsg,
    branchName: raw.branchName ?? '',
    branchTel: raw.branchTel ?? '',
    boothGroupName: raw.boothGroupName ?? '',
    isLargeBooth: Boolean(raw.boothIsLarge),
  })
}

const SUCCESS_PATTERNS = ['예약 되었습니다', '대형부스 예약 신청되었습니다']

export function isReservationConfirmSuccess(resultMsg: string): boolean {
  return SUCCESS_PATTERNS.some((p) => resultMsg.includes(p))
}

export function parseMypageReservations(html: string): TozReservation[] {
  const root = parse(html)
  // The 실시간예약 table is the second table.reservation in the page.
  // The 상담요청 table (first) lives inside a parent <table style="display:none">.
  const tables = root.querySelectorAll('table.reservation')
  if (tables.length === 0) return []

  const target = tables[tables.length - 1]
  const rows = target.querySelectorAll('tbody tr')
  const reservations: TozReservation[] = []

  for (const row of rows) {
    const cells = row.querySelectorAll('td')
    if (cells.length !== 8) continue

    const [no, meetingName, date, time, branch, booth, reservedAt, statusCell] = cells
    const cancelLink = statusCell.querySelector('a')
    const reservationId = extractReservationIdFromOnclick(cancelLink?.getAttribute('href'))

    reservations.push(
      TozReservationSchema.parse({
        no: Number.parseInt(cleanText(no.text), 10) || 0,
        reservationId,
        meetingName: cleanText(meetingName.text),
        date: cleanText(date.text),
        ...splitTimeRange(cleanText(time.text)),
        branchName: cleanText(branch.text),
        boothName: cleanText(booth.text),
        reservedAt: cleanText(reservedAt.text),
        status: cleanText(statusCell.text),
      }),
    )
  }

  return reservations
}

function splitTimeRange(text: string): { startTime: string; endTime: string } {
  const match = /(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/.exec(text)
  if (!match) return { startTime: text, endTime: '' }
  return { startTime: match[1], endTime: match[2] }
}

function extractReservationIdFromOnclick(href: string | undefined): number | null {
  if (!href) return null
  const match = /destroyReservation\(\s*(\d+)\s*\)/.exec(href)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function cleanText(text: string): string {
  return decodeHtmlEntities(text).replace(/\s+/g, ' ').trim()
}
