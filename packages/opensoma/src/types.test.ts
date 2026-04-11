import { describe, expect, test } from 'bun:test'

import {
  ApplicationHistoryItemSchema,
  CredentialsSchema,
  DashboardSchema,
  EventListItemSchema,
  MemberInfoSchema,
  MentoringDetailSchema,
  MentoringListItemSchema,
  NoticeDetailSchema,
  NoticeListItemSchema,
  PaginationSchema,
  RoomCardSchema,
  TeamInfoSchema,
} from './types'

describe('schemas', () => {
  test('accept valid values', () => {
    expect(
      MentoringListItemSchema.parse({
        id: 9572,
        title: 'AI 멘토링',
        type: '자유 멘토링',
        registrationPeriod: { start: '2026-04-01', end: '2026-04-10' },
        sessionDate: '2026-04-11',
        sessionTime: { start: '14:00', end: '15:30' },
        attendees: { current: 3, max: 4 },
        approved: true,
        status: '접수중',
        author: '전수열',
        createdAt: '2026-04-01',
      }),
    ).toBeDefined()

    expect(
      MentoringDetailSchema.parse({
        id: 9572,
        title: 'AI 멘토링',
        type: '멘토 특강',
        registrationPeriod: { start: '2026-04-01', end: '2026-04-10' },
        sessionDate: '2026-04-11',
        sessionTime: { start: '14:00', end: '15:30' },
        attendees: { current: 6, max: 20 },
        approved: false,
        status: '마감',
        author: '전수열',
        createdAt: '2026-04-01',
        content: '<p>내용</p>',
        venue: '온라인(Webex)',
      }),
    ).toBeDefined()

    expect(
      RoomCardSchema.parse({
        itemId: 17,
        name: '스페이스 A1',
        capacity: 4,
        availablePeriod: { start: '2026-04-01', end: '2026-12-31' },
        description: '소회의실 : 4인',
        timeSlots: [{ time: '09:00', available: true }],
      }),
    ).toBeDefined()

    expect(
      DashboardSchema.parse({
        name: '전수열',
        role: '멘토',
        organization: 'Indent',
        position: '',
        team: { name: '오픈소마', members: '전수열, 김개발', mentor: '전수열' },
        mentoringSessions: [{ title: 'AI 멘토링', url: '/mentoring/1', status: '접수중' }],
        roomReservations: [{ title: 'A1 회의', url: '/room/1', status: '예약완료' }],
      }),
    ).toBeDefined()

    expect(
      NoticeListItemSchema.parse({
        id: 1,
        title: '공지',
        author: '관리자',
        createdAt: '2026-04-01',
      }),
    ).toBeDefined()

    expect(
      NoticeDetailSchema.parse({
        id: 1,
        title: '공지',
        author: '관리자',
        createdAt: '2026-04-01',
        content: '<p>내용</p>',
      }),
    ).toBeDefined()

    expect(
      TeamInfoSchema.parse({
        teams: [
          { name: '오픈소마', memberCount: 3, joinStatus: '참여중' },
          { name: '김앤강', memberCount: 5, joinStatus: '참여하기' },
        ],
        currentTeams: 1,
        maxTeams: 100,
      }),
    ).toBeDefined()

    expect(
      MemberInfoSchema.parse({
        email: 'neo@example.com',
        name: '전수열',
        gender: '남자',
        birthDate: '1995-01-14',
        phone: '01012345678',
        organization: 'Indent',
        position: '',
      }),
    ).toBeDefined()

    expect(
      EventListItemSchema.parse({
        id: 11,
        category: '행사',
        title: '데모데이',
        registrationPeriod: { start: '2026-04-01', end: '2026-04-05' },
        eventPeriod: { start: '2026-04-10', end: '2026-04-10' },
        status: '접수중',
        createdAt: '2026-03-30',
      }),
    ).toBeDefined()

    expect(
      ApplicationHistoryItemSchema.parse({
        id: 99,
        category: '멘토 특강',
        title: 'AI 멘토링',
        author: '전수열',
        sessionDate: '2026-04-11',
        appliedAt: '2026-04-02 09:00',
        applicationStatus: '신청완료',
        approvalStatus: 'OK',
        applicationDetail: '승인대기',
        note: '-',
      }),
    ).toBeDefined()

    expect(PaginationSchema.parse({ total: 23, currentPage: 2, totalPages: 3 })).toBeDefined()

    expect(
      CredentialsSchema.parse({
        sessionCookie: 'session-token',
        csrfToken: 'csrf-token',
        username: 'neo@example.com',
        loggedInAt: '2026-04-09T00:00:00.000Z',
      }),
    ).toBeDefined()
  })

  test('reject invalid values', () => {
    expect(() => MentoringListItemSchema.parse({})).toThrow()
    expect(() => MentoringDetailSchema.parse({ content: 123 })).toThrow()
    expect(() => RoomCardSchema.parse({ itemId: '17' })).toThrow()
    expect(() => DashboardSchema.parse({ name: '전수열' })).toThrow()
    expect(() => NoticeListItemSchema.parse({ id: 1, title: '공지' })).toThrow()
    expect(() =>
      NoticeDetailSchema.parse({ id: 1, title: '공지', author: '관리자', createdAt: '2026-04-01' }),
    ).toThrow()
    expect(() => TeamInfoSchema.parse({ teams: [{ name: '김개발' }], currentTeams: 1, maxTeams: 100 })).toThrow()
    expect(() => MemberInfoSchema.parse({ email: 1, name: '전수열' })).toThrow()
    expect(() => EventListItemSchema.parse({ id: 1, title: '행사', status: '접수중' })).toThrow()
    expect(() => ApplicationHistoryItemSchema.parse({ id: 1, status: '신청완료' })).toThrow()
    expect(() => PaginationSchema.parse({ total: '23', currentPage: 2, totalPages: 3 })).toThrow()
    expect(() => CredentialsSchema.parse({ sessionCookie: 'cookie' })).toThrow()
  })
})
