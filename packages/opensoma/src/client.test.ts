import { afterEach, describe, expect, it, mock } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { SomaClient } from './client'
import { MENU_NO } from './constants'
import { CredentialManager } from './credential-manager'
import { AuthenticationError } from './errors'
import { SomaHttp, type UserIdentity } from './http'

afterEach(() => {
  mock.restore()
})

type HttpCall = { method: string; path: string; data: Record<string, string> | undefined }

interface FakeHttpConfig {
  identity?: UserIdentity | null
  getBody?: (path: string, data?: Record<string, string>) => string
  postBody?: (path: string, data: Record<string, string>) => string
  postFormBody?: (path: string, data: Record<string, string>) => string
  postJsonBody?: (path: string, data: Record<string, string>) => unknown
  sessionCookie?: string
  csrfToken?: string | null
  onLogin?: (username: string, password: string) => void
  onLogout?: () => void
  checkLoginSequence?: Array<UserIdentity | null>
}

function buildMentoringEditFormFixture(fields: {
  qustnrSn: string
  qustnrSj: string
  reportCd: 'MRC010' | 'MRC020'
  receiptType: 'UNTIL_LECTURE' | 'DIRECT'
  bgndeDate: string
  bgndeTime: string
  enddeDate: string
  enddeTime: string
  eventDt: string
  eventStime: string
  eventEtime: string
  applyCnt: string
  place: string
}): string {
  const option = (id: string, value: string, selected: string) =>
    `<option value="${value}"${value === selected ? ' selected' : ''}>${id}</option>`
  const radio = (name: string, value: string, checked: string) =>
    `<input type="radio" name="${name}" value="${value}"${value === checked ? ' checked' : ''} />`
  return `<form id="board">
    <input type="hidden" name="qustnrSn" value="${fields.qustnrSn}" />
    <input type="hidden" name="stateCd" value="A" />
    ${radio('reportCd', 'MRC010', fields.reportCd)}
    ${radio('reportCd', 'MRC020', fields.reportCd)}
    <input type="text" name="qustnrSj" value="${fields.qustnrSj}" />
    ${radio('receiptType', 'UNTIL_LECTURE', fields.receiptType)}
    ${radio('receiptType', 'DIRECT', fields.receiptType)}
    <input type="text" name="bgndeDate" value="${fields.bgndeDate}" />
    <select name="bgndeTime">${option(fields.bgndeTime, fields.bgndeTime, fields.bgndeTime)}</select>
    <input type="text" name="enddeDate" value="${fields.enddeDate}" />
    <select name="enddeTime">${option(fields.enddeTime, fields.enddeTime, fields.enddeTime)}</select>
    <input type="text" name="eventDt" value="${fields.eventDt}" />
    <select name="eventStime">${option(fields.eventStime, fields.eventStime, fields.eventStime)}</select>
    <select name="eventEtime">${option(fields.eventEtime, fields.eventEtime, fields.eventEtime)}</select>
    <input type="text" name="applyCnt" value="${fields.applyCnt}" />
    <select name="place">${option(fields.place, fields.place, fields.place)}</select>
  </form>`
}

function createFakeHttp(config: FakeHttpConfig = {}): { http: SomaHttp; calls: HttpCall[] } {
  const calls: HttpCall[] = []
  const sequence = config.checkLoginSequence ? [...config.checkLoginSequence] : null

  const fake = {
    checkLogin: async () => {
      if (sequence) {
        return sequence.shift() ?? config.identity ?? null
      }
      return config.identity ?? null
    },
    get: async (path: string, data?: Record<string, string>) => {
      calls.push({ method: 'get', path, data })
      return config.getBody ? config.getBody(path, data) : ''
    },
    post: async (path: string, data: Record<string, string>) => {
      calls.push({ method: 'post', path, data })
      return config.postBody ? config.postBody(path, data) : ''
    },
    postForm: async (path: string, data: Record<string, string>) => {
      calls.push({ method: 'postForm', path, data })
      return config.postFormBody ? config.postFormBody(path, data) : ''
    },
    postJson: async (path: string, data: Record<string, string>) => {
      calls.push({ method: 'postJson', path, data })
      return config.postJsonBody ? config.postJsonBody(path, data) : {}
    },
    postMultipart: async () => '',
    login: async (username: string, password: string) => {
      config.onLogin?.(username, password)
    },
    logout: async () => {
      config.onLogout?.()
    },
    getSessionCookie: () => config.sessionCookie,
    getCsrfToken: () => config.csrfToken ?? null,
  }

  return { http: fake as unknown as SomaHttp, calls }
}

describe('SomaClient', () => {
  it('exposes session state passed through options', () => {
    const client = new SomaClient({ sessionCookie: 'session-1', csrfToken: 'csrf-1' })

    expect(client.getSessionData()).toEqual({
      sessionCookie: 'session-1',
      csrfToken: 'csrf-1',
    })
  })

  it('lists mentoring sessions with parsed items and pagination', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () =>
        '<table><tbody><tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=123">[자유 멘토링] 제목 [접수중]</a></td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>작성자</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>',
    })
    const client = new SomaClient({ http })

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

  it('fetches a single mentoring session from the detail endpoint', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () =>
        '<input type="hidden" name="qustnrSn" value="99"><table><tr><th>모집 명</th><td>상세</td><th>상태</th><td>접수중</td></tr><tr><th>접수 기간</th><td>2026-04-01 ~ 2026-04-02</td><th>강의날짜</th><td>2026-04-03(목) 10:00 ~ 11:00</td></tr><tr><th>장소</th><td>온라인(Webex)</td><th>모집인원</th><td>4명</td></tr><tr><th>작성자</th><td>작성자</td><th>등록일</th><td>2026-04-01</td></tr></table><div data-content><p>본문</p></div>',
    })
    const client = new SomaClient({ http })

    const result = await client.mentoring.get(99)

    expect(calls).toEqual([
      {
        method: 'get',
        path: '/mypage/mentoLec/view.do',
        data: { menuNo: MENU_NO.MENTORING, qustnrSn: '99' },
      },
    ])
    expect(result).toMatchObject({ id: 99, title: '상세', venue: '온라인(Webex)' })
  })

  it('posts the expected payloads for create, update, delete, apply, cancel, reserve, and event apply', async () => {
    const mentoringDetailHtml =
      '<div class="group"><strong class="t">모집 명</strong><div class="c">[자유 멘토링] 기존 멘토링</div></div><div class="group"><strong class="t">접수 기간</strong><div class="c">2026.03.01 ~ 2026.03.15</div></div><div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.03.20 10:00시 ~ 12:00시</span></div></div><div class="group"><strong class="t">장소</strong><div class="c">온라인(Webex)</div></div><div class="group"><strong class="t">모집인원</strong><div class="c">5명</div></div><div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div><div class="group"><strong class="t">등록일</strong><div class="c">2026.03.01</div></div><div class="cont"><p>기존 내용</p></div>'
    const mentoringEditFormHtml = buildMentoringEditFormFixture({
      qustnrSn: '42',
      qustnrSj: '기존 멘토링',
      reportCd: 'MRC010',
      receiptType: 'UNTIL_LECTURE',
      bgndeDate: '2026-03-01',
      bgndeTime: '00:00',
      enddeDate: '2026-03-20',
      enddeTime: '10:00',
      eventDt: '2026-03-20',
      eventStime: '10:00',
      eventEtime: '12:00',
      applyCnt: '5',
      place: '온라인(Webex)',
    })
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: (path) => (path === '/mypage/mentoLec/forUpdate.do' ? mentoringEditFormHtml : mentoringDetailHtml),
    })
    const client = new SomaClient({ http })

    await client.mentoring.create({
      title: '새 멘토링',
      type: 'lecture',
      date: '2026-04-01',
      startTime: '10:00',
      endTime: '11:00',
      venue: '온라인(Webex)',
      maxAttendees: 10,
    })
    await client.mentoring.update(42, {
      title: '수정된 멘토링',
      type: 'public',
      date: '2026-05-01',
      startTime: '14:00',
      endTime: '15:00',
      venue: '오프라인',
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

    const writes = calls.filter((call) => call.method !== 'get')
    expect(writes.map((call) => `${call.method}:${call.path}`)).toEqual([
      'postForm:/mypage/mentoLec/insert.do',
      'postForm:/mypage/mentoLec/update.do',
      'post:/mypage/mentoLec/delete.do',
      'post:/application/application/application.do',
      'post:/mypage/userAnswer/cancel.do',
      'post:/mypage/itemRent/insert.do',
      'post:/application/application/application.do',
    ])
    expect(writes[0]?.data).toMatchObject({
      menuNo: MENU_NO.MENTORING,
      reportCd: 'MRC020',
      qustnrSj: '새 멘토링',
    })
    expect(writes[1]?.data).toMatchObject({
      menuNo: MENU_NO.MENTORING,
      reportCd: 'MRC010',
      qustnrSj: '수정된 멘토링',
      qustnrSn: '42',
    })
    expect(writes[2]?.data).toEqual({
      menuNo: MENU_NO.MENTORING,
      qustnrSn: '7',
      pageQueryString: '',
    })
    expect(writes[3]?.data).toEqual({
      menuNo: MENU_NO.EVENT,
      qustnrSn: '8',
      applyGb: 'C',
      stepHeader: '0',
    })
    expect(writes[4]?.data).toEqual({
      menuNo: MENU_NO.APPLICATION_HISTORY,
      applySn: '9',
      qustnrSn: '10',
    })
    expect(writes[5]?.data).toMatchObject({
      menuNo: MENU_NO.ROOM,
      itemId: '17',
      title: '회의',
      'time[0]': '10:00',
      'time[1]': '10:30',
    })
    expect(writes[6]?.data).toEqual({
      menuNo: MENU_NO.EVENT,
      qustnrSn: '11',
      applyGb: 'C',
      stepHeader: '0',
    })
  })

  it('fetches, updates, and cancels room reservations via itemRent endpoints', async () => {
    const detailHtml = `
      <form id="frm" method="post">
        <input type="hidden" name="rentId" value="18718" />
        <input type="hidden" name="itemId" value="17" />
        <input type="hidden" name="receiptStatCd" value="RS001" />
        <input type="hidden" name="title" value="멘토링" />
        <input type="hidden" name="rentDt" value="2026-05-31" />
        <input type="hidden" name="rentBgnde" value="2026-05-31 21:00:00.0" />
        <input type="hidden" name="rentEndde" value="2026-05-31 21:30:00.0" />
        <input type="hidden" name="infoCn" value="" />
        <input type="hidden" name="rentNum" value="4" />
      </form>
    `
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: (path) => (path === '/mypage/itemRent/view.do' ? detailHtml : ''),
    })
    const client = new SomaClient({ http })

    const detail = await client.room.get(18718)
    expect(detail).toEqual({
      rentId: 18718,
      itemId: 17,
      title: '멘토링',
      date: '2026-05-31',
      startTime: '21:00',
      endTime: '21:30',
      attendees: 4,
      notes: '',
      status: 'confirmed',
      statusCode: 'RS001',
    })

    await client.room.update(18718, { title: '스터디', notes: '회고 공유' })
    await client.room.update(18718, { slots: ['22:00', '22:30'] })
    await client.room.cancel(18718)

    const updateCalls = calls.filter((call) => call.path === '/mypage/itemRent/update.do')
    expect(updateCalls).toHaveLength(3)
    expect(updateCalls[0]?.data).toMatchObject({
      rentId: '18718',
      itemId: '17',
      receiptStatCd: 'RS001',
      title: '스터디',
      infoCn: '회고 공유',
      rentBgnde: '2026-05-31 21:00:00',
      rentEndde: '2026-05-31 21:30:00',
    })
    expect(updateCalls[0]?.data?.['time[0]']).toBeUndefined()
    expect(updateCalls[1]?.data).toMatchObject({
      rentId: '18718',
      title: '멘토링',
      rentBgnde: '2026-05-31 22:00:00',
      rentEndde: '2026-05-31 22:59:00',
      'time[0]': '22:00',
      'time[1]': '22:30',
      chkData_1: '2026-05-31|22:00|17',
      chkData_2: '2026-05-31|22:30|17',
    })
    expect(updateCalls[2]?.data).toMatchObject({
      rentId: '18718',
      receiptStatCd: 'RS002',
      title: '멘토링',
      rentBgnde: '2026-05-31 21:00:00',
      rentEndde: '2026-05-31 21:30:00',
    })

    const viewCalls = calls.filter((call) => call.path === '/mypage/itemRent/view.do')
    expect(viewCalls).toHaveLength(4)
  })

  it('swallows the SWMaestro success-alert thrown by SomaHttp on room update', async () => {
    const detailHtml = `
      <form id="frm" method="post">
        <input type="hidden" name="rentId" value="18718" />
        <input type="hidden" name="itemId" value="17" />
        <input type="hidden" name="receiptStatCd" value="RS001" />
        <input type="hidden" name="title" value="멘토링" />
        <input type="hidden" name="rentDt" value="2026-05-31" />
        <input type="hidden" name="rentBgnde" value="2026-05-31 21:00:00.0" />
        <input type="hidden" name="rentEndde" value="2026-05-31 21:30:00.0" />
        <input type="hidden" name="infoCn" value="" />
        <input type="hidden" name="rentNum" value="4" />
      </form>
    `
    const { http } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () => detailHtml,
      postBody: (path) => {
        if (path === '/mypage/itemRent/update.do') {
          throw new Error('정상적으로 수정하였습니다.')
        }
        return ''
      },
    })
    const client = new SomaClient({ http })

    await expect(client.room.update(18718, { title: '변경' })).resolves.toBeUndefined()
    await expect(client.room.cancel(18718)).resolves.toBeUndefined()
  })

  it('lists room reservations filtered by default to confirmed status via itemRent list endpoint', async () => {
    const listHtml = `
      <ul class="bbs-total">
        <li><strong>Total :</strong> 2</li>
        <li><span>1</span>/1 Page</li>
      </ul>
      <table>
        <thead>
          <tr><th>NO.</th><th>회의실 명</th><th>제목</th><th>사용기간</th><th>작성자</th><th>상태</th><th>등록일</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>2</td>
            <td><a href="/sw/mypage/itemRent/view.do?rentId=18618">스페이스 M1</a></td>
            <td>
              <div class="rel">
                <a href="/sw/mypage/itemRent/view.do?rentId=18618">멘토 특강</a>
                <span>예약완료</span>
              </div>
            </td>
            <td>2026.05.31 16:00 ~ 17:30</td>
            <td>전수열</td>
            <td>예약완료</td>
            <td>2026.04.20</td>
          </tr>
          <tr>
            <td>1</td>
            <td><a href="/sw/mypage/itemRent/view.do?rentId=18616">스페이스 A3</a></td>
            <td>
              <div class="rel">
                <a href="/sw/mypage/itemRent/view.do?rentId=18616">자유 멘토링</a>
                <span>예약완료</span>
              </div>
            </td>
            <td>2026.05.24 10:00 ~ 11:00</td>
            <td>전수열</td>
            <td>예약완료</td>
            <td>2026.04.15</td>
          </tr>
        </tbody>
      </table>
    `
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: (path) => (path === '/mypage/itemRent/list.do' ? listHtml : ''),
    })
    const client = new SomaClient({ http })

    const result = await client.room.reservations({ startDate: '2026-01-01', endDate: '2026-12-31' })

    expect(calls).toEqual([
      {
        method: 'get',
        path: '/mypage/itemRent/list.do',
        data: {
          menuNo: MENU_NO.ROOM,
          pageIndex: '1',
          sdate: '2026-01-01',
          edate: '2026-12-31',
          searchStat: 'RS001',
        },
      },
    ])
    expect(result.pagination).toEqual({ total: 2, currentPage: 1, totalPages: 1 })
    expect(result.items).toEqual([
      {
        rentId: 18618,
        venue: '스페이스 M1',
        title: '멘토 특강',
        date: '2026-05-31',
        startTime: '16:00',
        endTime: '17:30',
        author: '전수열',
        status: 'confirmed',
        statusLabel: '예약완료',
        registeredAt: '2026.04.20',
      },
      {
        rentId: 18616,
        venue: '스페이스 A3',
        title: '자유 멘토링',
        date: '2026-05-24',
        startTime: '10:00',
        endTime: '11:00',
        author: '전수열',
        status: 'confirmed',
        statusLabel: '예약완료',
        registeredAt: '2026.04.15',
      },
    ])
  })

  it('omits the searchStat filter when status is "all"', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () => '<ul class="bbs-total"><li>Total : 0</li></ul>',
    })
    const client = new SomaClient({ http })

    await client.room.reservations({ status: 'all', page: 3 })

    expect(calls[0]?.data).toEqual({ menuNo: MENU_NO.ROOM, pageIndex: '3' })
  })

  it('sends searchStat=RS002 when listing cancelled reservations', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () => '<ul class="bbs-total"><li>Total : 0</li></ul>',
    })
    const client = new SomaClient({ http })

    await client.room.reservations({ status: 'cancelled' })

    expect(calls[0]?.data).toMatchObject({ searchStat: 'RS002' })
  })

  it('re-raises genuine errors thrown by SomaHttp on room update', async () => {
    const detailHtml = `
      <form id="frm" method="post">
        <input type="hidden" name="rentId" value="18718" />
        <input type="hidden" name="itemId" value="17" />
        <input type="hidden" name="receiptStatCd" value="RS001" />
        <input type="hidden" name="title" value="멘토링" />
        <input type="hidden" name="rentDt" value="2026-05-31" />
        <input type="hidden" name="rentBgnde" value="2026-05-31 21:00:00.0" />
        <input type="hidden" name="rentEndde" value="2026-05-31 21:30:00.0" />
        <input type="hidden" name="infoCn" value="" />
        <input type="hidden" name="rentNum" value="4" />
      </form>
    `
    const { http } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: () => detailHtml,
      postBody: (path) => {
        if (path === '/mypage/itemRent/update.do') {
          throw new Error('권한이 없습니다.')
        }
        return ''
      },
    })
    const client = new SomaClient({ http })

    await expect(client.room.update(18718, { title: '변경' })).rejects.toThrow('권한이 없습니다.')
  })

  it('merges partial update params with the existing mentoring data', async () => {
    const mentoringDetailHtml =
      '<div class="group"><strong class="t">모집 명</strong><div class="c">[멘토 특강] 웹 성능 특강</div></div><div class="group"><strong class="t">접수 기간</strong><div class="c">2026.04.01 ~ 2026.04.10</div></div><div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.04.11 14:00시 ~ 15:30시</span></div></div><div class="group"><strong class="t">장소</strong><div class="c">온라인(Webex)</div></div><div class="group"><strong class="t">모집인원</strong><div class="c">20명</div></div><div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div><div class="group"><strong class="t">등록일</strong><div class="c">2026.04.01</div></div><div class="cont"><p>세션 본문</p></div>'
    const mentoringEditFormHtml = buildMentoringEditFormFixture({
      qustnrSn: '9572',
      qustnrSj: '웹 성능 특강',
      reportCd: 'MRC020',
      receiptType: 'UNTIL_LECTURE',
      bgndeDate: '2026-04-01',
      bgndeTime: '00:00',
      enddeDate: '2026-04-11',
      enddeTime: '14:00',
      eventDt: '2026-04-11',
      eventStime: '14:00',
      eventEtime: '15:30',
      applyCnt: '20',
      place: '온라인(Webex)',
    })
    const { http, calls } = createFakeHttp({
      identity: { userId: 'user@example.com', userNm: 'Test' },
      getBody: (path) => (path === '/mypage/mentoLec/forUpdate.do' ? mentoringEditFormHtml : mentoringDetailHtml),
    })
    const client = new SomaClient({ http })

    await client.mentoring.update(9572, { title: '변경된 제목' })

    const postFormCalls = calls.filter((c) => c.method === 'postForm')
    expect(postFormCalls).toHaveLength(1)
    expect(postFormCalls[0]?.data).toMatchObject({
      qustnrSj: '변경된 제목',
      qustnrSn: '9572',
      reportCd: 'MRC020',
      eventDt: '2026-04-11',
      eventStime: '14:00',
      eventEtime: '15:30',
      place: '온라인(Webex)',
      applyCnt: '20',
      bgndeDate: '2026-04-01',
      bgndeTime: '00:00',
      enddeDate: '2026-04-11',
      enddeTime: '14:00',
      receiptType: 'UNTIL_LECTURE',
      stateCd: 'A',
      qustnrAt: 'N',
      qestnarCn: '<p>세션 본문</p>',
    })
  })

  it('routes room, dashboard, notice, team, member, event, and history calls to the expected endpoints', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'neo@example.com', userNm: '전수열' },
      getBody: (path) => {
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
      postBody: (path) => {
        if (path === '/mypage/officeMng/rentTime.do') {
          return '<span class="ck-st2 disabled" data-hour="09" data-minute="00"><input type="checkbox" disabled="disabled"><label title="아침 회의&lt;br&gt;예약자 : 김오픈">오전 09:00</label></span>'
        }
        return '<ul class="bbs-reserve"><li class="item"><a href="javascript:void(0);" onclick="location.href=\'/sw/mypage/officeMng/view.do?itemId=17\';"><div class="cont"><h4 class="tit">스페이스 A1</h4><ul class="txt bul-dot grey"><li>이용기간 : 2026-04-01 ~ 2026-12-31</li><li><p>설명 : 4인</p></li><li class="time-list"><div class="time-grid"><span>09:00</span></div></li></ul></div></a></li></ul>'
      },
    })
    const client = new SomaClient({ http })

    const roomList = await client.room.list({ date: '2026-04-01', room: 'A1', includeReservations: true })
    const roomSlots = await client.room.available(17, '2026-04-01')
    const dashboard = await client.dashboard.get()
    const noticeList = await client.notice.list({ page: 2 })
    const noticeDetail = await client.notice.get(1)
    const team = await client.team.list()
    const member = await client.member.show()
    const events = await client.event.list({ page: 3 })
    const eventDetail = await client.event.get(1)
    const history = await client.mentoring.history({ page: 4 })

    expect(roomList[0]?.itemId).toBe(17)
    expect(roomList[0]?.timeSlots).toEqual([
      { time: '09:00', available: false, reservation: { title: '아침 회의', bookedBy: '김오픈' } },
    ])
    expect(roomSlots).toEqual([
      { time: '09:00', available: false, reservation: { title: '아침 회의', bookedBy: '김오픈' } },
    ])
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

    expect(calls.some((c) => c.path === '/mypage/myMain/dashboard.do')).toBe(true)
    expect(calls).toContainEqual({
      method: 'post',
      path: '/mypage/officeMng/rentTime.do',
      data: { viewType: 'CONTBODY', itemId: '17', rentDt: '2026-04-01' },
    })
    const mentoringListCall = calls.find((c) => c.path === '/mypage/mentoLec/list.do')
    expect(mentoringListCall?.data).toEqual({
      menuNo: MENU_NO.MENTORING,
      searchCnd: '2',
      searchId: 'neo@example.com',
      searchWrd: '전수열',
    })
  })

  it('routes schedule calls to the expected endpoint', async () => {
    const { http, calls } = createFakeHttp({
      identity: { userId: 'neo@example.com', userNm: '전수열' },
      getBody: (path) => {
        if (path === '/mypage/schedule/list.do') {
          return '<table><tbody><tr><td>1</td><td>팀78</td><td>배준서</td><td>이유제, 이중곤</td><td>-</td><td>-</td><td>-</td><td>-</td></tr></tbody></table><table><thead><tr><th>날짜</th><th>구분</th><th>제목</th></tr></thead><tbody><tr><td>2026-04-01 ~ 2026-04-02</td><td>행사</td><td>행사</td></tr></tbody></table>'
        }

        return ''
      },
    })
    const client = new SomaClient({ http })

    const schedule = await client.schedule.list({ page: 5 })

    expect(schedule.items).toEqual([
      {
        id: 1,
        category: '행사',
        title: '행사',
        period: { start: '2026-04-01', end: '2026-04-02' },
      },
    ])
    expect(schedule.pagination).toEqual({ total: 1, currentPage: 1, totalPages: 1 })
    expect(calls).toContainEqual({
      method: 'get',
      path: '/mypage/schedule/list.do',
      data: { menuNo: MENU_NO.SCHEDULE, pageIndex: '5' },
    })
  })

  it('joins a team by POSTing the native payload to updateUserTeamIn.json', async () => {
    const { http, calls } = createFakeHttp({
      identity: {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userGb: 'T',
      },
      postJsonBody: () => ({ resultCode: 'success' }),
    })
    const client = new SomaClient({ http })

    await client.team.join('60e6785c8c404142b12cf9ed2a3d811f')

    expect(calls).toContainEqual({
      method: 'postJson',
      path: '/mypage/myTeam/updateUserTeamIn.json',
      data: {
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userNm: '전수열',
        userGb: 'T',
        teamNo: '60e6785c8c404142b12cf9ed2a3d811f',
      },
    })
  })

  it('leaves a team by POSTing the native payload to updateUserTeamOut.json', async () => {
    const { http, calls } = createFakeHttp({
      identity: {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userGb: 'T',
      },
      postJsonBody: () => ({ resultCode: 'success' }),
    })
    const client = new SomaClient({ http })

    await client.team.leave('60e6785c8c404142b12cf9ed2a3d811f')

    expect(calls).toContainEqual({
      method: 'postJson',
      path: '/mypage/myTeam/updateUserTeamOut.json',
      data: {
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userNm: '전수열',
        userGb: 'T',
        teamNo: '60e6785c8c404142b12cf9ed2a3d811f',
      },
    })
  })

  it('throws when team.join receives a non-success resultCode', async () => {
    const { http } = createFakeHttp({
      identity: {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userGb: 'T',
      },
      postJsonBody: () => ({ resultCode: 'fail' }),
    })
    const client = new SomaClient({ http })

    await expect(client.team.join('team-1')).rejects.toThrow('팀 참여에 실패했습니다.')
  })

  it('throws when team.leave receives a non-success resultCode', async () => {
    const { http } = createFakeHttp({
      identity: {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: 'f6d192ad3b3e4ee29f1d238714ab92c1',
        userGb: 'T',
      },
      postJsonBody: () => ({ resultCode: 'fail' }),
    })
    const client = new SomaClient({ http })

    await expect(client.team.leave('team-1')).rejects.toThrow('팀 탈퇴에 실패했습니다.')
  })

  it('throws when team.join cannot resolve userNo', async () => {
    const { http } = createFakeHttp({
      identity: {
        userId: 'neo@example.com',
        userNm: '전수열',
        userNo: '',
        userGb: 'T',
      },
    })
    const client = new SomaClient({ http })

    await expect(client.team.join('team-1')).rejects.toThrow('userNo')
  })

  it('exhausts mentoring pagination so dashboard sessions span all pages', async () => {
    const buildMentoringRow = (id: number, sessionDate: string) =>
      `<tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=${id}">[멘토 특강] 세션 ${id} [접수중]</a></td><td>${sessionDate} ~ ${sessionDate}</td><td>${sessionDate}(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>전수열</td><td>${sessionDate}</td></tr>`
    const buildPaginatedListBody = (rows: string, currentPage: number, totalPages: number, total: number) =>
      `<table><tbody>${rows}</tbody></table><ul class="bbs-total"><li>Total : ${total}</li><li>${currentPage}/${totalPages} Page</li></ul>`
    const { http, calls } = createFakeHttp({
      identity: { userId: 'neo@example.com', userNm: '전수열' },
      getBody: (path, data) => {
        if (path === '/mypage/myMain/dashboard.do') {
          return ''
        }
        if (path === '/mypage/mentoLec/list.do') {
          const page = Number(data?.pageIndex ?? '1')
          if (page === 1) return buildPaginatedListBody(buildMentoringRow(101, '2026-04-03'), 1, 3, 3)
          if (page === 2) return buildPaginatedListBody(buildMentoringRow(102, '2026-04-10'), 2, 3, 3)
          if (page === 3) return buildPaginatedListBody(buildMentoringRow(103, '2026-04-17'), 3, 3, 3)
        }
        return ''
      },
    })
    const client = new SomaClient({ http })

    const dashboard = await client.dashboard.get()

    expect(dashboard.mentoringSessions.map((s) => s.url)).toEqual([
      '/mypage/mentoLec/view.do?qustnrSn=101',
      '/mypage/mentoLec/view.do?qustnrSn=102',
      '/mypage/mentoLec/view.do?qustnrSn=103',
    ])
    const listPages = calls
      .filter((c) => c.path === '/mypage/mentoLec/list.do')
      .map((c) => c.data?.pageIndex ?? '1')
      .sort()
    expect(listPages).toEqual(['1', '2', '3'])
  })

  it('delegates login and isLoggedIn to SomaHttp', async () => {
    const loginCalls: string[] = []
    const { http } = createFakeHttp({
      identity: { userId: 'neo@example.com', userNm: '전수열' },
      onLogin: (username, password) => loginCalls.push(`${username}:${password}`),
    })
    const client = new SomaClient({ username: 'neo@example.com', password: 'secret', http })

    await client.login()

    expect(loginCalls).toEqual(['neo@example.com:secret'])
    await expect(client.isLoggedIn()).resolves.toBe(true)
  })

  it('re-logs in automatically when username and password are configured', async () => {
    const loginCalls: string[] = []
    const { http } = createFakeHttp({
      checkLoginSequence: [null, { userId: 'neo@example.com', userNm: '전수열' }],
      onLogin: (username, password) => loginCalls.push(`${username}:${password}`),
      getBody: () =>
        '<table><tbody><tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=123">[자유 멘토링] 제목 [접수중]</a></td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>작성자</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>',
    })
    const client = new SomaClient({ username: 'neo@example.com', password: 'secret', http })

    await expect(client.mentoring.list()).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 123, title: '제목' })],
    })
    expect(loginCalls).toEqual(['neo@example.com:secret'])
  })

  it('persists the credentials used by login() when saveCredentials is called', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'opensoma-client-save-'))
    const manager = new CredentialManager(dir)
    const { http } = createFakeHttp({
      sessionCookie: 'session-1',
      csrfToken: 'csrf-1',
    })
    const client = new SomaClient({ http })

    await client.login('neo@example.com', 'secret')
    await client.saveCredentials(manager)

    await expect(manager.getCredentials()).resolves.toEqual({
      sessionCookie: 'session-1',
      csrfToken: 'csrf-1',
      username: 'neo@example.com',
      password: 'secret',
      loggedInAt: expect.any(String),
    })

    await manager.remove()
  })

  it('delegates logout to SomaHttp', async () => {
    const logoutCalls: string[] = []
    const { http } = createFakeHttp({ onLogout: () => logoutCalls.push('logout') })
    const client = new SomaClient({ http })

    await client.logout()

    expect(logoutCalls).toEqual(['logout'])
  })

  it('throws AuthenticationError from every auth-required operation when not logged in', async () => {
    const { http } = createFakeHttp({ identity: null })
    const client = new SomaClient({ http })

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
    await expect(
      client.mentoring.update(1, {
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
    await expect(client.room.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.room.update(1, { title: 'x' })).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.room.cancel(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.dashboard.get()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.notice.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.notice.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.team.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.team.join('team-1')).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.team.leave('team-1')).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.member.show()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.list()).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.get(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.event.apply(1)).rejects.toBeInstanceOf(AuthenticationError)
    await expect(client.schedule.list()).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('includes helpful login hints in the AuthenticationError message', async () => {
    const { http } = createFakeHttp({ identity: null })
    const client = new SomaClient({ http })

    try {
      await client.mentoring.list()
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AuthenticationError)
      expect((error as Error).message).toContain('opensoma auth login')
      expect((error as Error).message).toContain('opensoma auth extract')
    }
  })

  it('single-flights relogin across concurrent auth-required calls', async () => {
    const loginCalls: string[] = []
    let resolveLoginStarted: (() => void) | undefined
    const loginStarted = new Promise<void>((resolve) => {
      resolveLoginStarted = resolve
    })
    let allowLogin: (() => void) | undefined
    const loginGate = new Promise<void>((resolve) => {
      allowLogin = resolve
    })
    let loggedIn = false

    const fake = {
      checkLogin: async () => (loggedIn ? { userId: 'neo@example.com', userNm: '전수열' } : null),
      get: async () =>
        '<table><tbody><tr><td>1</td><td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=123">[자유 멘토링] 제목 [접수중]</a></td><td>2026-04-01 ~ 2026-04-02</td><td>2026-04-03(목) 10:00 ~ 11:00</td><td>1 /4</td><td>OK</td><td>[접수중]</td><td>작성자</td><td>2026-04-01</td></tr></tbody></table><ul class="bbs-total"><li>Total : 1</li><li>1/1 Page</li></ul>',
      post: async () => '',
      postForm: async () => '',
      postMultipart: async () => '',
      login: async (username: string, password: string) => {
        loginCalls.push(`${username}:${password}`)
        resolveLoginStarted?.()
        await loginGate
        loggedIn = true
      },
      logout: async () => {},
      getSessionCookie: () => 'session-after-relogin',
      getCsrfToken: () => 'csrf-after-relogin',
    }
    const client = new SomaClient({
      username: 'neo@example.com',
      password: 'secret',
      http: fake as unknown as SomaHttp,
    })

    const parallel = Promise.all([client.mentoring.list(), client.mentoring.list(), client.mentoring.list()])
    await loginStarted
    expect(loginCalls).toEqual(['neo@example.com:secret'])
    allowLogin?.()
    await parallel

    expect(loginCalls).toEqual(['neo@example.com:secret'])
  })
})
