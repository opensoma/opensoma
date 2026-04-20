import { parse } from 'node-html-parser'

import { MENU_NO, REPORT_CD, ROOM_IDS, TIME_SLOTS, VENUE_ALIASES } from '../../constants'
import { type ApplicationHistoryItem, ApplicationHistoryItemSchema } from '../../types'
import { decodeHtmlEntities, escapeHtml } from './html'

export function toReportCd(type: 'public' | 'lecture'): string {
  return type === 'lecture' ? REPORT_CD.MENTOR_LECTURE : REPORT_CD.PUBLIC_MENTORING
}

export function toMentoringType(type: string): 'public' | 'lecture' {
  if (type.includes('특강') || type === 'lecture') return 'lecture'
  return 'public'
}

export function buildMentoringPayload(params: {
  title: string
  type: 'public' | 'lecture'
  date: string
  startTime: string
  endTime: string
  venue: string
  maxAttendees?: number
  regStart?: string
  regEnd?: string
  content?: string
}): Record<string, string> {
  return {
    menuNo: MENU_NO.MENTORING,
    reportCd: toReportCd(params.type),
    qustnrSj: params.title,
    bgnde: params.regStart ?? params.date,
    endde: params.regEnd ?? params.date,
    applyCnt: String(params.maxAttendees ?? (params.type === 'lecture' ? 6 : 1)),
    eventDt: params.date,
    eventStime: params.startTime,
    eventEtime: params.endTime,
    place: resolveVenue(params.venue),
    qestnarCn: formatEditorContent(params.content ?? ''),
    atchFileId: '',
    fileFieldNm_1: '',
    stateCd: 'QST020',
    openAt: 'Y',
    qustnrAt: 'Y',
    qustnrSn: '',
    pageQueryString: '',
  }
}

export function buildUpdateMentoringPayload(
  id: number,
  params: Parameters<typeof buildMentoringPayload>[0],
): Record<string, string> {
  return {
    ...buildMentoringPayload(params),
    qustnrSn: String(id),
  }
}

export function buildDeleteMentoringPayload(id: number): Record<string, string> {
  return {
    menuNo: MENU_NO.MENTORING,
    qustnrSn: String(id),
    pageQueryString: '',
  }
}

export function buildApplicationPayload(id: number): Record<string, string> {
  return {
    menuNo: MENU_NO.EVENT,
    qustnrSn: String(id),
    applyGb: 'C',
    stepHeader: '0',
  }
}

export function buildCancelApplicationPayload(params: { applySn: number; qustnrSn: number }): Record<string, string> {
  return {
    menuNo: MENU_NO.APPLICATION_HISTORY,
    applySn: String(params.applySn),
    qustnrSn: String(params.qustnrSn),
  }
}

export function resolveVenue(venue: string): string {
  const trimmed = venue.trim()
  return VENUE_ALIASES[trimmed] ?? trimmed
}

export function resolveRoomId(room: string | number): number {
  if (typeof room === 'number') {
    return room
  }

  const normalized = room.trim().toUpperCase()
  const mapped = ROOM_IDS[normalized]
  if (mapped) {
    return mapped
  }

  const numeric = Number.parseInt(room, 10)
  if (Number.isNaN(numeric)) {
    throw new Error(`Unknown room: ${room}`)
  }

  return numeric
}

export function validateReservationSlots(slots: string[]): void {
  if (slots.length === 0) {
    throw new Error('At least one time slot is required')
  }

  if (slots.length > 8) {
    throw new Error('You can reserve up to 8 consecutive slots')
  }

  const indices = slots.map((slot) => {
    const index = TIME_SLOTS.indexOf(slot)
    if (index === -1) {
      throw new Error(`Invalid time slot: ${slot}`)
    }
    return index
  })

  for (let index = 1; index < indices.length; index += 1) {
    if (indices[index] !== indices[index - 1] + 1) {
      throw new Error('Time slots must be consecutive')
    }
  }
}

export function buildRoomReservationPayload(params: {
  roomId: number
  date: string
  slots: string[]
  title: string
  attendees?: number
  notes?: string
}): Record<string, string> {
  validateReservationSlots(params.slots)

  const firstSlot = params.slots[0]
  const lastSlot = params.slots[params.slots.length - 1]

  const payload: Record<string, string> = {
    menuNo: MENU_NO.ROOM,
    itemId: String(params.roomId),
    rentBgnde: `${params.date} ${firstSlot}:00`,
    rentEndde: `${params.date} ${lastSlot}:00`,
    title: params.title,
    rentDt: params.date,
    rentNum: String(params.attendees ?? 1),
    infoCn: params.notes ?? '',
    rentId: '',
    pageQueryString: '',
  }

  params.slots.forEach((slot, index) => {
    payload[`time[${index}]`] = slot
    payload[`chkData_${index + 1}`] = `${params.date}|${slot}|${params.roomId}`
  })

  return payload
}

export function parseApplicationHistory(html: string): ApplicationHistoryItem[] {
  const root = parse(html)
  const rows =
    root.querySelectorAll('table tbody tr').length > 0
      ? root.querySelectorAll('table tbody tr')
      : root.querySelectorAll('table tr').slice(1)

  return rows
    .map((row) => row.querySelectorAll('td'))
    .filter((cells) => cells.length >= 4)
    .map((cells) =>
      ApplicationHistoryItemSchema.parse({
        id: extractNumber(cleanText(cells[0]?.text)),
        title: cleanText(cells[1]?.text),
        appliedAt: cleanText(cells[2]?.text),
        status: cleanText(cells[3]?.text),
      }),
    )
}

export function parseEventDetail(html: string): Record<string, unknown> {
  const root = parse(html)
  const labels = extractLabelMap(root)
  const contentNode =
    root.querySelector('[data-content]') ??
    root.querySelector('.board-view-content') ??
    root.querySelector('.view-content') ??
    root.querySelector('.content-body')

  return {
    id: extractNumber(labels.NO ?? labels.번호 ?? root.querySelector('[name="bbsId"]')?.getAttribute('value') ?? '0'),
    title: labels.제목 ?? cleanText(root.querySelector('h1, h2, .title')?.text),
    content: decodeHtmlEntities(contentNode?.innerHTML.trim() ?? ''),
    fields: labels,
  }
}

function extractLabelMap(root: ReturnType<typeof parse>): Record<string, string> {
  const map: Record<string, string> = {}

  for (const row of root.querySelectorAll('tr')) {
    const headers = row.querySelectorAll('th')
    const values = row.querySelectorAll('td')

    if (headers.length === 1 && values.length === 1) {
      map[cleanText(headers[0]?.text).replace(/:$/, '')] = cleanText(values[0]?.text)
    }

    if (headers.length > 1 && headers.length === values.length) {
      headers.forEach((header, index) => {
        map[cleanText(header.text).replace(/:$/, '')] = cleanText(values[index]?.text)
      })
    }
  }

  return map
}

const EDITOR_P_STYLE = 'font-family: 굴림; font-size: 12pt; line-height: 1.2; margin-top: 0px; margin-bottom: 0px;'

function formatEditorContent(content: string): string {
  if (!content) return ''
  const decoded = decodeHtmlEntities(content)
  if (/<(?:p|div|h[1-6]|ul|ol|table|br)\b/i.test(decoded)) {
    return decoded
  }
  return decoded
    .split(/\n/)
    .map((line) => `<p style="${EDITOR_P_STYLE}">${escapeHtml(line) || '&nbsp;'}</p>`)
    .join('')
}

function cleanText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').replace(/\[|\]/g, '').trim()
}

function extractNumber(value: string): number {
  const match = value.match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : 0
}

export function toRegionCode(region: string): 'S' | 'B' {
  if (region.includes('부산') || region === 'B') return 'B'
  return 'S'
}

export function toReportTypeCd(type: string): 'MRC010' | 'MRC020' {
  if (type.includes('특강') || type === 'MRC020') return 'MRC020'
  return 'MRC010'
}

export function buildReportPayload(options: {
  menteeRegion: 'S' | 'B'
  reportType: 'MRC010' | 'MRC020'
  progressDate: string // yyyy-mm-dd
  teamNames?: string
  venue: string
  attendanceCount: number
  attendanceNames: string
  progressStartTime: string // HH:mm
  progressEndTime: string // HH:mm
  exceptStartTime?: string
  exceptEndTime?: string
  exceptReason?: string
  subject: string
  content: string
  mentorOpinion?: string
  nonAttendanceNames?: string
  etc?: string
  menuNo?: string
  reportId?: number
}): Record<string, string> {
  const { progressDate, reportType } = options
  const [year, month, day] = progressDate.split('-')
  const typeNames: Record<string, string> = {
    MRC010: '자유 멘토링',
    MRC020: '멘토 특강',
  }
  const typeName = typeNames[reportType] ?? reportType
  const nttSj = `[${typeName}] ${year}년 ${month}월 ${day}일 멘토링 보고`

  return {
    menuNo: options.menuNo ?? '200049',
    menteeRegionCd: options.menteeRegion,
    reportGubunCd: reportType,
    progressDt: progressDate,
    teamNms: options.teamNames ?? '',
    progressPlace: resolveVenue(options.venue),
    attendanceCnt: String(options.attendanceCount),
    attendanceNms: options.attendanceNames,
    progressStime: options.progressStartTime,
    progressEtime: options.progressEndTime,
    exceptStime: options.exceptStartTime ?? '',
    exceptEtime: options.exceptEndTime ?? '',
    exceptReason: options.exceptReason ?? '',
    subject: options.subject,
    nttCn: options.content,
    mentoOpn: options.mentorOpinion ?? '',
    nonAttendanceNms: options.nonAttendanceNames ?? '',
    etc: options.etc ?? '',
    nttSj,
    ...(options.reportId !== undefined ? { reportId: String(options.reportId) } : {}),
  }
}
