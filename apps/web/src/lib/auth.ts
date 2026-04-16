import { redirect } from 'next/navigation'

import { createClient } from '@/lib/client'
import { AuthenticationError, type SomaClient } from '@/lib/sdk'

function wrapWithAuthGuard(client: SomaClient): SomaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'object' || value === null) return value

      return new Proxy(value as Record<string, unknown>, {
        get(nsTarget, nsProp, nsReceiver) {
          const method = Reflect.get(nsTarget, nsProp, nsReceiver)
          if (typeof method !== 'function') return method

          return async (...args: unknown[]) => {
            try {
              return await (method as (...a: unknown[]) => Promise<unknown>).apply(nsTarget, args)
            } catch (error) {
              if (error instanceof AuthenticationError) {
                let recoveredMethod: ((...args: unknown[]) => Promise<unknown>) | null = null
                try {
                  recoveredMethod = await recoverClientMethod(prop, nsProp)
                } catch (recoveryError) {
                  redirectOnAuthenticationError(recoveryError)
                  throw recoveryError
                }

                if (recoveredMethod) {
                  try {
                    return await recoveredMethod(...args)
                  } catch (retryError) {
                    redirectOnAuthenticationError(retryError)
                    throw retryError
                  }
                }

                redirect('/logout')
              }
              throw error
            }
          }
        },
      })
    },
  })
}

export async function requireAuth(): Promise<SomaClient> {
  try {
    const client = await createClientWithRecovery()
    return wrapWithAuthGuard(client)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    throw error
  }
}

function redirectOnAuthenticationError(error: unknown): void {
  if (error instanceof AuthenticationError) {
    redirect('/logout')
  }
}

async function createClientWithRecovery(): Promise<SomaClient> {
  try {
    return await createClient()
  } catch (error) {
    if (!(error instanceof AuthenticationError)) {
      throw error
    }

    return createClient()
  }
}

async function recoverClientMethod(
  prop: string | symbol,
  nsProp: string | symbol,
): Promise<((...args: unknown[]) => Promise<unknown>) | null> {
  const recoveredClient = await createClientWithRecovery()
  const recoveredNamespace = Reflect.get(recoveredClient, prop)
  if (typeof recoveredNamespace !== 'object' || recoveredNamespace === null) {
    return null
  }

  const recoveredMethod = Reflect.get(recoveredNamespace as Record<string, unknown>, nsProp)
  if (typeof recoveredMethod !== 'function') {
    return null
  }

  return (...args: unknown[]) =>
    (recoveredMethod as (...a: unknown[]) => Promise<unknown>).apply(recoveredNamespace, args)
}
