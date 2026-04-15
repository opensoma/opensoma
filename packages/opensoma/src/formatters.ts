import { type HTMLElement, parse } from 'node-html-parser'

import { decodeHtmlEntities } from './shared/utils/html'
import {
  ApplicationHistoryItemSchema,
  type ApplicationHistoryItem,
  ApprovalListItemSchema,
  type ApprovalListItem,
  DashboardSchema,
  EventListItemSchema,
  type Dashboard,
  type EventListItem,
  type MemberInfo,
  MemberInfoSchema,
  type MentoringDetail,
  MentoringDetailSchema,
  type MentoringListItem,
  MentoringListItemSchema,
  type NoticeDetail,
  NoticeDetailSchema,
  type NoticeListItem,
  NoticeListItemSchema,
  type Pagination,
  PaginationSchema,
  type ReportDetail,
  ReportDetailSchema,
  type ReportListItem,
  ReportListItemSchema,
  type RoomCard,
  RoomCardSchema,
  type TeamInfo,
  TeamInfoSchema,
} from './types'

type LabelMap = Record<string, string>

export function parseMentoringList(html: string): MentoringListItem[] {
  return findTableRows(html, 9).map((cells) => {
    const titleLink = cells[1]?.querySelector('a')
    const titleText = cleanText(titleLink ?? cells[1])

    return MentoringListItemSchema.parse({
      id: extractUrlParam(titleLink?.getAttribute('href'), 'qustnrSn'),
      title: stripMentoringStatus(stripMentoringPrefix(titleText)),
      type: extractMentoringType(titleText),
      registrationPeriod: extractDateRange(cleanText(cells[2])),
      sessionDate: extractFirstDate(cleanText(cells[3])),
      sessionTime: extractTimeRange(cleanText(cells[3])),
      attendees: extractAttendees(cleanText(cells[4])),
      approved: /OK/i.test(cleanText(cells[5])),
      status: extractStatus(cleanText(cells[6]) || titleText),
      author: cleanText(cells[7]),
      createdAt: cleanText(cells[8]),
    })
  })
}

export function parseMentoringDetail(html: string, id = 0): MentoringDetail {
  const root = parse(html)
  const labels = { ...extractLabelMap(root), ...extractGroupMap(root) }
  const rawTitle = labels['모집 명'] || labels['제목'] || cleanText(root.querySelector('h1, h2, .title'))
  const dateText = labels['강의날짜'] || labels['진행날짜'] || ''
  const contentNode =
    root.querySelector('.cont') ??
    root.querySelector('.board-view-content') ??
    root.querySelector('.view-content') ??
    root.querySelector('.content-body') ??
    root.querySelector('#contents')
  const applicantTable = root.querySelectorAll('table').find((table) => {
    const headers = table.querySelectorAll('thead th')
    return headers.length === 5 && cleanText(headers[1]) === '연수생'
  })
  const applicants = (applicantTable?.querySelectorAll('tbody tr') ?? [])
    .map((row) => row.querySelectorAll('td'))
    .filter((cells) => cells.length === 5)
    .map((cells) => ({
      name: cleanText(cells[1]),
      appliedAt: cleanText(cells[2]),
      cancelledAt: cleanText(cells[3]),
      status: stripWrappingBrackets(cleanText(cells[4])),
    }))

  return MentoringDetailSchema.parse({
    id: id || extractNumber(root.querySelector('[name="qustnrSn"]')?.getAttribute('value') ?? ''),
    title: stripMentoringStatus(stripMentoringPrefix(rawTitle)),
    type: extractMentoringType(
      labels['유형'] || root.querySelector('[name="reportCd"]')?.getAttribute('value') || rawTitle,
    ),
    registrationPeriod: extractDateRange(labels['접수 기간'] || labels['접수기간'] || ''),
    sessionDate: extractFirstDate(dateText),
    sessionTime: extractTimeRange(dateText),
    attendees: {
      current: extractNumber(
        labels['신청인원'] || labels['현재인원'] || cleanText(root.querySelector('.total-normal')) || '',
      ),
      max: extractNumber(labels['모집인원'] || labels['수강인원'] || ''),
    },
    approved: /OK/i.test(labels['개설 승인'] || labels['개설승인'] || ''),
    status: extractStatus(labels.상태 || rawTitle),
    author: labels['작성자'] || '',
    createdAt: labels['등록일'] || '',
    content: decodeHtmlEntities(contentNode?.innerHTML.trim() ?? ''),
    venue: labels['장소'] || '',
    applicants,
  })
}

export function parseRoomList(html: string): RoomCard[] {
  const root = parse(html)
  const cards = root.querySelectorAll('ul.bbs-reserve > li.item')

  return cards.map((card) => {
    const link = card.querySelector('a[onclick]')
    const description = cleanText(card.querySelector('.txt li p'))

    return RoomCardSchema.parse({
      itemId: extractUrlParam(extractLocationHref(link?.getAttribute('onclick')), 'itemId'),
      name: cleanText(card.querySelector('h4.tit')),
      capacity: extractCapacity(description || cleanText(card)),
      availablePeriod: extractDateRange(findListText(card, '이용기간')),
      description,
      timeSlots: parseTimeSlotsFromRoot(card),
    })
  })
}

export function parseRoomSlots(html: string): RoomCard['timeSlots'] {
  const root = parse(html)
  const slots = root.querySelectorAll('span.ck-st2')

  if (slots.length === 0) {
    return parseTimeSlotsFromRoot(root)
  }

  return slots
    .map((slot) => {
      const hour = slot.getAttribute('data-hour') ?? ''
      const minute = slot.getAttribute('data-minute') ?? ''
      const checkbox = slot.querySelector('input[type="checkbox"]')
      const className = slot.getAttribute('class') ?? ''
      const time = hour && minute ? `${hour}:${minute}` : normalizeTime(cleanText(slot.querySelector('label') ?? slot))

      return {
        time,
        available: !checkbox?.hasAttribute('disabled') && !className.includes('disabled'),
      }
    })
    .filter((slot) => Boolean(slot.time))
}

export function parseDashboard(html: string): Dashboard {
  const root = parse(html)
  const profileCard = root.querySelector('ul.dash-top > li.dash-card')
  const dashEtc = profileCard?.querySelector('.dash-etc')
  const dashState = profileCard?.querySelector('.dash-state')
  const teamItems = dashState?.querySelectorAll('ul.dash-box > li') ?? []
  const team = {
    name: findDashboardValue(teamItems, '팀명'),
    members: findDashboardValue(teamItems, '팀원'),
    mentor: findDashboardValue(teamItems, '멘토'),
  }

  return DashboardSchema.parse({
    name: cleanText(dashState?.querySelector('.welcome strong')),
    role: cleanText(dashState?.querySelector('.label span')),
    organization: extractDashEtcValue(dashEtc, '소속'),
    position: extractDashEtcValue(dashEtc, '직책'),
    team: team.name || team.members || team.mentor ? team : undefined,
    mentoringSessions: parseDashboardLinks(root, (href) => href.includes('/mentoLec/')),
    roomReservations: parseDashboardLinks(root, (href) => href.includes('/itemRent/') || href.includes('/officeMng/')),
  })
}

export function parseNoticeList(html: string): NoticeListItem[] {
  return findTableRows(html, 4).map((cells) => {
    const link = cells[1]?.querySelector('a')

    return NoticeListItemSchema.parse({
      id: extractUrlParam(link?.getAttribute('href'), 'nttId'),
      title: cleanText(link ?? cells[1]),
      author: cleanText(cells[2]),
      createdAt: cleanText(cells[3]),
    })
  })
}

export function parseNoticeDetail(html: string, id = 0): NoticeDetail {
  const root = parse(html)
  const labels = extractLabelMap(root)
  const top = root.querySelector('.bbs-view .top')
  const spans = top?.querySelectorAll('.etc span') ?? []
  const author = extractPrefixedValue(spans, '작성자') || labels['작성자'] || ''
  const createdAt = extractPrefixedValue(spans, '등록일') || labels['등록일'] || ''
  const contentNode =
    root.querySelector('.bbs-view .cont') ??
    root.querySelector('.board-view-content') ??
    root.querySelector('.view-content') ??
    root.querySelector('.content-body') ??
    root.querySelector('#contents')

  return NoticeDetailSchema.parse({
    id: id || extractNumber(root.querySelector('[name="nttId"]')?.getAttribute('value') ?? ''),
    title: cleanText(top?.querySelector('.tit')) || labels['제목'] || cleanText(root.querySelector('h1, h2, .title')),
    author,
    createdAt,
    content: decodeHtmlEntities(contentNode?.innerHTML.trim() ?? ''),
  })
}

export function parseTeamInfo(html: string): TeamInfo {
  const root = parse(html)
  const cards = root.querySelectorAll('ul.bbs-team > li')
  const summaryText = cleanText(root.querySelector('p.ico-team'))
  const summaryNumbers = summaryText.match(/(\d+)\/(\d+)팀/)

  return TeamInfoSchema.parse({
    teams: cards.map((card) => ({
      name: cleanText(card.querySelector('.top strong.t a')),
      memberCount: extractMemberCount(cleanText(card)),
      joinStatus: extractJoinStatus(card),
    })),
    currentTeams: summaryNumbers ? Number.parseInt(summaryNumbers[1], 10) : 0,
    maxTeams: summaryNumbers ? Number.parseInt(summaryNumbers[2], 10) : 0,
  })
}

export function parseMemberInfo(html: string): MemberInfo {
  const labels = extractDefinitionListMap(parse(html))

  return MemberInfoSchema.parse({
    email: labels['아이디'] || '',
    name: labels['이름'] || '',
    gender: labels['성별'] || '',
    birthDate: labels['생년월일'] || '',
    phone: labels['연락처'] || '',
    organization: labels['소속'] || '',
    position: labels['직책'] || '',
  })
}

export function parseEventList(html: string): EventListItem[] {
  return findTableRows(html, 7).map((cells) =>
    EventListItemSchema.parse({
      id: extractLinkParam(cells[2], ['qustnrSn', 'bbsId', 'nttId']) || extractNumber(cleanText(cells[0])),
      category: cleanText(cells[1]),
      title: cleanText(cells[2]?.querySelector('a') ?? cells[2]),
      registrationPeriod: extractDateRange(cleanText(cells[3])),
      eventPeriod: extractDateRange(cleanText(cells[4])),
      status: stripWrappingBrackets(cleanText(cells[5])),
      createdAt: cleanText(cells[6]),
    }),
  )
}

export function parseApplicationHistory(html: string): ApplicationHistoryItem[] {
  return findTableRows(html, 10).map((cells) =>
    ApplicationHistoryItemSchema.parse({
      id: extractNumber(cleanText(cells[0])),
      category: cleanText(cells[1]),
      title: cleanText(cells[2]?.querySelector('a') ?? cells[2]),
      author: cleanText(cells[3]),
      sessionDate: normalizeDate(cleanText(cells[4])),
      appliedAt: cleanText(cells[5]),
      applicationStatus: stripWrappingBrackets(cleanText(cells[6])),
      approvalStatus: stripWrappingBrackets(cleanText(cells[7])),
      applicationDetail: cleanText(cells[8]),
      note: cleanText(cells[9]),
    }),
  )
}

export function parsePagination(html: string): Pagination {
  const root = parse(html)
  const items = root.querySelectorAll('ul.bbs-total > li').map((item) => cleanText(item))
  const total = extractNumber(items.find((item) => item.includes('Total')) ?? '')
  const pageMatch = items.find((item) => item.includes('Page'))?.match(/(\d+)\s*\/\s*(\d+)\s*Page/i)

  return PaginationSchema.parse({
    total,
    currentPage: pageMatch ? Number.parseInt(pageMatch[1], 10) : 1,
    totalPages: pageMatch ? Number.parseInt(pageMatch[2], 10) : 1,
  })
}

export function parseCsrfToken(html: string): string {
  const token = parse(html).querySelector('input[name="csrfToken"]')?.getAttribute('value')

  if (!token) {
    throw new Error('CSRF token not found')
  }

  return token
}

export function parseReportList(html: string): ReportListItem[] {
  return findTableRows(html, 9).map((cells) => {
    const link = cells[2]?.querySelector('a')

    return ReportListItemSchema.parse({
      id: extractUrlParam(link?.getAttribute('href'), 'reportId'),
      category: cleanText(cells[1]),
      title: cleanText(link ?? cells[2]),
      progressDate: cleanText(cells[3]),
      status: cleanText(cells[4]),
      author: cleanText(cells[5]),
      createdAt: cleanText(cells[6]),
      acceptedTime: cleanText(cells[7]),
      payAmount: cleanText(cells[8]),
    })
  })
}

export function parseReportDetail(html: string, id = 0): ReportDetail {
  const root = parse(html)
  const labels = extractLabelMap(root)

  const progressTimeText = labels['진행시간'] || ''
  const exceptTimeText = labels['제외시간'] || ''
  const progressTimes = progressTimeText.split(/\s*~\s*/)
  const exceptTimes = exceptTimeText.split(/\s*~\s*/)

  return ReportDetailSchema.parse({
    id,
    category: labels['구분'] || '',
    title: labels['제목'] || '',
    progressDate: labels['진행 날짜'] || '',
    status: labels['상태'] || '',
    author: labels['작성자'] || '',
    createdAt: labels['등록일'] || '',
    acceptedTime: labels['인정시간'] || '',
    payAmount: labels['지급액'] || '',
    content: labels['추진 내용'] || '',
    subject: labels['주제'] || '',
    menteeRegion: labels['멘토링 대상'] || '',
    reportType: labels['구분'] || '',
    teamNames: labels['팀명'] || '',
    venue: labels['진행 장소'] || '',
    attendanceCount: extractNumber(labels['참석 연수생'] || ''),
    attendanceNames: labels['참석자 이름'] || '',
    progressStartTime: progressTimes[0] || '',
    progressEndTime: progressTimes[1] || '',
    exceptStartTime: exceptTimes[0] || '',
    exceptEndTime: exceptTimes[1] || '',
    exceptReason: labels['제외 사유'] || labels['제외이유'] || '',
    mentorOpinion: labels['멘토 의견'] || '',
    nonAttendanceNames: labels['무단불참자'] || '',
    etc: labels['특이사항'] || '',
    files: [],
  })
}

export function parseApprovalList(html: string): ApprovalListItem[] {
  const rows = findTableRows(html, 10)

  if (rows.length === 1) {
    const firstRow = rows[0]
    if (firstRow[0]?.getAttribute('colspan') || cleanText(firstRow[0]).includes('데이터가 없습니다')) {
      return []
    }
  }

  return rows.map((cells) => {
    const link = cells[2]?.querySelector('a')

    return ApprovalListItemSchema.parse({
      id: extractUrlParam(link?.getAttribute('href'), 'reportId'),
      category: cleanText(cells[1]),
      title: cleanText(link ?? cells[2]),
      progressDate: cleanText(cells[3]),
      status: cleanText(cells[4]),
      author: cleanText(cells[5]),
      createdAt: cleanText(cells[6]),
      acceptedTime: cleanText(cells[7]),
      travelExpense: cleanText(cells[8]),
      mentoringAllowance: cleanText(cells[9]),
    })
  })
}

function findTableRows(html: string, cellCount: number): HTMLElement[][] {
  return parse(html)
    .querySelectorAll('table tbody tr')
    .map((row) => row.querySelectorAll('td'))
    .filter((cells) => cells.length === cellCount)
}

function extractLabelMap(root: HTMLElement): LabelMap {
  const map: LabelMap = {}

  for (const row of root.querySelectorAll('tr')) {
    const headers = row.querySelectorAll('th')
    const values = row.querySelectorAll('td')

    if (headers.length === values.length) {
      headers.forEach((header, index) => {
        map[cleanText(header).replace(/:$/, '')] = cleanText(values[index])
      })
    }
  }

  return map
}

function extractDefinitionListMap(root: HTMLElement): LabelMap {
  const map: LabelMap = {}

  for (const definition of root.querySelectorAll('dl')) {
    const label = cleanText(definition.querySelector('dt'))
    if (!label) {
      continue
    }

    map[label] = cleanText(definition.querySelector('dd'))
  }

  return map
}

function extractGroupMap(root: HTMLElement): LabelMap {
  const map: LabelMap = {}

  for (const group of root.querySelectorAll('.group')) {
    const label = cleanText(group.querySelector('strong.t')).replace(/:$/, '')
    if (!label) {
      continue
    }

    map[label] = cleanText(group.querySelector('.c'))
  }

  return map
}

function parseDashboardLinks(
  root: HTMLElement,
  predicate: (href: string) => boolean,
): Array<{
  title: string
  url: string
  status: string
  date?: string
  time?: string
  venue?: string
}> {
  return root
    .querySelectorAll('ul.bbs-dash_w a')
    .filter((link) => predicate(link.getAttribute('href') ?? ''))
    .map((link) => {
      const text = cleanText(link)
      const { cleanTitle, date, time, venue } = extractDateTimeFromTitle(text)
      return {
        title: stripTrailingStatus(cleanTitle),
        url: link.getAttribute('href') ?? '',
        status: extractTrailingStatus(text),
        date,
        time,
        venue,
      }
    })
}

function parseTimeSlotsFromRoot(root: HTMLElement): RoomCard['timeSlots'] {
  const grid = root.querySelector('.time-grid')
  const spans = grid
    ? grid.querySelectorAll('span')
    : root.querySelectorAll('.time-grid span, [class*="time-slot"], .slot')

  return spans
    .map((slot) => ({
      time: cleanText(slot),
      available:
        !(slot.getAttribute('class') ?? '').includes('not-reserve') &&
        !(slot.getAttribute('class') ?? '').includes('booked') &&
        !(slot.getAttribute('class') ?? '').includes('disabled'),
    }))
    .filter((slot) => Boolean(slot.time))
}

function findDashboardValue(items: HTMLElement[], label: string): string {
  const item = items.find((candidate) => cleanText(candidate.querySelector('strong.t')) === label)
  return cleanText(item?.querySelector('.c'))
}

function extractDashEtcValue(container: HTMLElement | null | undefined, label: string): string {
  const match = (container?.querySelectorAll('span') ?? []).find((item) => cleanText(item).startsWith(label))
  return cleanText(match)
    .replace(new RegExp(`^${escapeRegex(label)}\\s*:`), '')
    .trim()
}

function findListText(card: HTMLElement, label: string): string {
  const item = card.querySelectorAll('.txt > li').find((entry) => cleanText(entry).startsWith(label))
  return cleanText(item)
    .replace(new RegExp(`^${escapeRegex(label)}\\s*:`), '')
    .trim()
}

function extractLocationHref(onclick: string | undefined): string {
  const match = onclick?.match(/location\.href\s*=\s*['"]([^'"]+)['"]/) ?? onclick?.match(/['"]([^'"]+)['"]/)
  return match?.[1] ?? ''
}

function extractUrlParam(url: string | undefined, key: string): number {
  const normalizedUrl = url?.startsWith('http') ? url : `https://example.com${url ?? ''}`
  if (!normalizedUrl) {
    return 0
  }

  try {
    const value = new URL(normalizedUrl).searchParams.get(key)
    return extractNumber(value ?? '')
  } catch {
    return 0
  }
}

function extractLinkParam(cell: HTMLElement | undefined, keys: string[]): number {
  const href = cell?.querySelector('a')?.getAttribute('href')

  for (const key of keys) {
    const value = extractUrlParam(href, key)
    if (value > 0) {
      return value
    }
  }

  return 0
}

function extractDateRange(text: string): { start: string; end: string } {
  const dates = text.match(/\d{4}[.-]\d{2}[.-]\d{2}/g)?.map(normalizeDate) ?? []
  return { start: dates[0] ?? '', end: dates[1] ?? '' }
}

function extractTimeRange(text: string): { start: string; end: string } {
  const times = text.match(/\d{2}:\d{2}/g) ?? []
  return { start: times[0] ?? '', end: times[1] ?? '' }
}

function extractAttendees(text: string): { current: number; max: number } {
  const numbers = text.match(/\d+/g)?.map((value) => Number.parseInt(value, 10)) ?? []
  return { current: numbers[0] ?? 0, max: numbers[1] ?? 0 }
}

function extractStatus(text: string): '접수중' | '마감' {
  return text.includes('마감') ? '마감' : '접수중'
}

function extractMentoringType(text: string): '자유 멘토링' | '멘토 특강' {
  return /멘토 특강|MRC020/.test(text) ? '멘토 특강' : '자유 멘토링'
}

function extractFirstDate(text: string): string {
  return normalizeDate(text.match(/\d{4}[.-]\d{2}[.-]\d{2}/)?.[0] ?? '')
}

function extractCapacity(text: string): number {
  const match = text.match(/(\d+)\s*인/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function extractMemberCount(text: string): number {
  const match = text.match(/(\d+)\s*명/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function extractJoinStatus(card: HTMLElement): string {
  return (
    cleanText(card.querySelector('button')) ||
    cleanText(card.querySelector('.btn')) ||
    cleanText(card.querySelector('[class*="join"]')) ||
    ''
  )
}

function extractTrailingStatus(text: string): string {
  const match = text.match(/(예약완료|예약중|대기|접수중|마감|승인완료|신청완료)$/)
  return match?.[1] ?? ''
}

function extractDateTimeFromTitle(text: string): {
  cleanTitle: string
  date?: string
  time?: string
  venue?: string
} {
  // Match date patterns: 2025-04-15 or 2025.04.15
  const dateMatch = text.match(/(\d{4}[.-]\d{2}[.-]\d{2})/)
  // Match time patterns: 14:00~16:00 or 14:00
  const timeMatch = text.match(/(\d{2}:\d{2}(?:~\d{2}:\d{2})?)/)
  // Match venue patterns: 스페이스 A1, A1, 강의실, etc.
  const venueMatch = text.match(/(스페이스\s*[A-Z]\d+|강의실\s*\d+|회의실\s*[A-Z]?\d+|A\d|B\d|C\d)/i)

  let cleanTitle = text
  let date: string | undefined
  let time: string | undefined
  let venue: string | undefined

  if (dateMatch) {
    date = dateMatch[1].replace(/\./g, '-')
    cleanTitle = cleanTitle.replace(dateMatch[0], '')
  }

  if (timeMatch) {
    time = timeMatch[1]
    cleanTitle = cleanTitle.replace(timeMatch[0], '')
  }

  if (venueMatch) {
    venue = venueMatch[1]
    cleanTitle = cleanTitle.replace(venueMatch[0], '')
  }

  // Clean up remaining whitespace and punctuation
  cleanTitle = cleanTitle.replace(/^[\s\-~]+|[\s\-~]+$/g, '').trim()

  return { cleanTitle, date, time, venue }
}

function stripTrailingStatus(text: string): string {
  return text.replace(/\s*(예약완료|예약중|대기|접수중|마감|승인완료|신청완료)$/, '').trim()
}

function stripMentoringPrefix(text: string): string {
  return text.replace(/^\[(자유 멘토링|멘토 특강)\]\s*/, '').trim()
}

function stripMentoringStatus(text: string): string {
  return text.replace(/\s*\[(접수중|마감)\]\s*$/, '').trim()
}

function stripWrappingBrackets(text: string): string {
  return text.replace(/^\[/, '').replace(/\]$/, '').trim()
}

function extractNumber(text: string): number {
  const match = text.match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : 0
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractPrefixedValue(nodes: HTMLElement[], label: string): string {
  const match = nodes.find((node) => cleanText(node).includes(label))
  return cleanText(match)
    .replace(new RegExp(`^${escapeRegex(label)}\\s*:`), '')
    .trim()
}

function normalizeDate(value: string): string {
  return value.replace(/\./g, '-')
}

function normalizeTime(value: string): string {
  const match = value.match(/(\d{2}:\d{2})/)
  return match?.[1] ?? ''
}

function cleanText(value: string | HTMLElement | null | undefined): string {
  if (!value) {
    return ''
  }

  const text = typeof value === 'string' ? value : value.text
  return text.replace(/\s+/g, ' ').trim()
}
