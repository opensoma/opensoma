import { describe, expect, it } from 'bun:test'

import { buildRoomReservationPayload, resolveVenue } from './swmaestro'

describe('resolveVenue', () => {
  it('prepends "토즈-" to bare TOZ location names', () => {
    expect(resolveVenue('광화문점')).toBe('토즈-광화문점')
    expect(resolveVenue('양재점')).toBe('토즈-양재점')
    expect(resolveVenue('강남컨퍼런스센터점')).toBe('토즈-강남컨퍼런스센터점')
    expect(resolveVenue('건대점')).toBe('토즈-건대점')
    expect(resolveVenue('강남역토즈타워점')).toBe('토즈-강남역토즈타워점')
    expect(resolveVenue('선릉점')).toBe('토즈-선릉점')
    expect(resolveVenue('역삼점')).toBe('토즈-역삼점')
    expect(resolveVenue('홍대점')).toBe('토즈-홍대점')
  })

  it('passes through TOZ locations that already have the prefix', () => {
    expect(resolveVenue('토즈-광화문점')).toBe('토즈-광화문점')
    expect(resolveVenue('토즈-강남역토즈타워점')).toBe('토즈-강남역토즈타워점')
  })

  it('resolves "신촌비즈니스센터점" to "연수센터-7"', () => {
    expect(resolveVenue('신촌비즈니스센터점')).toBe('연수센터-7')
    expect(resolveVenue('토즈-신촌비즈니스센터점')).toBe('연수센터-7')
  })

  it('passes through non-TOZ venues unchanged', () => {
    expect(resolveVenue('온라인(Webex)')).toBe('온라인(Webex)')
    expect(resolveVenue('스페이스 A1')).toBe('스페이스 A1')
    expect(resolveVenue('스페이스 M1')).toBe('스페이스 M1')
    expect(resolveVenue('스페이스 S')).toBe('스페이스 S')
    expect(resolveVenue('(엑스퍼트) 연수센터_라운지')).toBe('(엑스퍼트) 연수센터_라운지')
    expect(resolveVenue('(엑스퍼트) 외부_카페')).toBe('(엑스퍼트) 외부_카페')
  })

  it('trims surrounding whitespace from the input', () => {
    expect(resolveVenue('  강남역토즈타워점  ')).toBe('토즈-강남역토즈타워점')
    expect(resolveVenue(' 스페이스 A1 ')).toBe('스페이스 A1')
  })

  it('passes through unknown venues unchanged', () => {
    expect(resolveVenue('기타 장소')).toBe('기타 장소')
  })
})

describe('buildRoomReservationPayload', () => {
  it('sets rentEndde to the last selected slot so the server reserves only the chosen slots', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['13:00', '13:30'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 13:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 13:30:00')
    expect(payload['time[0]']).toBe('13:00')
    expect(payload['time[1]']).toBe('13:30')
    expect(payload['time[2]']).toBeUndefined()
    expect(payload['chkData_1']).toBe('2026-04-20|13:00|17')
    expect(payload['chkData_2']).toBe('2026-04-20|13:30|17')
    expect(payload['chkData_3']).toBeUndefined()
  })

  it('handles a single-slot reservation', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['13:00'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 13:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 13:00:00')
    expect(payload['time[0]']).toBe('13:00')
    expect(payload['time[1]']).toBeUndefined()
  })

  it('handles a reservation ending at the last available slot', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['23:00', '23:30'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 23:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 23:30:00')
  })

  it('rejects non-consecutive slots', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: ['13:00', '14:00'],
        title: '회의',
      }),
    ).toThrow('Time slots must be consecutive')
  })

  it('rejects invalid time slots', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: ['25:00'],
        title: '회의',
      }),
    ).toThrow('Invalid time slot')
  })

  it('rejects empty slot lists', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: [],
        title: '회의',
      }),
    ).toThrow('At least one time slot is required')
  })
})
