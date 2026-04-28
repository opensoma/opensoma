import { describe, expect, it } from 'bun:test'

import { buildTeamActionPayload } from './team-action-params'

describe('buildTeamActionPayload', () => {
  it('builds the native payload from teamId and user identity', () => {
    expect(
      buildTeamActionPayload('60e6785c8c404142b12cf9ed2a3d811f', {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userGb: 'T',
      }),
    ).toEqual({
      userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
      userNm: '전수열',
      userGb: 'T',
      teamNo: '60e6785c8c404142b12cf9ed2a3d811f',
    })
  })

  it('falls back to userGb="T" when the identity has no userGb', () => {
    const payload = buildTeamActionPayload('team-1', {
      userId: 'neo@example.com',
      userNm: '전수열',
      userNo: 'abc',
      userGb: '',
    })
    expect(payload.userGb).toBe('T')
  })
})
