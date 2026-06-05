import { UserGb } from '../../http'

export function dashboardRoleToUserGb(role: string): UserGb {
  const compactRole = role.replace(/\s+/g, '')
  if (compactRole.includes('연수생')) return UserGb.Trainee
  if (compactRole.includes('멘토')) return UserGb.Mentor
  return UserGb.Unknown
}
