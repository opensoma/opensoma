import { requireAuth } from '~/lib/auth'
import { Badge } from '~/ui/badge'
import { Card, CardContent, CardHeader } from '~/ui/card'

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
          <Card key={`${team.name}-${team.joinStatus}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">{team.name}</h2>
                  <p className="text-sm text-foreground-muted">팀원 {team.memberCount}명</p>
                </div>
                <Badge variant={team.joinStatus === '참여중' ? 'primary' : 'info'}>{team.joinStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-muted">
                참여 상태에 따라 팀 상세 화면에서 다음 작업을 진행할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
