import { redirect } from 'next/navigation'
import { cache } from 'react'

import { createClient } from '@/lib/client'
import { AuthenticationError, type SomaClient, type UserIdentity } from '@/lib/sdk'

export const requireAuth = cache(async (): Promise<SomaClient> => {
  try {
    const client = await createClient()
    return wrapWithAuthRedirect(client)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/login')
    }
    throw error
  }
})

export const getCurrentUser = cache(async (): Promise<UserIdentity | null> => {
  try {
    const client = await createClient()
    return await client.whoami()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return null
    }
    throw error
  }
})

// Wraps nested namespace methods (client.mentoring.list, client.dashboard.get,
// etc.) so an AuthenticationError thrown when the upstream session dies
// mid-request redirects to /logout instead of bubbling to a 500. Top-level
// members (getSessionData, whoami, ...) pass through untouched to preserve
// sync semantics. Only AuthenticationError is intercepted; every other error
// -- including Next.js redirect/notFound signals -- is rethrown unchanged.
export function wrapWithAuthRedirect(client: SomaClient): SomaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'object' || value === null) return value
      return wrapNamespace(value as Record<string, unknown>)
    },
  })
}

function wrapNamespace(namespace: Record<string, unknown>): Record<string, unknown> {
  return new Proxy(namespace, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      const method = value as (...a: unknown[]) => Promise<unknown>
      return async (...args: unknown[]) => {
        try {
          return await method.apply(target, args)
        } catch (error) {
          if (error instanceof AuthenticationError) {
            redirect('/logout')
          }
          throw error
        }
      }
    },
  })
}
