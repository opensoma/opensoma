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

// Mirrors the Busan option set of the native report form's progressPlace <select>,
// which swmaestro.ai re-fetches from selectLocation.json on every 멘티 지역 change.
// Values must stay byte-identical to BUSAN_PROGRESS_PLACE_CODES keys in the SDK,
// otherwise the server silently drops the venue (see venues.test.ts).
export const busanVenues = [
  {
    group: '하이텐',
    items: ['하이텐 - 21호실(6인)', '하이텐 - 24호실(6인)', '하이텐 - 22호실(8인)', '하이텐 - 23호실(8인)'],
  },
  {
    group: '하이스퀘어',
    items: ['하이스퀘어 - Q3(6인)', '하이스퀘어 - Q4(6인)', '하이스퀘어 - Q8(8인)', '하이스퀘어 - Q9(8인)'],
  },
  { group: '엑스퍼트', items: ['(엑스퍼트) 외부 공간'] },
  { group: '온라인', items: ['온라인(Webex)'] },
]

export const allVenueItems = venues.flatMap((g) => g.items)

export const allBusanVenueItems = busanVenues.flatMap((g) => g.items)

export function getReportVenues(menteeRegion: string) {
  return menteeRegion === 'B' ? busanVenues : venues
}

export function venueForRegion(venue: string, menteeRegion: string) {
  const offered = getReportVenues(menteeRegion).some((group) => group.items.includes(venue))
  return offered ? venue : ''
}
