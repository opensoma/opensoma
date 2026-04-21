import { describe, expect, it } from 'bun:test'

import {
  ApplicationHistoryItemSchema,
  ApprovalListItemSchema,
  CredentialsSchema,
  DashboardSchema,
  EventListItemSchema,
  MemberInfoSchema,
  MentoringDetailSchema,
  MentoringListItemSchema,
  NoticeDetailSchema,
  NoticeListItemSchema,
  PaginationSchema,
  ReportCreateOptionsSchema,
  ReportDetailSchema,
  ReportListItemSchema,
  RoomCardSchema,
  ScheduleListItemSchema,
  TeamInfoSchema,
} from './types'

describe('schemas', () => {
  it('preserves valid MentoringListItem values through parse', () => {
    const input = {
      id: 9572,
      title: 'AI 멘토링',
      type: '자유 멘토링' as const,
      registrationPeriod: { start: '2026-04-01', end: '2026-04-10' },
      sessionDate: '2026-04-11',
      sessionTime: { start: '14:00', end: '15:30' },
      attendees: { current: 3, max: 4 },
      approved: true,
      status: '접수중' as const,
      author: '전수열',
      createdAt: '2026-04-01',
    }
    expect(MentoringListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid MentoringDetail values through parse', () => {
    const input = {
      id: 9572,
      title: 'AI 멘토링',
      type: '멘토 특강' as const,
      registrationPeriod: { start: '2026-04-01', end: '2026-04-10' },
      sessionDate: '2026-04-11',
      sessionTime: { start: '14:00', end: '15:30' },
      attendees: { current: 6, max: 20 },
      approved: false,
      status: '마감' as const,
      author: '전수열',
      createdAt: '2026-04-01',
      content: '<p>내용</p>',
      venue: '온라인(Webex)',
      applicants: [],
    }
    expect(MentoringDetailSchema.parse(input)).toEqual(input)
  })

  it('preserves valid RoomCard values through parse', () => {
    const input = {
      itemId: 17,
      name: '스페이스 A1',
      capacity: 4,
      availablePeriod: { start: '2026-04-01', end: '2026-12-31' },
      description: '소회의실 : 4인',
      timeSlots: [
        { time: '09:00', available: true },
        { time: '09:30', available: false, reservation: { title: '팀 회의', bookedBy: '전수열' } },
      ],
    }
    expect(RoomCardSchema.parse(input)).toEqual(input)
  })

  it('preserves valid Dashboard values through parse', () => {
    const input = {
      name: '전수열',
      role: '멘토',
      organization: 'Indent',
      position: '',
      team: { name: '오픈소마', members: '전수열, 김개발', mentor: '전수열' },
      mentoringSessions: [{ title: 'AI 멘토링', url: '/mentoring/1', status: '접수중' }],
      roomReservations: [{ title: 'A1 회의', url: '/room/1', status: '예약완료' }],
    }
    expect(DashboardSchema.parse(input)).toEqual(input)
  })

  it('preserves valid NoticeListItem values through parse', () => {
    const input = {
      id: 1,
      title: '공지',
      author: '관리자',
      createdAt: '2026-04-01',
    }
    expect(NoticeListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid NoticeDetail values through parse', () => {
    const input = {
      id: 1,
      title: '공지',
      author: '관리자',
      createdAt: '2026-04-01',
      content: '<p>내용</p>',
    }
    expect(NoticeDetailSchema.parse(input)).toEqual(input)
  })

  it('preserves valid TeamInfo values through parse', () => {
    const input = {
      teams: [
        { name: '오픈소마', memberCount: 3, joinStatus: '참여중' },
        { name: '김앤강', memberCount: 5, joinStatus: '참여하기' },
      ],
      currentTeams: 1,
      maxTeams: 100,
    }
    expect(TeamInfoSchema.parse(input)).toEqual(input)
  })

  it('preserves valid MemberInfo values through parse', () => {
    const input = {
      email: 'neo@example.com',
      name: '전수열',
      gender: '남자',
      birthDate: '1995-01-14',
      phone: '01012345678',
      organization: 'Indent',
      position: '',
    }
    expect(MemberInfoSchema.parse(input)).toEqual(input)
  })

  it('preserves valid EventListItem values through parse', () => {
    const input = {
      id: 11,
      category: '행사',
      title: '데모데이',
      registrationPeriod: { start: '2026-04-01', end: '2026-04-05' },
      eventPeriod: { start: '2026-04-10', end: '2026-04-10' },
      status: '접수중',
      createdAt: '2026-03-30',
    }
    expect(EventListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ScheduleListItem values through parse', () => {
    const input = {
      id: 1,
      category: '교육',
      title: '[교육] 디자인씽킹 교육',
      period: { start: '2026-04-21', end: '2026-04-26' },
    }
    expect(ScheduleListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ApplicationHistoryItem values through parse', () => {
    const input = {
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
    }
    expect(ApplicationHistoryItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid Pagination values through parse', () => {
    const input = { total: 23, currentPage: 2, totalPages: 3 }
    expect(PaginationSchema.parse(input)).toEqual(input)
  })

  it('preserves valid Credentials values through parse', () => {
    const input = {
      sessionCookie: 'session-token',
      csrfToken: 'csrf-token',
      username: 'neo@example.com',
      loggedInAt: '2026-04-09T00:00:00.000Z',
    }
    expect(CredentialsSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ReportListItem values through parse', () => {
    const input = {
      id: 1,
      category: '멘토링',
      title: 'AI 멘토링 보고서',
      progressDate: '2026-04-10',
      status: '승인완료',
      author: '전수열',
      createdAt: '2026-04-11',
      acceptedTime: '2시간',
      payAmount: '100000',
    }
    expect(ReportListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ReportDetail values through parse', () => {
    const input = {
      id: 1,
      category: '멘토링',
      title: 'AI 멘토링 보고서',
      progressDate: '2026-04-10',
      status: '승인완료',
      author: '전수열',
      createdAt: '2026-04-11',
      acceptedTime: '2시간',
      payAmount: '100000',
      content: '멘토링 진행 내용',
      subject: 'AI 기술 멘토링',
      menteeRegion: 'S',
      reportType: 'MRC010',
      teamNames: '오픈소마',
      venue: '스페이스 A1',
      attendanceCount: 4,
      attendanceNames: '김개발, 박코딩, 이알고, 최리즘',
      progressStartTime: '14:00',
      progressEndTime: '16:00',
      exceptStartTime: '',
      exceptEndTime: '',
      exceptReason: '',
      mentorOpinion: '우수',
      nonAttendanceNames: '',
      etc: '',
      files: [],
    }
    expect(ReportDetailSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ApprovalListItem values through parse', () => {
    const input = {
      id: 1,
      category: '멘토링',
      title: 'AI 멘토링 보고서',
      progressDate: '2026-04-10',
      status: '승인완료',
      author: '전수열',
      createdAt: '2026-04-11',
      acceptedTime: '2시간',
      travelExpense: '50000',
      mentoringAllowance: '100000',
    }
    expect(ApprovalListItemSchema.parse(input)).toEqual(input)
  })

  it('preserves valid ReportCreateOptions values through parse', () => {
    const input = {
      menteeRegion: 'S',
      reportType: 'MRC010',
      progressDate: '2026-04-10',
      venue: '스페이스 A1',
      attendanceCount: 4,
      attendanceNames: '김개발, 박코딩, 이알고, 최리즘',
      progressStartTime: '14:00',
      progressEndTime: '16:00',
      subject: 'AI 멘토링 진행 보고',
      content:
        '이번 멘토링에서는 AI 기술의 기초 개념과 실제 적용 사례에 대해 다루었습니다. 참가자들은 머신러닝의 기본 원리와 딥러닝의 구조에 대해 학습하고, 실습을 통해 모델을 구현해보았습니다.',
    }
    expect(ReportCreateOptionsSchema.parse(input)).toEqual(input)
  })

  it('rejects invalid values for every schema', () => {
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
    expect(() => ScheduleListItemSchema.parse({ id: 1, category: '교육', title: '강의' })).toThrow()
    expect(() => ApplicationHistoryItemSchema.parse({ id: 1, status: '신청완료' })).toThrow()
    expect(() => PaginationSchema.parse({ total: '23', currentPage: 2, totalPages: 3 })).toThrow()
    expect(() => CredentialsSchema.parse({ sessionCookie: 'cookie' })).toThrow()
    expect(() => ReportListItemSchema.parse({ id: 1, category: '멘토링' })).toThrow()
    expect(() => ReportDetailSchema.parse({ id: 1, category: '멘토링', title: '보고서' })).toThrow()
    expect(() =>
      ReportCreateOptionsSchema.parse({
        menteeRegion: 'S',
        reportType: 'MRC010',
        progressDate: '2026-04-10',
        venue: '스페이스 A1',
        attendanceCount: 4,
        attendanceNames: '김개발',
        progressStartTime: '14:00',
        progressEndTime: '16:00',
        subject: '짧음',
        content: '짧은 내용',
      }),
    ).toThrow()
  })
})
