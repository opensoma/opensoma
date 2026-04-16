export const BASE_URL = 'https://www.swmaestro.ai/sw'

export const MENU_NO = {
  LOGIN: '200025',
  DASHBOARD: '200026',
  NOTICE: '200038',
  TEAM: '200093',
  MENTORING: '200046',
  EVENT: '200045',
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

export const VENUES = {
  TOZ_GWANGHWAMUN: '토즈-광화문점',
  TOZ_YANGJAE: '토즈-양재점',
  TOZ_GANGNAM_CONFERENCE_CENTER: '토즈-강남컨퍼런스센터점',
  TOZ_KONKUK: '토즈-건대점',
  TOZ_GANGNAM_TOWER: '토즈-강남역토즈타워점',
  TOZ_SEOLLEUNG: '토즈-선릉점',
  TOZ_YEOKSAM: '토즈-역삼점',
  TOZ_HONGDAE: '토즈-홍대점',
  TOZ_SINCHON_BUSINESS_CENTER: '토즈-신촌비즈니스센터점',
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
  건대점: '토즈-건대점',
  강남역토즈타워점: '토즈-강남역토즈타워점',
  선릉점: '토즈-선릉점',
  역삼점: '토즈-역삼점',
  홍대점: '토즈-홍대점',
  신촌비즈니스센터점: '연수센터-7',
  '토즈-신촌비즈니스센터점': '연수센터-7',
}

export const REPORT_CD = {
  PUBLIC_MENTORING: 'MRC010',
  MENTOR_LECTURE: 'MRC020',
  REGULAR_MENTORING: 'MRC990',
} as const

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
