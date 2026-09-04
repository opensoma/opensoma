import { BUSAN_REPORT_VENUES } from 'opensoma/constants'

export const venues = [
  {
    group: '토즈 (외부)',
    items: [
      '광화문점',
      '양재점',
      '강남컨퍼런스센터점',
      '건대점',
      '강남역토즈타워점',
      '선릉점',
      '역삼점',
      '홍대점',
      '신촌비즈니스센터점',
    ],
  },
  { group: '온라인', items: ['온라인(Webex)'] },
  {
    group: '소마 내부 (12층)',
    items: [
      '스페이스 A1',
      '스페이스 A2',
      '스페이스 A3',
      '스페이스 A4',
      '스페이스 A5',
      '스페이스 A6',
      '스페이스 A7',
      '스페이스 A8',
      '스페이스 M1',
      '스페이스 M2',
    ],
  },
  { group: '소마 내부 (7층)', items: ['스페이스 S'] },
  { group: '엑스퍼트', items: ['(엑스퍼트) 연수센터_라운지', '(엑스퍼트) 외부_카페'] },
]

const busanGroupPrefixes = [
  { group: '하이텐', prefix: '하이텐' },
  { group: '하이스퀘어', prefix: '하이스퀘어' },
  { group: '엑스퍼트', prefix: '(엑스퍼트)' },
  { group: '온라인', prefix: '온라인' },
]

export const busanVenues = busanGroupPrefixes.map(({ group, prefix }) => ({
  group,
  items: BUSAN_REPORT_VENUES.filter((venue) => venue.startsWith(prefix)),
}))

export const allVenueItems = venues.flatMap((g) => g.items)

export const allBusanVenueItems = busanVenues.flatMap((g) => g.items)

export function getReportVenues(menteeRegion: string) {
  return menteeRegion === 'B' ? busanVenues : venues
}

export function venueForRegion(venue: string, menteeRegion: string) {
  const offered = getReportVenues(menteeRegion).some((group) => group.items.includes(venue))
  return offered ? venue : ''
}
