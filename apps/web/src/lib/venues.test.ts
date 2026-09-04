import { describe, expect, it } from 'bun:test'

import { BUSAN_REPORT_VENUES } from 'opensoma/constants'

import { allBusanVenueItems, allVenueItems, getReportVenues, venueForRegion } from './venues'

describe('getReportVenues', () => {
  it('offers a different list for Busan than for Seoul', () => {
    const seoul = getReportVenues('S').flatMap((group) => group.items)
    const busan = getReportVenues('B').flatMap((group) => group.items)

    expect(busan).not.toEqual(seoul)
  })

  it('offers no Busan-only room to Seoul reports', () => {
    const seoul = getReportVenues('S').flatMap((group) => group.items)

    expect(seoul.filter((venue) => venue.startsWith('하이텐') || venue.startsWith('하이스퀘어'))).toEqual([])
  })

  it('offers no Seoul-only venue to Busan reports', () => {
    const busan = getReportVenues('B').flatMap((group) => group.items)

    expect(busan.filter((venue) => venue.startsWith('토즈') || venue.startsWith('스페이스'))).toEqual([])
  })

  it('falls back to the Seoul list for an unknown region', () => {
    expect(getReportVenues('')).toEqual(getReportVenues('S'))
  })
})

describe('venueForRegion', () => {
  it('clears a Seoul venue when the report switches to Busan', () => {
    expect(venueForRegion('스페이스 A1', 'B')).toBe('')
  })

  it('clears a Busan venue when the report switches back to Seoul', () => {
    expect(venueForRegion('하이텐 - 21호실(6인)', 'S')).toBe('')
  })

  it('keeps a venue that both regions offer', () => {
    expect(venueForRegion('온라인(Webex)', 'B')).toBe('온라인(Webex)')
    expect(venueForRegion('온라인(Webex)', 'S')).toBe('온라인(Webex)')
  })

  it('keeps a venue the region still offers', () => {
    expect(venueForRegion('하이스퀘어 - Q9(8인)', 'B')).toBe('하이스퀘어 - Q9(8인)')
  })

  it('clears an empty selection', () => {
    expect(venueForRegion('', 'S')).toBe('')
  })
})

describe('busanVenues', () => {
  it('matches the venue set the SDK can encode as CD_* codes', () => {
    expect(new Set(allBusanVenueItems)).toEqual(new Set(BUSAN_REPORT_VENUES))
  })

  it('offers each venue exactly once', () => {
    expect(new Set(allBusanVenueItems).size).toBe(allBusanVenueItems.length)
  })
})

describe('allVenueItems', () => {
  it('stays Seoul-only so mentoring forms are unaffected', () => {
    expect(allVenueItems).toEqual(getReportVenues('S').flatMap((group) => group.items))
  })
})
