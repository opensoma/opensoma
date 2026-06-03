import type { TeamListItem } from '@/lib/sdk'

export interface RegularReportDefaults {
  readonly teamNames: string
  readonly attendanceNames: string
  readonly attendanceCount: string
}

type TeamForRegularReport = Pick<TeamListItem, 'name' | 'members'>

export const EMPTY_REGULAR_REPORT_DEFAULTS = {
  teamNames: '',
  attendanceNames: '',
  attendanceCount: '',
} as const satisfies RegularReportDefaults

export function buildRegularReportDefaults(teams: readonly TeamForRegularReport[]): RegularReportDefaults {
  if (teams.length !== 1) return EMPTY_REGULAR_REPORT_DEFAULTS

  const team = teams[0]
  if (!team) return EMPTY_REGULAR_REPORT_DEFAULTS

  const attendanceNames = team.members.map((member) => member.name.trim()).filter((name) => name.length > 0)

  return {
    teamNames: team.name.trim(),
    attendanceNames: attendanceNames.join(', '),
    attendanceCount: attendanceNames.length > 0 ? String(attendanceNames.length) : '',
  }
}
