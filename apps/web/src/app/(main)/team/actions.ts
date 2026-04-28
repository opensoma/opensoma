'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/client'
import { AuthenticationError } from '@/lib/sdk'

interface TeamActionResult {
  error: string
  success: string
}

export async function joinTeam(teamId: string): Promise<TeamActionResult> {
  return runTeamAction(teamId, async (client) => client.team.join(teamId), '팀에 참여했습니다.')
}

export async function leaveTeam(teamId: string): Promise<TeamActionResult> {
  return runTeamAction(teamId, async (client) => client.team.leave(teamId), '팀에서 나왔습니다.')
}

type ClientLike = Awaited<ReturnType<typeof createClient>>

async function runTeamAction(
  teamId: string,
  action: (client: ClientLike) => Promise<void>,
  successMessage: string,
): Promise<TeamActionResult> {
  if (!teamId) {
    return { error: '팀 정보를 확인할 수 없습니다.', success: '' }
  }

  try {
    const client = await createClient()
    await action(client)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/logout')
    }
    return {
      error: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
      success: '',
    }
  }

  revalidatePath('/team')
  return { error: '', success: successMessage }
}
