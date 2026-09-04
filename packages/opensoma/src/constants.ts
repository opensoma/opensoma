import { DEFAULT_SOMA_CAMPUS, getSomaBaseUrl } from './campus'

export const BASE_URL = getSomaBaseUrl(DEFAULT_SOMA_CAMPUS)

export const MENU_NO = {
  LOGIN: '200025',
  DASHBOARD: '200026',
  NOTICE: '200038',
  TEAM: '200093',
  SCHEDULE: '200043',
  MENTORING: '200046',
  APPLICATION_HISTORY: '200047',
  ROOM: '200058',
  MEMBER_INFO: '200036',
  REPORT: '200049',
  REPORT_APPROVAL: '200073',
} as const

export const ROOM_IDS: Record<string, number> = {
  A1: 17,
  A2: 18,
  A3: 19,
  A4: 20,
  A5: 21,
  A6: 22,
  A7: 23,
  A8: 24,
}

// Values mirror the native <select name="place"> options verbatim, including the
// trailing spaces on 건대/역삼/홍대 that swmaestro.ai ships in its HTML. Per the
// mirror rule in AGENTS.md, we send the native bytes exactly, not a "cleaned up"
// variant. If a future native release drops the spaces, update these here.
export const VENUES = {
  TOZ_GWANGHWAMUN: '토즈-광화문점',
  TOZ_YANGJAE: '토즈-양재점',
  TOZ_GANGNAM_CONFERENCE_CENTER: '토즈-강남컨퍼런스센터점',
  TOZ_KONKUK: '토즈-건대점 ',
  TOZ_GANGNAM_TOWER: '토즈-강남역토즈타워점',
  TOZ_SEOLLEUNG: '토즈-선릉점',
  TOZ_YEOKSAM: '토즈-역삼점 ',
  TOZ_HONGDAE: '토즈-홍대점 ',
  TOZ_SINCHON_BUSINESS_CENTER: '연수센터-7',
  ONLINE_WEBEX: '온라인(Webex)',
  SPACE_A1: '스페이스 A1',
  SPACE_A2: '스페이스 A2',
  SPACE_A3: '스페이스 A3',
  SPACE_A4: '스페이스 A4',
  SPACE_A5: '스페이스 A5',
  SPACE_A6: '스페이스 A6',
  SPACE_A7: '스페이스 A7',
  SPACE_A8: '스페이스 A8',
  SPACE_M1: '스페이스 M1',
  SPACE_M2: '스페이스 M2',
  SPACE_S: '스페이스 S',
  EXPERT_LOUNGE: '(엑스퍼트) 연수센터_라운지',
  EXPERT_CAFE: '(엑스퍼트) 외부_카페',
} as const

export const VENUE_ALIASES: Record<string, string> = {
  광화문점: '토즈-광화문점',
  양재점: '토즈-양재점',
  강남컨퍼런스센터점: '토즈-강남컨퍼런스센터점',
  건대점: '토즈-건대점 ',
  강남역토즈타워점: '토즈-강남역토즈타워점',
  선릉점: '토즈-선릉점',
  역삼점: '토즈-역삼점 ',
  홍대점: '토즈-홍대점 ',
  신촌비즈니스센터점: '연수센터-7',
  '토즈-광화문점': '토즈-광화문점',
  '토즈-양재점': '토즈-양재점',
  '토즈-강남컨퍼런스센터점': '토즈-강남컨퍼런스센터점',
  '토즈-건대점': '토즈-건대점 ',
  '토즈-강남역토즈타워점': '토즈-강남역토즈타워점',
  '토즈-선릉점': '토즈-선릉점',
  '토즈-역삼점': '토즈-역삼점 ',
  '토즈-홍대점': '토즈-홍대점 ',
  '토즈-신촌비즈니스센터점': '연수센터-7',
}

export interface ReportPlace {
  cd: string
  label: string
}

// The report form fills its progressPlace <select> from
// POST /mypage/mentoringReport/selectLocation.json {menteeRegionCd}, refetching on
// every 멘티 지역 change, then renders option.value = cd and option.text = cdNm. The
// two tables below are that response verbatim — same entries, same order, same bytes
// — so cd is what we must submit and label is only ever shown. Note they diverge:
// 토즈-건대점 has a trailing space in its label but not in its cd, and Busan cds are
// opaque CD_* values. Captured 2026-09-04; re-capture rather than hand-edit.
export const SEOUL_REPORT_PLACES: readonly ReportPlace[] = [
  { cd: '토즈-광화문점', label: '토즈-광화문점' },
  { cd: '토즈-양재점', label: '토즈-양재점' },
  { cd: '토즈-강남컨퍼런스센터점', label: '토즈-강남컨퍼런스센터점' },
  { cd: '토즈-건대점', label: '토즈-건대점 ' },
  { cd: '토즈-강남역토즈타워점', label: '토즈-강남역토즈타워점' },
  { cd: '토즈-선릉점', label: '토즈-선릉점 ' },
  { cd: '토즈-역삼점', label: '토즈-역삼점 ' },
  { cd: '토즈-홍대점', label: '토즈-홍대점' },
  { cd: '연수센터-7', label: '토즈-신촌비즈니스센터점' },
  { cd: '온라인(Webex)', label: '온라인(Webex)' },
  { cd: '스페이스 A1', label: '스페이스 A1' },
  { cd: '스페이스 A2', label: '스페이스 A2' },
  { cd: '스페이스 A3', label: '스페이스 A3' },
  { cd: '스페이스 A4', label: '스페이스 A4' },
  { cd: '스페이스 A5', label: '스페이스 A5' },
  { cd: '스페이스 A6', label: '스페이스 A6' },
  { cd: '스페이스 A7', label: '스페이스 A7' },
  { cd: '스페이스 A8', label: '스페이스 A8' },
  { cd: '스페이스 M1', label: '스페이스 M1' },
  { cd: '스페이스 M2', label: '스페이스 M2' },
  { cd: '7층 스페이스 S1', label: '7층 스페이스 S1' },
  { cd: '7층 스페이스 S2', label: '7층 스페이스 S2' },
  { cd: '스페이스 S', label: '스페이스 S' },
  { cd: '스페이스 S1-2', label: '(5월) 스페이스 S1-2' },
  { cd: '스페이스 S3-4', label: '(5월) 스페이스 S3-4' },
  { cd: '(엑스퍼트) 연수센터_라운지', label: '(엑스퍼트) 연수센터_라운지' },
  { cd: '(엑스퍼트) 외부_카페', label: '(엑스퍼트) 외부_카페' },
]

export const BUSAN_REPORT_PLACES: readonly ReportPlace[] = [
  { cd: 'CD_1', label: '하이텐 - 21호실(6인)' },
  { cd: 'CD_2', label: '하이텐 - 24호실(6인)' },
  { cd: 'CD_3', label: '하이텐 - 22호실(8인)' },
  { cd: 'CD_4', label: '하이텐 - 23호실(8인)' },
  { cd: 'CD_5', label: '하이스퀘어 - Q3(6인)' },
  { cd: 'CD_6', label: '하이스퀘어 - Q4(6인)' },
  { cd: 'CD_7', label: '하이스퀘어 - Q8(8인)' },
  { cd: 'CD_8', label: '하이스퀘어 - Q9(8인)' },
  { cd: 'CD_10', label: 'SPACE A1' },
  { cd: 'CD_11', label: 'SPACE A2' },
  { cd: 'CD_20', label: 'SPACE A3' },
  { cd: 'CD_21', label: 'SPACE A4' },
  { cd: 'CD_12', label: 'SPACE M1' },
  { cd: 'CD_13', label: 'SPACE M2' },
  { cd: 'CD_14', label: 'SPACE M3' },
  { cd: 'CD_30', label: 'SPACE S3-1' },
  { cd: 'CD_31', label: 'SPACE S3-2' },
  { cd: 'CD_32', label: 'SPACE S3-3' },
  { cd: 'CD_9', label: '(엑스퍼트) 외부 공간' },
  { cd: 'CD_22', label: '(엑스퍼트) 부산센터 라운지' },
  { cd: 'CD_25', label: '온라인(Webex)' },
]

export function getReportPlaces(menteeRegion: 'S' | 'B'): readonly ReportPlace[] {
  return menteeRegion === 'B' ? BUSAN_REPORT_PLACES : SEOUL_REPORT_PLACES
}

// Only a cd is valid on the wire, but callers hold whatever they happened to have:
// a cd, the label the select shows, a short name from the mentoring form, or one of
// these long-accepted spellings. Resolve all of them rather than making each caller
// guess which one it has.
const BUSAN_PLACE_ALIASES: Record<string, string> = {
  온라인: 'CD_25',
  Webex: 'CD_25',
  '(엑스퍼트) 외부_카페': 'CD_9',
}

export function findReportPlaceCd(venue: string, menteeRegion: 'S' | 'B'): string | null {
  const trimmed = venue.trim()
  if (!trimmed) return null

  const direct = matchReportPlace(trimmed, menteeRegion)
  if (direct) return direct

  const aliased = lookupAlias(VENUE_ALIASES, trimmed)
  const viaVenueAlias = aliased ? matchReportPlace(aliased.trim(), menteeRegion) : null
  if (viaVenueAlias) return viaVenueAlias

  if (menteeRegion === 'B') {
    return lookupAlias(BUSAN_PLACE_ALIASES, trimmed)
  }

  return null
}

// Venue names arrive from user input, so a plain index would hand back inherited
// Object.prototype members for keys like `toString` or `__proto__`.
function lookupAlias(aliases: Record<string, string>, key: string): string | null {
  return Object.hasOwn(aliases, key) ? aliases[key]! : null
}

function matchReportPlace(venue: string, menteeRegion: 'S' | 'B'): string | null {
  const match = getReportPlaces(menteeRegion).find((place) => place.cd === venue || place.label.trim() === venue)
  return match ? match.cd : null
}

/**
 * @deprecated Published API kept for existing consumers. Prefer
 * {@link findReportPlaceCd}, which also handles Seoul and the mentoring short names.
 * Derived from {@link BUSAN_REPORT_PLACES} so it cannot drift from the native table.
 */
export const BUSAN_PROGRESS_PLACE_CODES: Record<string, string> = {
  ...Object.fromEntries(BUSAN_REPORT_PLACES.map((place) => [place.label, place.cd])),
  ...BUSAN_PLACE_ALIASES,
}

export const REPORT_CD = {
  PUBLIC_MENTORING: 'MRC010',
  MENTOR_LECTURE: 'MRC020',
  REGULAR_MENTORING: 'MRC990',
} as const
export type ReportCd = (typeof REPORT_CD)[keyof typeof REPORT_CD]

export const TIME_SLOTS = createTimeSlots()

function createTimeSlots(): string[] {
  const slots: string[] = []

  for (let hour = 9; hour <= 23; hour += 1) {
    slots.push(formatTime(hour, 0), formatTime(hour, 30))
  }

  return slots
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export const TOZ_BASE_URL = 'http://partner.toz.co.kr/partner/reservation/fkii3/swmaestro'
export const TOZ_PARTNER = 'fkii3'
export const TOZ_COMPANY = 'swmaestro'
export const TOZ_MEMBER_COMPANY_ID = '25408'

// Static fallback list extracted from booking.htm. Use TozClient.branches() at runtime
// to fetch the live list — the SW마에스트로 partnership branch set may change.
export const TOZ_BRANCHES = [
  { id: 27, name: '강남토즈타워점' },
  { id: 145, name: '강남컨퍼런스센터' },
  { id: 19, name: '양재점' },
  { id: 20, name: '건대점' },
  { id: 15, name: '선릉점' },
  { id: 139, name: '마이스 역삼센터' },
  { id: 134, name: '마이스 광화문센터' },
  { id: 30, name: '신촌비즈센터' },
  { id: 149, name: '홍대점' },
] as const

export const TOZ_PHONE_PREFIXES = ['010', '011', '016', '017', '018', '019'] as const

export const TOZ_EMAIL_DOMAINS = [
  'hanmail.net',
  'gmail.com',
  'nate.com',
  'naver.com',
  'daum.net',
  'dreamwiz.com',
  'yahoo.com',
  'yahoo.co.kr',
  'msn.com',
  'paran.com',
  'korea.com',
  'freechal.com',
  'lycos.co.kr',
  'msn.co.kr',
  'empal.com',
  'hotmail.com',
] as const

export const TOZ_EMAIL_DOMAIN_CUSTOM = '직접입력'

export const TOZ_NEW_MEETING_VALUE = '새모임'

export const TOZ_MIN_DURATION_MINUTES = 120
export const TOZ_MAX_DURATION_MINUTES = 180
export const TOZ_SESSION_HOLD_SECONDS = 300

export const TOZ_MAX_CHECK_TIMES = 6
