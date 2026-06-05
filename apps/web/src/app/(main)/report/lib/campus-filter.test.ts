import { describe, expect, it } from 'bun:test'

import { resolveCampusSelection, selectionToCampus } from './campus-filter'

describe('resolveCampusSelection', () => {
  it('keeps explicit seoul/busan/all selections', () => {
    expect(resolveCampusSelection('seoul', 'busan')).toBe('seoul')
    expect(resolveCampusSelection('busan', 'seoul')).toBe('busan')
    expect(resolveCampusSelection('all', 'seoul')).toBe('all')
  })

  it('falls back to the active campus when the param is missing', () => {
    expect(resolveCampusSelection(undefined, 'busan')).toBe('busan')
  })

  it('falls back to the active campus for invalid params', () => {
    expect(resolveCampusSelection('jeju', 'seoul')).toBe('seoul')
    expect(resolveCampusSelection('', 'busan')).toBe('busan')
    expect(resolveCampusSelection('SEOUL', 'busan')).toBe('busan')
  })
})

describe('selectionToCampus', () => {
  it('maps all to undefined so the SDK skips campus filtering', () => {
    expect(selectionToCampus('all')).toBeUndefined()
  })

  it('passes seoul/busan through unchanged', () => {
    expect(selectionToCampus('seoul')).toBe('seoul')
    expect(selectionToCampus('busan')).toBe('busan')
  })
})
