import { UsersThree } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import { parseTeamSearchQuery } from 'opensoma/shared/utils/team-params'

import { TeamFilters } from '@/app/(main)/team/components/team-filters'
import { TeamJoinButton } from '@/app/(main)/team/components/team-join-button'
import { requireAuth } from '@/lib/auth'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'

export const metadata: Metadata = {
  title: '팀매칭',
}

const JOIN_STATUS_TO_ACTION: Record<string, 'join' | 'leave' | 'completed'> = {
  참여: 'join',
  탈퇴: 'leave',
  완료: 'completed',
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const searchRaw = getFirstValue(resolvedSearchParams.search) ?? null
  const search = searchRaw ? parseTeamSearchQuery(searchRaw) : undefined

  const client = await requireAuth()
  const teamInfo = await client.team.list({ search })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">팀매칭</h1>
        <p className="text-sm text-foreground-muted">
          현재 참여중인 팀은 {teamInfo.currentTeams} / {teamInfo.maxTeams}팀입니다.
        </p>
      </div>

      <TeamFilters initialSearch={searchRaw} />

      {teamInfo.teams.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={UsersThree} message="조건에 맞는 팀이 없습니다." />
          </CardContent>
        </Card>
      ) : (
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
                  {team.joinStatus && JOIN_STATUS_TO_ACTION[team.joinStatus] ? (
                    <TeamJoinButton teamId={team.teamId} status={JOIN_STATUS_TO_ACTION[team.joinStatus]} />
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
      )}
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

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
