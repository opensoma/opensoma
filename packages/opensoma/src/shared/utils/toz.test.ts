import { describe, expect, it } from 'bun:test'

import {
  assertDurationInRange,
  buildBranchIdsParam,
  buildStartTimeParam,
  formatDuration,
  formatPhone,
  formatStartTime,
  parseDurationKey,
  parseEmail,
  parsePhone,
} from './toz'

describe('formatDuration', () => {
  it('formats hours+minutes as HHMM', () => {
    expect(formatDuration(120)).toBe('0200')
    expect(formatDuration(150)).toBe('0230')
    expect(formatDuration(180)).toBe('0300')
    expect(formatDuration(90)).toBe('0130')
  })

  it('throws on invalid input', () => {
    expect(() => formatDuration(0)).toThrow()
    expect(() => formatDuration(-30)).toThrow()
    expect(() => formatDuration(1.5)).toThrow()
  })
})

describe('parseDurationKey', () => {
  it('parses HHMM keys to minutes', () => {
    expect(parseDurationKey('0200')).toBe(120)
    expect(parseDurationKey('0230')).toBe(150)
    expect(parseDurationKey('1300')).toBe(780)
  })

  it('throws on invalid key', () => {
    expect(() => parseDurationKey('0')).toThrow()
    expect(() => parseDurationKey('abcd')).toThrow()
    expect(() => parseDurationKey('20000')).toThrow()
  })
})

describe('formatStartTime / buildStartTimeParam', () => {
  it('splits HH:MM', () => {
    expect(formatStartTime('10:00')).toEqual({ hour: '10', minute: '00' })
    expect(formatStartTime('9:30')).toEqual({ hour: '09', minute: '30' })
  })

  it('joins to 4-digit param', () => {
    expect(buildStartTimeParam('10:00')).toBe('1000')
    expect(buildStartTimeParam('9:05')).toBe('0905')
  })

  it('rejects invalid time', () => {
    expect(() => formatStartTime('1000')).toThrow()
    expect(() => formatStartTime('25:00')).not.toThrow()
  })
})

describe('buildBranchIdsParam', () => {
  it('joins with trailing comma', () => {
    expect(buildBranchIdsParam([27])).toBe('27,')
    expect(buildBranchIdsParam([27, 145])).toBe('27,145,')
    expect(buildBranchIdsParam([27, 145, 19, 20, 15, 139, 134, 30, 149])).toBe('27,145,19,20,15,139,134,30,149,')
  })

  it('rejects empty list', () => {
    expect(() => buildBranchIdsParam([])).toThrow()
  })
})

describe('parsePhone', () => {
  it('parses standard 010-XXXX-YYYY', () => {
    expect(parsePhone('010-1234-5678')).toEqual({ phone1: '010', phone2: '1234', phone3: '5678' })
  })

  it('parses 010 with no dashes', () => {
    expect(parsePhone('01012345678')).toEqual({ phone1: '010', phone2: '1234', phone3: '5678' })
  })

  it('parses old 011-XXX-YYYY', () => {
    expect(parsePhone('011-123-4567')).toEqual({ phone1: '011', phone2: '123', phone3: '4567' })
  })

  it('rejects unsupported prefix', () => {
    expect(() => parsePhone('012-1234-5678')).toThrow()
  })

  it('rejects invalid length', () => {
    expect(() => parsePhone('010-12-34')).toThrow()
  })
})

describe('formatPhone', () => {
  it('joins to dashed format', () => {
    expect(formatPhone({ phone1: '010', phone2: '1234', phone3: '5678' })).toBe('010-1234-5678')
  })
})

describe('parseEmail', () => {
  it('uses select option for known domain', () => {
    expect(parseEmail('user@gmail.com')).toEqual({ email1: 'user', email2: 'gmail.com', email3: '' })
    expect(parseEmail('me@naver.com')).toEqual({ email1: 'me', email2: 'naver.com', email3: '' })
  })

  it('uses 직접입력 for custom domain', () => {
    expect(parseEmail('user@customdomain.io')).toEqual({
      email1: 'user',
      email2: '직접입력',
      email3: 'customdomain.io',
    })
  })

  it('rejects malformed email', () => {
    expect(() => parseEmail('userdomain.com')).toThrow()
    expect(() => parseEmail('@domain.com')).toThrow()
    expect(() => parseEmail('user@')).toThrow()
  })
})

describe('assertDurationInRange', () => {
  it('accepts 120-180', () => {
    expect(() => assertDurationInRange(120)).not.toThrow()
    expect(() => assertDurationInRange(150)).not.toThrow()
    expect(() => assertDurationInRange(180)).not.toThrow()
  })

  it('rejects out-of-range', () => {
    expect(() => assertDurationInRange(60)).toThrow()
    expect(() => assertDurationInRange(210)).toThrow()
  })
})
