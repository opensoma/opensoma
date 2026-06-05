import { afterEach, describe, expect, it } from 'bun:test'

import { getCampusOverride, setCampusOverride } from './campus-context'

afterEach(() => {
  setCampusOverride(undefined)
})

describe('campus-context', () => {
  it('round-trips the override campus', () => {
    expect(getCampusOverride()).toBeUndefined()
    setCampusOverride('busan')
    expect(getCampusOverride()).toBe('busan')
  })

  it('clears the override when set to undefined', () => {
    setCampusOverride('seoul')
    setCampusOverride(undefined)
    expect(getCampusOverride()).toBeUndefined()
  })
})
