import { describe, expect, it } from 'bun:test'

import { buildRegularReportDefaults } from './regular-report-defaults'

describe('buildRegularReportDefaults', () => {
  it('prefills team and trainee names when exactly one assigned team is known', () => {
    expect(
      buildRegularReportDefaults([
        {
          name: 'Team Alpha',
          members: [
            { name: 'Trainee One', userId: 'trainee-1' },
            { name: 'Trainee Two', userId: 'trainee-2' },
          ],
        },
      ]),
    ).toEqual({
      teamNames: 'Team Alpha',
      attendanceNames: 'Trainee One, Trainee Two',
      attendanceCount: '2',
    })
  })

  it('does not prefill fields when multiple assigned teams are possible', () => {
    expect(
      buildRegularReportDefaults([
        { name: 'Team Alpha', members: [{ name: 'Trainee One', userId: 'trainee-1' }] },
        { name: 'Team Beta', members: [{ name: 'Trainee Two', userId: 'trainee-2' }] },
      ]),
    ).toEqual({
      teamNames: '',
      attendanceNames: '',
      attendanceCount: '',
    })
  })

  it('does not prefill attendance count when the matched team has no trainee names', () => {
    expect(buildRegularReportDefaults([{ name: 'Team Alpha', members: [] }])).toEqual({
      teamNames: 'Team Alpha',
      attendanceNames: '',
      attendanceCount: '',
    })
  })
})
