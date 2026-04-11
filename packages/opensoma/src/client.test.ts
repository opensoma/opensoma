import { afterEach, describe, expect, mock, test } from 'bun:test'

import { SomaClient } from './client'
import { MENU_NO } from './constants'
import { AuthenticationError } from './errors'
import { SomaHttp } from './http'

afterEach(() => {
  mock.restore()
})

describe('SomaClient', () => {
  test('constructor initializes SomaHttp with provided session state', () => {
    const client = new SomaClient({ sessionCookie: 'session-1', csrfToken: 'csrf-1' })
    const http = Reflect.get(client, 'http') as SomaHttp

    expect(http.getSessionCookie()).toBe('session-1')
    expect(http.getCsrfToken()).toBe('csrf-1')
  })

  test('mentoring list calls GET and parses list plus pagination', async () => {
    const client = new SomaClient()
    const calls: Array<{ method: string; path: string; data: Record<string, string> | undefined }> = []
    Reflect.set(client, 'http', {
      checkLogin: async () => ({ userId: 'user@example.com', userNm: 'Test' }),
      get: async (path: string, data?: Record<string, string>) => {
        calls.push({ method: 'get', path, data })
        return '<table><tbody><tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=123">[자유 멘토링] 제목 [접수중]</a></td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>작성자</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>'
      },
    })

    const result = await client.mentoring.list({ status: 'open', type: 'public', page: 2 })

    expect(calls).toEqual([
      {
        method: 'get',
        path: '/mypage/mentoLec/list.do',
        data: {
          menuNo: MENU_NO.MENTORING,
          searchStatMentolec: 'A',
          searchGubunMentolec: 'MRC010',
          pageIndex: '2',
        },
      },
    ])
    expect(result.items[0]?.title).toBe('제목')
    expect(result.pagination).toEqual({ total: 1, currentPage: 1, totalPages: 1 })
  })

  test('mentoring get calls detail endpoint and parser', async () => {
    const client = new SomaClient()
    let captured: { path: string; data: Record<string, string> | undefined } | undefined
    Reflect.set(client, 'http', {
      checkLogin: async () => ({ userId: 'user@example.com', userNm: 'Test' }),
      get: async (path: string, data?: Record<string, string>) => {
        captured = { path, data }
        return '<input type="hidden" name="qustnrSn" value="99"><table><tr><th>모집 명</th><td>상세</td><th>상태</th><td>접수중</td></tr><tr><th>접수 기간</th><td>2026-04-01 ~ 2026-04-02</td><th>강의날짜</th><td>2026-04-03(목) 10:00 ~ 11:00</td></tr><tr><th>장소</th><td>온라인(Webex)</td><th>모집인원</th><td>4명</td></tr><tr><th>작성자</th><td>작성자</td><th>등록일</th><td>2026-04-01</td></tr></table><div data-content><p>본문</p></div>'
      },
    })

    const result = await client.mentoring.get(99)

    expect(captured).toEqual({
      path: '/mypage/mentoLec/view.do',
      data: { menuNo: MENU_NO.MENTORING, qustnrSn: '99' },
    })
    expect(result).toMatchObject({ id: 99, title: '상세', venue: '온라인(Webex)' })
  })

  test('mutating operations post expected payloads', async () => {
    const client = new SomaClient()
    const calls: Array<{ path: string; data: Record<string, string> }> = []
    Reflect.set(client, 'http', {
      checkLogin: async () => ({ userId: 'user@example.com', userNm: 'Test' }),
      post: async (path: string, data: Record<string, string>) => {
        calls.push({ path, data })
        return ''
      },
    })

    await client.mentoring.create({
      title: '새 멘토링',
      type: 'lecture',
      date: '2026-04-01',
      startTime: '10:00',
      endTime: '11:00',
      venue: '온라인(Webex)',
      maxAttendees: 10,
    })
    await client.mentoring.delete(7)
    await client.mentoring.apply(8)
    await client.mentoring.cancel({ applySn: 9, qustnrSn: 10 })
    await client.room.reserve({
      roomId: 17,
      date: '2026-04-01',
      slots: ['10:00', '10:30'],
      title: '회의',
    })
    await client.event.apply(11)

    expect(calls.map((call) => call.path)).toEqual([
      '/mypage/mentoLec/insert.do',
      '/mypage/mentoLec/delete.do',
      '/application/application/application.do',
      '/mypage/userAnswer/cancel.do',
      '/mypage/itemRent/insert.do',
      '/application/application/application.do',
    ])
    expect(calls[0]?.data).toMatchObject({
      menuNo: MENU_NO.MENTORING,
      reportCd: 'MRC020',
      qustnrSj: '새 멘토링',
    })
    expect(calls[1]?.data).toEqual({
      menuNo: MENU_NO.MENTORING,
      qustnrSn: '7',
      pageQueryString: '',
    })
    expect(calls[2]?.data).toEqual({
      menuNo: MENU_NO.EVENT,
      qustnrSn: '8',
      applyGb: 'C',
      stepHeader: '0',
    })
    expect(calls[3]?.data).toEqual({
      menuNo: MENU_NO.APPLICATION_HISTORY,
      applySn: '9',
      qustnrSn: '10',
    })
    expect(calls[4]?.data).toMatchObject({
      menuNo: MENU_NO.ROOM,
      itemId: '17',
      title: '회의',
      'time[0]': '10:00',
      'time[1]': '10:30',
    })
    expect(calls[5]?.data).toEqual({
      menuNo: MENU_NO.EVENT,
      qustnrSn: '11',
      applyGb: 'C',
      stepHeader: '0',
    })
  })

  test('room, dashboard, notice, team, member, event, and history routes use expected endpoints', async () => {
    const client = new SomaClient()
    const calls: Array<{ method: string; path: string; data: Record<string, string> | undefined }> = []
    Reflect.set(client, 'http', {
      checkLogin: async () => ({ userId: 'neo@example.com', userNm: '전수열' }),
      get: async (path: string, data?: Record<string, string>) => {
        calls.push({ method: 'get', path, data })
        if (path === '/mypage/myMain/dashboard.do') {
          return '<ul class="dash-top"><li class="dash-card"><div class="dash-etc"><span>소속 :<br> Indent</span><span>직책 :<br> </span></div><div class="dash-state"><div class="top"><span class="bg-orange label"><span>멘토</span></span><div class="welcome"><strong>전수열</strong>님 안녕하세요.</div></div></div></li></ul><ul class="bbs-dash_w"><li>멘토링 · 멘토특강<li><a href="/sw/mypage/mentoLec/view.do?qustnrSn=9582">게임 개발 AI 활용법 접수중</a></li></li></ul>'
        }
        if (path === '/mypage/mentoLec/list.do') {
          return '<table><tbody><tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=100">[멘토 특강] 내 멘토링 [접수중]</a></td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>전수열</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>'
        }
        if (path === '/mypage/myNotice/list.do') {
          return '<table><tbody><tr><td></td><td><a href="/sw/mypage/myNotice/view.do?nttId=1">공지</a></td><td>관리자</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>'
        }
        if (path === '/mypage/myNotice/view.do') {
          return '<input name="nttId" value="1"><table><tr><th>제목</th><td>공지</td><th>작성자</th><td>관리자</td></tr><tr><th>등록일</th><td>2026-04-01</td><th>번호</th><td>1</td></tr></table><div class="board-view-content"><p>상세</p></div>'
        }
        if (path === '/mypage/myTeam/team.do') {
          return '<ul class="bbs-team"><li><div class="top"><strong class="t"><a href="javascript:void(0);">오픈소마</a></strong></div><p>팀원 3명</p><button type="button">참여중</button></li></ul><p class="ico-team">현재 참여중인 방은 <strong class="color-blue">1</strong>/100팀 입니다</p>'
        }
        if (path === '/mypage/myInfo/forUpdateMy.do') {
          return '<dl><dt><span class="point">아이디</span></dt><dd>neo@example.com</dd></dl><dl><dt><span class="point">이름</span></dt><dd>전수열</dd></dl><dl><dt><span class="point">성별</span></dt><dd>남자</dd></dl><dl><dt><span class="point">생년월일</span></dt><dd>1995-01-14</dd></dl><dl><dt><span class="point">연락처</span></dt><dd>01012345678</dd></dl><dl><dt><span class="point">소속</span></dt><dd>Indent</dd></dl><dl><dt><span class="point">직책</span></dt><dd></dd></dl>'
        }
        if (path === '/mypage/applicants/list.do') {
          return '<table><tbody><tr><td>1</td><td>행사</td><td>행사</td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03 ~ 2026-04-03</td><td>[접수중]</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>'
        }
        if (path === '/mypage/applicants/view.do') {
          return '<input name="bbsId" value="1"><table><tr><th>제목</th><td>행사 상세</td></tr></table><div data-content><p>본문</p></div>'
        }
        return '<table><tbody><tr><td>1</td><td>멘토 특강</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=1">접수내역</a></td><td>전수열</td><td>2026.04.11</td><td>2026-04-01</td><td>[신청완료]</td><td>[OK]</td><td>승인대기</td><td>-</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>'
      },
      post: async (path: string, data: Record<string, string>) => {
        calls.push({ method: 'post', path, data })
        if (path === '/mypage/officeMng/rentTime.do') {
          return '<div class="time-grid"><span>09:00</span></div>'
        }
        return '<ul class="bbs-reserve"><li class="item"><a href="javascript:void(0);" onclick="location.href=\'/sw/mypage/officeMng/view.do?itemId=17\';"><div class="cont"><h4 class="tit">스페이스 A1</h4><ul class="txt bul-dot grey"><li>이용기간 : 2026-04-01 ~ 2026-12-31</li><li><p>설명 : 4인</p></li><li class="time-list"><div class="time-grid"><span>09:00</span></div></li></ul></div></a></li></ul>'
      },
    })

    const roomList = await client.room.list({ date: '2026-04-01', room: 'A1' })
    const roomSlots = await client.room.available(17, '2026-04-01')
    const dashboard = await client.dashboard.get()
    const noticeList = await client.notice.list({ page: 2 })
    const noticeDetail = await client.notice.get(1)
    const team = await client.team.show()
    const member = await client.member.show()
    const events = await client.event.list({ page: 3 })
    const eventDetail = await client.event.get(1)
    const history = await client.mentoring.history({ page: 4 })

    expect(roomList[0]?.itemId).toBe(17)
    expect(roomSlots).toEqual([{ time: '09:00', available: true }])
    expect(dashboard.name).toBe('전수열')
    expect(dashboard.mentoringSessions).toEqual([
      {
        title: '내 멘토링',
        url: '/mypage/mentoLec/view.do?qustnrSn=100',
        status: '접수중',
        date: '2026-04-03',
        time: '10:00',
        timeEnd: '11:00',
        type: '멘토 특강',
      },
    ])
    expect(noticeList.items[0]?.title).toBe('공지')
    expect(noticeDetail).toMatchObject({ id: 1, title: '공지' })
    expect(team.teams[0]?.name).toBe('오픈소마')
    expect(member.email).toBe('neo@example.com')
    expect(events.items[0]?.title).toBe('행사')
    expect(eventDetail).toMatchObject({ id: 1, title: '행사 상세' })
    expect(history.items[0]).toEqual({
      id: 1,
      category: '멘토 특강',
      title: '접수내역',
      author: '전수열',
      sessionDate: '2026-04-11',
      appliedAt: '2026-04-01',
      applicationStatus: '신청완료',
      approvalStatus: 'OK',
      applicationDetail: '승인대기',
      note: '-',
    })

    const dashboardCallIndex = calls.findIndex((c) => c.path === '/mypage/myMain/dashboard.do')
    expect(dashboardCallIndex).toBeGreaterThanOrEqual(0)
    const mentoringListCall = calls.find((c) => c.path === '/mypage/mentoLec/list.do')
    expect(mentoringListCall?.data).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchCnd: '2',
      searchId: 'neo@example.com',
      searchWrd: '전수열',
    })
  })

  test('login and isLoggedIn delegate to SomaHttp', async () => {
    const client = new SomaClient({ username: 'neo@example.com', password: 'secret' })
    const calls: string[] = []
    Reflect.set(client, 'http', {
      login: async (username: string, password: string) => {
        calls.push(`${username}:${password}`)
      },
      checkLogin: async () => ({ userId: 'neo@example.com', userNm: '전수열' }),
    })

    await client.login()

    expect(calls).toEqual(['neo@example.com:secret'])
    await expect(client.isLoggedIn()).resolves.toBe(true)
  })

  test('auth-required operations throw AuthenticationError when not logged in', async () => {
    const client = new SomaClient()
    Reflect.set(client, 'http', {
      checkLogin: async () => null,
    })

    await expect(client.mentoring.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.mentoring.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(
      client.mentoring.create({
        title: 'Test',
        type: 'public',
        date: '2026-04-01',
        startTime: '10:00',
        endTime: '11:00',
        venue: 'Test',
      }),
    ).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.mentoring.delete(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.mentoring.apply(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.mentoring.cancel({ applySn: 1, qustnrSn: 2 })).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.mentoring.history()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.room.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.room.available(1, '2026-04-01')).rejects.toBeInstanceOf(AuthenticationError)
    await expect(
      client.room.reserve({ roomId: 1, date: '2026-04-01', slots: ['10:00'], title: 'Test' }),
    ).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.dashboard.get()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.notice.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.notice.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.team.show()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.member.show()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.apply(1)).rejects.toBeInstanceOf(AuthenticationError)
  })

  test('AuthenticationError has helpful message', async () => {
    const client = new SomaClient()
    Reflect.set(client, 'http', {
      checkLogin: async () => null,
    })

    try {
      await client.mentoring.list()
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AuthenticationError)
      expect((error as Error).message).toContain('opensoma auth login')
      expect((error as Error).message).toContain('opensoma auth extract')
    }
  })
})
