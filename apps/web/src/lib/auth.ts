import { redirect } from 'next/navigation'

import { authDebug } from '@/lib/auth-debug'
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
                authDebug.emit('guard_caught_auth_error', {
                  ns: String(prop),
                  method: String(nsProp),
                })

                let recoveredMethod: ((...args: unknown[]) => Promise<unknown>) | null = null
                try {
                  recoveredMethod = await recoverClientMethod(prop, nsProp)
                } catch (recoveryError) {
                  authDebug.emit('guard_recovery_threw', {
                    ns: String(prop),
                    method: String(nsProp),
                    err:
                      recoveryError instanceof Error
                        ? recoveryError.message.slice(0, 120)
                        : String(recoveryError).slice(0, 120),
                  })
                  redirectOnAuthenticationError(recoveryError, `guard:${String(prop)}.${String(nsProp)}`)
                  throw recoveryError
                }

                if (recoveredMethod) {
                  try {
                    const result = await recoveredMethod(...args)
                    authDebug.emit('guard_retry_success', {
                      ns: String(prop),
                      method: String(nsProp),
                    })
                    return result
                  } catch (retryError) {
                    authDebug.emit('guard_retry_threw', {
                      ns: String(prop),
                      method: String(nsProp),
                      err:
                        retryError instanceof Error
                          ? retryError.message.slice(0, 120)
                          : String(retryError).slice(0, 120),
                    })
                    redirectOnAuthenticationError(retryError, `guard:${String(prop)}.${String(nsProp)}`)
                    throw retryError
                  }
                }

                authDebug.emit('guard_no_recovered_method', {
                  ns: String(prop),
                  method: String(nsProp),
                })
                authDebug.emit('logout_redirect', { from: `guard:${String(prop)}.${String(nsProp)}` })
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
  const startedAt = Date.now()
  authDebug.emit('require_auth_enter')
  try {
    const client = await createClientWithRecovery()
    authDebug.emit('require_auth_success', { ms: Date.now() - startedAt })
    return wrapWithAuthGuard(client)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      authDebug.emit('require_auth_failed', {
        ms: Date.now() - startedAt,
        err: error.message.slice(0, 120),
      })
      authDebug.emit('logout_redirect', { from: 'requireAuth' })
      redirect('/logout')
    }
    throw error
  }
}

function redirectOnAuthenticationError(error: unknown, from: string): void {
  if (error instanceof AuthenticationError) {
    authDebug.emit('logout_redirect', { from })
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

    authDebug.emit('create_client_retry_after_auth_error')
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
