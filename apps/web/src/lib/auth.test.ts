import { describe, expect, it, mock } from 'bun:test'

class RedirectSignal extends Error {
  constructor(public readonly target: string) {
    super(`NEXT_REDIRECT:${target}`)
  }
}

mock.module('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))

const { AuthenticationError } = await import('@/lib/sdk')
const { wrapWithAuthRedirect } = await import('./auth')

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    mentoring: {
      list: async () => ({ items: [] }),
      get: async () => {
        throw new AuthenticationError('expired')
      },
      failRandomly: async () => {
        throw new Error('disk is on fire')
      },
    },
    getSessionData: () => ({ sessionCookie: 'sid', csrfToken: 'csrf' }),
    whoami: async () => ({ userId: 'u', userNm: 'n' }),
    ...overrides,
  } as unknown as Parameters<typeof wrapWithAuthRedirect>[0]
}

describe('wrapWithAuthRedirect', () => {
  it('passes through successful namespace calls', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    await expect(wrapped.mentoring.list()).resolves.toEqual({ items: [] })
  })

  it('redirects to /logout when a namespace call throws AuthenticationError', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    const thrown = await wrapped.mentoring.get(1).catch((e: unknown) => e)
    expect(thrown).toBeInstanceOf(RedirectSignal)
    expect((thrown as RedirectSignal).target).toBe('/logout')
  })

  it('rethrows non-AuthenticationError errors from namespace calls untouched', async () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    await expect(
      (wrapped.mentoring as unknown as { failRandomly: () => Promise<unknown> }).failRandomly(),
    ).rejects.toThrow('disk is on fire')
  })

  it('preserves synchronous top-level getters (no accidental async wrapping)', () => {
    const wrapped = wrapWithAuthRedirect(makeClient())
    const data = wrapped.getSessionData()
    expect(data).toEqual({ sessionCookie: 'sid', csrfToken: 'csrf' })
  })

  it('does not wrap top-level async methods (they bubble up unchanged)', async () => {
    const wrapped = wrapWithAuthRedirect(
      makeClient({
        whoami: async () => {
          throw new AuthenticationError('expired')
        },
      }),
    )
    await expect(wrapped.whoami()).rejects.toBeInstanceOf(AuthenticationError)
  })
})
