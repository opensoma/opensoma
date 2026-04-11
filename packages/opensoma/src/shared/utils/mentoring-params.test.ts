import { describe, expect, test } from 'bun:test'

import { MENU_NO, REPORT_CD } from '../../constants'
import { buildMentoringListParams, parseSearchQuery } from './mentoring-params'

describe('parseSearchQuery', () => {
  test('plain text defaults to title', () => {
    expect(parseSearchQuery('OpenCode')).toEqual({ field: 'title', value: 'OpenCode' })
  })

  test('title: prefix', () => {
    expect(parseSearchQuery('title:OpenCode')).toEqual({ field: 'title', value: 'OpenCode' })
  })

  test('author: prefix', () => {
    expect(parseSearchQuery('author:전수열')).toEqual({ field: 'author', value: '전수열' })
  })

  test('author:@me sets me flag', () => {
    expect(parseSearchQuery('author:@me')).toEqual({ field: 'author', value: '@me', me: true })
  })

  test('content: prefix', () => {
    expect(parseSearchQuery('content:하네스')).toEqual({ field: 'content', value: '하네스' })
  })

  test('unknown prefix treated as plain title search', () => {
    expect(parseSearchQuery('foo:bar')).toEqual({ field: 'title', value: 'foo:bar' })
  })

  test('value with colons preserves everything after first colon', () => {
    expect(parseSearchQuery('title:foo:bar')).toEqual({ field: 'title', value: 'foo:bar' })
  })
})

describe('buildMentoringListParams', () => {
  test('no options returns only menuNo', () => {
    expect(buildMentoringListParams()).toEqual({ menuNo: MENU_NO.MENTORING })
  })

  test('status maps open to A, closed to C', () => {
    expect(buildMentoringListParams({ status: 'open' })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchStatMentolec: 'A',
    })
    expect(buildMentoringListParams({ status: 'closed' })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchStatMentolec: 'C',
    })
  })

  test('type maps public and lecture to report codes', () => {
    expect(buildMentoringListParams({ type: 'public' })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchGubunMentolec: REPORT_CD.PUBLIC_MENTORING,
    })
    expect(buildMentoringListParams({ type: 'lecture' })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchGubunMentolec: REPORT_CD.MENTOR_LECTURE,
    })
  })

  test('title search sets searchCnd=1', () => {
    expect(buildMentoringListParams({ search: { field: 'title', value: 'OpenCode' } })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchCnd: '1',
      searchWrd: 'OpenCode',
    })
  })

  test('author search sets searchCnd=2', () => {
    expect(buildMentoringListParams({ search: { field: 'author', value: '전수열' } })).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchCnd: '2',
      searchWrd: '전수열',
    })
  })

  test('author:@me with user sets searchId and userNm', () => {
    expect(
      buildMentoringListParams({
        search: { field: 'author', value: '@me', me: true },
        user: { userId: 'neo@example.com', userNm: '전수열' },
      }),
    ).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchCnd: '2',
      searchId: 'neo@example.com',
      searchWrd: '전수열',
    })
  })

  test('search composes with status and type', () => {
    expect(
      buildMentoringListParams({
        status: 'open',
        type: 'lecture',
        search: { field: 'author', value: '@me', me: true },
        user: { userId: 'neo@example.com', userNm: '전수열' },
      }),
    ).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchStatMentolec: 'A',
      searchGubunMentolec: REPORT_CD.MENTOR_LECTURE,
      searchCnd: '2',
      searchId: 'neo@example.com',
      searchWrd: '전수열',
    })
  })

  test('page sets pageIndex', () => {
    expect(buildMentoringListParams({ page: 3 })).toEqual({
      menuNo: MENU_NO.MENTORING,
      pageIndex: '3',
    })
  })
})
