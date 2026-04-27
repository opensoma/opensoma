import { describe, expect, it } from 'bun:test'

import { MENU_NO } from '../../constants'
import { buildTeamListParams, parseTeamSearchQuery } from './team-params'

describe('parseTeamSearchQuery', () => {
  it('defaults plain text to an all-fields search', () => {
    expect(parseTeamSearchQuery('전수열')).toEqual({ field: 'all', value: '전수열' })
  })

  it('parses the "team:" prefix as a team-name search', () => {
    expect(parseTeamSearchQuery('team:오픈소마')).toEqual({ field: 'team', value: '오픈소마' })
  })

  it('parses the "member:" prefix as a member-name search', () => {
    expect(parseTeamSearchQuery('member:김철수')).toEqual({ field: 'member', value: '김철수' })
  })

  it('parses the "mentor:" prefix as a mentor-name search', () => {
    expect(parseTeamSearchQuery('mentor:전수열')).toEqual({ field: 'mentor', value: '전수열' })
  })

  it('parses the "project:" prefix as a project-name search', () => {
    expect(parseTeamSearchQuery('project:Previzion')).toEqual({ field: 'project', value: 'Previzion' })
  })

  it('parses the "all:" prefix as an all-fields search', () => {
    expect(parseTeamSearchQuery('all:전수열')).toEqual({ field: 'all', value: '전수열' })
  })

  it('sets the "me" flag when parsing "mentor:@me"', () => {
    expect(parseTeamSearchQuery('mentor:@me')).toEqual({ field: 'mentor', value: '@me', me: true })
  })

  it('sets the "me" flag when parsing "member:@me"', () => {
    expect(parseTeamSearchQuery('member:@me')).toEqual({ field: 'member', value: '@me', me: true })
  })

  it('does not set the "me" flag for "team:@me" or "project:@me"', () => {
    expect(parseTeamSearchQuery('team:@me')).toEqual({ field: 'team', value: '@me' })
    expect(parseTeamSearchQuery('project:@me')).toEqual({ field: 'project', value: '@me' })
  })

  it('treats an unknown prefix as a plain all-fields search', () => {
    expect(parseTeamSearchQuery('foo:bar')).toEqual({ field: 'all', value: 'foo:bar' })
  })

  it('preserves everything after the first colon when the value contains colons', () => {
    expect(parseTeamSearchQuery('team:foo:bar')).toEqual({ field: 'team', value: 'foo:bar' })
  })
})

describe('buildTeamListParams', () => {
  it('returns only menuNo when no options are passed', () => {
    expect(buildTeamListParams()).toEqual({ menuNo: MENU_NO.TEAM })
  })

  it('omits search params when search is not provided', () => {
    expect(buildTeamListParams({})).toEqual({ menuNo: MENU_NO.TEAM })
  })

  it('sets searchCnd="" for an all-fields search', () => {
    expect(buildTeamListParams({ search: { field: 'all', value: '전수열' } })).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '',
      searchWrd: '전수열',
    })
  })

  it('sets searchCnd=1 for a member-name search', () => {
    expect(buildTeamListParams({ search: { field: 'member', value: '김철수' } })).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '1',
      searchWrd: '김철수',
    })
  })

  it('sets searchCnd=2 for a mentor-name search', () => {
    expect(buildTeamListParams({ search: { field: 'mentor', value: '전수열' } })).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '2',
      searchWrd: '전수열',
    })
  })

  it('sets searchCnd=3 for a project-name search', () => {
    expect(buildTeamListParams({ search: { field: 'project', value: 'Previzion' } })).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '3',
      searchWrd: 'Previzion',
    })
  })

  it('sets searchCnd=4 for a team-name search', () => {
    expect(buildTeamListParams({ search: { field: 'team', value: '오픈소마' } })).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '4',
      searchWrd: '오픈소마',
    })
  })

  it('substitutes the current user name when "mentor:@me" is used', () => {
    expect(
      buildTeamListParams({
        search: { field: 'mentor', value: '@me', me: true },
        user: { userId: 'neo@example.com', userNm: '전수열' },
      }),
    ).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '2',
      searchWrd: '전수열',
    })
  })

  it('substitutes the current user name when "member:@me" is used', () => {
    expect(
      buildTeamListParams({
        search: { field: 'member', value: '@me', me: true },
        user: { userId: 'neo@example.com', userNm: '강동우' },
      }),
    ).toEqual({
      menuNo: MENU_NO.TEAM,
      searchCnd: '1',
      searchWrd: '강동우',
    })
  })

  it('does not emit a searchId param (the native team page does not accept it)', () => {
    const params = buildTeamListParams({
      search: { field: 'mentor', value: '@me', me: true },
      user: { userId: 'neo@example.com', userNm: '전수열' },
    })
    expect(params).not.toHaveProperty('searchId')
  })

  it('omits search params when "@me" is requested but the user identity is unavailable', () => {
    expect(buildTeamListParams({ search: { field: 'mentor', value: '@me', me: true } })).toEqual({
      menuNo: MENU_NO.TEAM,
    })
  })
})
