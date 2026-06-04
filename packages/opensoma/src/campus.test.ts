import { describe, expect, it } from 'bun:test'

import { DEFAULT_SOMA_CAMPUS, getSomaBaseUrl, parseSomaCampus, stripSomaBasePath } from './campus'

describe('Soma campus utilities', () => {
  it('defaults to Seoul and resolves Busan aliases', () => {
    expect(DEFAULT_SOMA_CAMPUS).toBe('seoul')
    expect(parseSomaCampus(undefined)).toBe('seoul')
    expect(parseSomaCampus('서울')).toBe('seoul')
    expect(parseSomaCampus('B')).toBe('busan')
    expect(parseSomaCampus('부산')).toBe('busan')
    expect(getSomaBaseUrl('busan')).toBe('https://www.swmaestro.ai/busan/sw')
  })

  it('rejects unknown campus values instead of silently falling back', () => {
    expect(() => parseSomaCampus('daejeon')).toThrow('Invalid SWMaestro campus')
  })

  it('strips native Seoul and Busan prefixes from forwarding form actions', () => {
    expect(stripSomaBasePath('/sw/login.do')).toBe('/login.do')
    expect(stripSomaBasePath('/busan/sw/login.do')).toBe('/login.do')
    expect(stripSomaBasePath('/mypage/mentoLec/list.do')).toBe('/mypage/mentoLec/list.do')
  })
})
