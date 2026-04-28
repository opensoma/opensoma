'use client'

import { useTransition } from 'react'

import { joinTeam, leaveTeam } from '@/app/(main)/team/actions'
import { Button } from '@/ui/button'

type Status = 'join' | 'leave' | 'completed'

interface TeamJoinButtonProps {
  teamId: string
  status: Status
}

const COPY: Record<Status, { label: string; confirm: string; variant: 'primary' | 'secondary' | 'ghost' }> = {
  join: { label: '참여', confirm: '방에 입장하시겠습니까?', variant: 'primary' },
  leave: { label: '탈퇴', confirm: '팀에서 나가시겠습니까?', variant: 'secondary' },
  completed: { label: '완료', confirm: '', variant: 'ghost' },
}

export function TeamJoinButton({ teamId, status }: TeamJoinButtonProps) {
  const [pending, startTransition] = useTransition()
  const copy = COPY[status]

  if (status === 'completed') {
    return (
      <Button type="button" size="sm" variant="ghost" disabled>
        {copy.label}
      </Button>
    )
  }

  const onClick = () => {
    if (!teamId) return
    if (!window.confirm(copy.confirm)) return

    startTransition(async () => {
      const action = status === 'join' ? joinTeam : leaveTeam
      const result = await action(teamId)
      if (result.error) {
        window.alert(result.error)
      }
    })
  }

  return (
    <Button type="button" size="sm" variant={copy.variant} onClick={onClick} disabled={pending || !teamId}>
      {copy.label}
    </Button>
  )
}
