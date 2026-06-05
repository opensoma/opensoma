import { describe, expect, it } from 'bun:test'

import { UserGb } from '../../http'
import { dashboardRoleToUserGb } from './user-gb'

describe('dashboardRoleToUserGb', () => {
  it('maps native dashboard role labels to userGb values', () => {
    expect(dashboardRoleToUserGb('멘토')).toBe(UserGb.Mentor)
    expect(dashboardRoleToUserGb('17기 연수생')).toBe(UserGb.Trainee)
    expect(dashboardRoleToUserGb('')).toBe(UserGb.Unknown)
  })
})
