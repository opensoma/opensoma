import { UserGb, type UserIdentity } from '../../http'

export function buildTeamActionPayload(teamId: string, user: UserIdentity): Record<string, string> {
  return {
    userNo: user.userNo,
    userNm: user.userNm,
    userGb: user.userGb || UserGb.Mentor,
    teamNo: teamId,
  }
}
