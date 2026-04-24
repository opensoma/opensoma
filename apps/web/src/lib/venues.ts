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

export const allVenueItems = venues.flatMap((g) => g.items)
