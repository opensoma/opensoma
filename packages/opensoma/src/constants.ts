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
  TOZ_GWANGHWAMUN: '광화문점',
  TOZ_YANGJAE: '양재점',
  TOZ_GANGNAM_CONFERENCE_CENTER: '강남컨퍼런스센터점',
  TOZ_KONKUK: '건대점',
  TOZ_GANGNAM_TOWER: '강남역토즈타워점',
  TOZ_SEOLLEUNG: '선릉점',
  TOZ_YEOKSAM: '역삼점',
  TOZ_HONGDAE: '홍대점',
  TOZ_SINCHON_BUSINESS_CENTER: '신촌비즈니스센터점',
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
} as const

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
