import { describe, expect, it } from 'bun:test'

import { resolveTozIdentity, resolveTozPin } from './toz'

describe('resolveTozIdentity', () => {
  it('uses flag values before stored identity', async () => {
    const identity = await resolveTozIdentity('Mentor One', '010-1111-2222', {
      promptPhone: async () => '010-3333-4444',
      store: {
        getTozIdentity: async () => ({ name: 'Mentor Two', phone: '010-5555-6666' }),
      },
    })

    expect(identity).toEqual({ name: 'Mentor One', phone: '010-1111-2222' })
  })

  it('prompts for phone when name is available but phone is missing', async () => {
    const identity = await resolveTozIdentity('Mentor One', undefined, {
      promptPhone: async () => '010-3333-4444',
      store: {
        getTozIdentity: async () => null,
      },
    })

    expect(identity).toEqual({ name: 'Mentor One', phone: '010-3333-4444' })
  })

  it('keeps non-interactive callers failing when phone is missing', async () => {
    await expect(
      resolveTozIdentity('Mentor One', undefined, {
        store: {
          getTozIdentity: async () => null,
        },
      }),
    ).rejects.toThrow(/Toz identity not set/)
  })
})

describe('resolveTozPin', () => {
  it('uses the flag value before prompting', async () => {
    const pin = await resolveTozPin('123456', async () => '654321')

    expect(pin).toBe('123456')
  })

  it('prompts when the flag value is missing', async () => {
    const pin = await resolveTozPin(undefined, async () => '654321')

    expect(pin).toBe('654321')
  })
})
