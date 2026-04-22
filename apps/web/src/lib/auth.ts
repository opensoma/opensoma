import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { createClient } from '@/lib/client'
import { AuthenticationError, type SomaClient, type UserIdentity } from '@/lib/sdk'
import { clearSessionTokens, readStoredCredentials, writeSessionTokensIfWritable } from '@/lib/session'

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
// etc.) so that (1) the SDK's fresh session cookies get persisted back to the
// browser whenever the single-flight re-login refreshes them, and (2) an
// AuthenticationError thrown mid-request triggers one manual recovery attempt
// using stored credentials before falling back to /logout. Top-level members
// (getSessionData, whoami, ...) pass through untouched to preserve sync
// semantics. Only AuthenticationError is intercepted; every other error --
// including Next.js redirect/notFound signals -- is rethrown unchanged.
export function wrapWithAuthRedirect(client: SomaClient): SomaClient {
  const initialTokens = client.getSessionData()
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'object' || value === null) return value
      return wrapNamespace(client, initialTokens, value as Record<string, unknown>)
    },
  })
}

function wrapNamespace(
  client: SomaClient,
  initialTokens: ReturnType<SomaClient['getSessionData']>,
  namespace: Record<string, unknown>,
): Record<string, unknown> {
  return new Proxy(namespace, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      const method = value as (...a: unknown[]) => Promise<unknown>
      return async (...args: unknown[]) => {
        try {
          const result = await method.apply(target, args)
          await persistRefreshedTokens(client, initialTokens)
          return result
        } catch (error) {
          if (error instanceof AuthenticationError) {
            await recoverOrLogout(client)
          }
          throw error
        }
      }
    },
  })
}

async function persistRefreshedTokens(
  client: SomaClient,
  initialTokens: ReturnType<SomaClient['getSessionData']>,
): Promise<void> {
  const current = client.getSessionData()
  if (!current.sessionCookie || !current.csrfToken) return
  if (current.sessionCookie === initialTokens.sessionCookie && current.csrfToken === initialTokens.csrfToken) {
    return
  }
  await writeSessionTokensIfWritable({
    sessionCookie: current.sessionCookie,
    csrfToken: current.csrfToken,
  })
}

async function recoverOrLogout(client: SomaClient): Promise<never> {
  const credentials = await readStoredCredentials()
  if (!credentials) {
    redirect('/logout')
  }

  try {
    await client.login(credentials.username, credentials.password)
  } catch {
    await clearSessionTokens()
    redirect('/login?error=auth-recovery-failed')
  }

  const refreshed = client.getSessionData()
  if (!refreshed.sessionCookie || !refreshed.csrfToken) {
    await clearSessionTokens()
    redirect('/login?error=auth-recovery-failed')
  }
  await writeSessionTokensIfWritable({
    sessionCookie: refreshed.sessionCookie,
    csrfToken: refreshed.csrfToken,
  })

  redirect(await recoveryRedirectTarget())
}

async function recoveryRedirectTarget(): Promise<string> {
  try {
    const h = await headers()
    const referer = h.get('referer')
    const host = h.get('host')
    if (!referer || !host) return '/dashboard'
    const url = new URL(referer)
    if (url.host !== host) return '/dashboard'
    // Collapse leading slashes so `redirect()` cannot be coerced into a
    // protocol-relative URL (e.g. `//attacker.com/...`).
    const path = url.pathname.replace(/^\/+/, '/')
    if (path === '/logout' || path === '/login' || path === '/') return '/dashboard'
    return `${path}${url.search}`
  } catch {
    return '/dashboard'
  }
}
