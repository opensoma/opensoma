import { redirect } from 'next/navigation'
import { cache } from 'react'

import { createClient } from '@/lib/client'
import { AuthenticationError, type SomaClient, type UserIdentity } from '@/lib/sdk'

export const requireAuth = cache(async (): Promise<SomaClient> => {
  try {
    return await createClient()
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
