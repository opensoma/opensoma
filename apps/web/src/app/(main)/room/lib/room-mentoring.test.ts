import { describe, expect, it } from 'bun:test'

import {
  addThirtyMinutes,
  buildMentoringCreateUrl,
  isReservableVenue,
  roomToMentoringParams,
  venueToRoomCode,
  venueToRoomId,
} from './room-mentoring'

describe('roomToMentoringParams', () => {
  it('converts multiple room slots to mentoring params', () => {
    expect(
      roomToMentoringParams({
        date: '2025-01-15',
        roomName: '스페이스 A1',
        selectedSlots: ['14:00', '14:30', '15:00'],
      }),
    ).toEqual({
      date: '2025-01-15',
      startTime: '14:00',
      endTime: '15:30',
      venue: '스페이스 A1',
    })
  })

  it('handles a single selected slot', () => {
    expect(
      roomToMentoringParams({
        date: '2025-01-15',
        roomName: '스페이스 A8',
        selectedSlots: ['09:00'],
      }),
    ).toEqual({
      date: '2025-01-15',
      startTime: '09:00',
      endTime: '09:30',
      venue: '스페이스 A8',
    })
  })

  it('handles the midnight boundary', () => {
    expect(
      roomToMentoringParams({
        date: '2025-01-15',
        roomName: '스페이스 A2',
        selectedSlots: ['23:30'],
      }),
    ).toEqual({
      date: '2025-01-15',
      startTime: '23:30',
      endTime: '24:00',
      venue: '스페이스 A2',
    })
  })
})

describe('buildMentoringCreateUrl', () => {
  it('builds a create url with all params', () => {
    expect(
      buildMentoringCreateUrl({
        date: '2025-01-15',
        startTime: '14:00',
        endTime: '15:30',
        venue: '스페이스 A1',
      }),
    ).toBe(
      '/mentoring/create?date=2025-01-15&startTime=14%3A00&endTime=15%3A30&venue=%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4+A1',
    )
  })

  it('omits empty params', () => {
    expect(
      buildMentoringCreateUrl({
        date: '2025-01-15',
        startTime: '',
        endTime: '15:30',
        venue: '',
      }),
    ).toBe('/mentoring/create?date=2025-01-15&endTime=15%3A30')
  })
})

describe('venueToRoomCode', () => {
  it('extracts room codes from space venues', () => {
    expect(venueToRoomCode('스페이스 A1')).toBe('A1')
    expect(venueToRoomCode('스페이스 A8')).toBe('A8')
    expect(venueToRoomCode('스페이스 M1')).toBe('M1')
    expect(venueToRoomCode('스페이스 M2')).toBe('M2')
    expect(venueToRoomCode('스페이스 S')).toBe('S')
  })

  it('returns null for non-space venues', () => {
    expect(venueToRoomCode('온라인(Webex)')).toBeNull()
    expect(venueToRoomCode('광화문점')).toBeNull()
    expect(venueToRoomCode('A1')).toBeNull()
  })
})

describe('venueToRoomId', () => {
  it('maps reservable venues to room ids', () => {
    expect(venueToRoomId('스페이스 A1')).toBe(17)
    expect(venueToRoomId('스페이스 A8')).toBe(24)
  })

  it('returns null for non-reservable venues', () => {
    expect(venueToRoomId('스페이스 M1')).toBeNull()
    expect(venueToRoomId('온라인(Webex)')).toBeNull()
  })
})

describe('isReservableVenue', () => {
  it('returns true for reservable A rooms', () => {
    expect(isReservableVenue('스페이스 A1')).toBeTrue()
    expect(isReservableVenue('스페이스 A8')).toBeTrue()
  })

  it('returns false for unsupported venues', () => {
    expect(isReservableVenue('스페이스 M1')).toBeFalse()
    expect(isReservableVenue('스페이스 S')).toBeFalse()
    expect(isReservableVenue('온라인(Webex)')).toBeFalse()
  })
})

describe('addThirtyMinutes', () => {
  it('adds thirty minutes to a normal time', () => {
    expect(addThirtyMinutes('14:00')).toBe('14:30')
  })

  it('handles hour rollover', () => {
    expect(addThirtyMinutes('14:30')).toBe('15:00')
  })

  it('handles the day boundary', () => {
    expect(addThirtyMinutes('23:30')).toBe('24:00')
  })
})
