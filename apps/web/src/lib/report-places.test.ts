import { describe, expect, it } from 'bun:test'

import { locateReportPlace, reportPlaceCdFor, reportPlaceForRegion, reportPlacesForRegion } from './report-places'
import { allVenueItems } from './venues'

describe('reportPlacesForRegion', () => {
  it('offers a different set of places to each region', () => {
    const seoul = reportPlacesForRegion('S').map((place) => place.cd)
    const busan = reportPlacesForRegion('B').map((place) => place.cd)

    expect(busan).not.toEqual(seoul)
    expect(busan.filter((cd) => seoul.includes(cd))).toEqual([])
  })

  it('offers the Busan centre rooms, not only the external ones', () => {
    const labels = reportPlacesForRegion('B').map((place) => place.label)

    expect(labels).toContain('SPACE A1')
    expect(labels).toContain('(엑스퍼트) 부산센터 라운지')
  })

  it('shows the native label while submitting the native cd', () => {
    const sinchon = reportPlacesForRegion('S').find((place) => place.cd === '연수센터-7')

    expect(sinchon?.label).toBe('토즈-신촌비즈니스센터점')
  })

  it('falls back to Seoul for an unknown region', () => {
    expect(reportPlacesForRegion('')).toEqual(reportPlacesForRegion('S'))
  })
})

describe('reportPlaceForRegion', () => {
  it('drops a Seoul place when the report switches to Busan', () => {
    expect(reportPlaceForRegion('스페이스 A1', 'B')).toBe('')
  })

  it('drops a Busan place when the report switches back to Seoul', () => {
    expect(reportPlaceForRegion('CD_10', 'S')).toBe('')
  })

  it('keeps a place the new region still offers', () => {
    expect(reportPlaceForRegion('CD_25', 'B')).toBe('CD_25')
    expect(reportPlaceForRegion('온라인(Webex)', 'S')).toBe('온라인(Webex)')
  })

  it('rejects a label, since the form submits cds', () => {
    expect(reportPlaceForRegion('SPACE A1', 'B')).toBe('')
  })
})

describe('locateReportPlace', () => {
  it('reports the region a venue belongs to rather than assuming one', () => {
    expect(locateReportPlace('스페이스 A1')).toEqual({ menteeRegion: 'S', cd: '스페이스 A1' })
    expect(locateReportPlace('SPACE A1')).toEqual({ menteeRegion: 'B', cd: 'CD_10' })
  })

  it('keeps a 서울 venue on 서울 whichever campus is active', () => {
    for (const venue of allVenueItems) {
      expect(locateReportPlace(venue)?.menteeRegion).toBe('S')
    }
  })

  it('returns nothing for a venue neither region offers', () => {
    expect(locateReportPlace('없는 장소')).toBeNull()
    expect(locateReportPlace('')).toBeNull()
    expect(locateReportPlace('toString')).toBeNull()
  })
})

describe('reportPlaceCdFor', () => {
  it('turns a mentoring venue name into the cd the report form selects', () => {
    expect(reportPlaceCdFor('스페이스 A1', 'S')).toBe('스페이스 A1')
    expect(reportPlaceCdFor('토즈-신촌비즈니스센터점', 'S')).toBe('연수센터-7')
  })

  it('tolerates the trailing space the native label carries', () => {
    expect(reportPlaceCdFor('토즈-건대점 ', 'S')).toBe('토즈-건대점')
  })

  it('returns nothing for a venue the region does not offer', () => {
    expect(reportPlaceCdFor('하이텐 - 21호실(6인)', 'S')).toBe('')
    expect(reportPlaceCdFor('', 'S')).toBe('')
  })

  it('resolves the short names the mentoring form stores', () => {
    expect(reportPlaceCdFor('광화문점', 'S')).toBe('토즈-광화문점')
    expect(reportPlaceCdFor('양재점', 'S')).toBe('토즈-양재점')
    expect(reportPlaceCdFor('건대점', 'S')).toBe('토즈-건대점')
    expect(reportPlaceCdFor('신촌비즈니스센터점', 'S')).toBe('연수센터-7')
  })

  it('resolves every venue the mentoring form offers', () => {
    for (const venue of allVenueItems) {
      expect(reportPlaceCdFor(venue, 'S')).not.toBe('')
    }
  })

  it('returns nothing for a venue that happens to name an Object prototype member', () => {
    for (const venue of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      expect(reportPlaceCdFor(venue, 'S')).toBe('')
      expect(reportPlaceCdFor(venue, 'B')).toBe('')
    }
  })

  it('resolves the Busan spellings the SDK has long accepted', () => {
    expect(reportPlaceCdFor('온라인', 'B')).toBe('CD_25')
    expect(reportPlaceCdFor('Webex', 'B')).toBe('CD_25')
    expect(reportPlaceCdFor('(엑스퍼트) 외부_카페', 'B')).toBe('CD_9')
  })
})
