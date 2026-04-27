import type { Metadata } from 'next'

import { requireAuth } from '@/lib/auth'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardHeader } from '@/ui/card'

export const metadata: Metadata = {
  title: '팀매칭',
}

const JOIN_STATUS_BADGE: Record<string, 'primary' | 'success' | 'danger'> = {
  탈퇴: 'danger',
  완료: 'success',
  참여: 'primary',
}

export default async function TeamPage() {
  const client = await requireAuth()
  const teamInfo = await client.team.show()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">팀매칭</h1>
        <p className="text-sm text-foreground-muted">
          현재 참여중인 팀은 {teamInfo.currentTeams} / {teamInfo.maxTeams}팀입니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {teamInfo.teams.map((team) => (
          <Card key={team.teamId || team.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">{team.name}</h2>
                  {team.projectName ? <p className="text-sm text-foreground-muted">{team.projectName}</p> : null}
                  <p className="text-sm text-foreground-muted">팀장 {team.leader || '-'}</p>
                </div>
                {team.joinStatus ? (
                  <Badge variant={JOIN_STATUS_BADGE[team.joinStatus] ?? 'info'}>{team.joinStatus}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TeamMemberLine label="팀원" members={team.members} />
              <TeamMemberLine label="멘토" members={team.mentors} />
              {team.ictCategoryMajor || team.ictCategoryMinor ? (
                <p className="text-sm text-foreground-muted">
                  ICT {[team.ictCategoryMajor, team.ictCategoryMinor].filter(Boolean).join(' / ')}
                </p>
              ) : null}
              <div className="flex gap-2">
                {team.teamCompleted ? <Badge variant="success">팀 구성 완료</Badge> : null}
                {team.mentorCompleted ? <Badge variant="success">멘토 구성 완료</Badge> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TeamMemberLine({ label, members }: { label: string; members: { name: string; userId: string }[] }) {
  if (members.length === 0) return null
  return (
    <p className="text-sm text-foreground-muted">
      {label} {members.map((m) => m.name).join(', ')}
    </p>
  )
}
