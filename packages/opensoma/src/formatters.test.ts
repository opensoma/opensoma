import { describe, expect, test } from 'bun:test'

import {
  parseCsrfToken,
  parseDashboard,
  parseApplicationHistory,
  parseEventList,
  parseMemberInfo,
  parseMentoringDetail,
  parseMentoringList,
  parseNoticeDetail,
  parseNoticeList,
  parsePagination,
  parseRoomList,
  parseRoomSlots,
  parseTeamInfo,
} from './formatters'

describe('formatters', () => {
  test('parseMentoringList parses real list rows', () => {
    const html = `
      <table>
        <thead><tr><th>NO.</th><th>제목</th><th>접수기간</th><th>진행날짜</th><th>모집인원</th><th>개설승인</th><th>상태</th><th>작성자</th><th>등록일</th></tr></thead>
        <tbody>
          <tr>
            <td>584</td>
            <td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=9482&menuNo=200046&pageIndex=1&searchStatMentolec=">[자유 멘토링] 초기 제품 개발 준비를 위한 전략 가이드 [접수중]</a></td>
            <td>2026-04-08 ~ 2026-04-23</td>
            <td>2026-04-30(목)
              19:00 ~ 22:00</td>
            <td>3 /4</td>
            <td>OK</td>
            <td>[접수중]</td>
            <td>김태성</td>
            <td>2026-04-08</td>
          </tr>
        </tbody>
      </table>
    `

    expect(parseMentoringList(html)).toEqual([
      {
        id: 9482,
        title: '초기 제품 개발 준비를 위한 전략 가이드',
        type: '자유 멘토링',
        registrationPeriod: { start: '2026-04-08', end: '2026-04-23' },
        sessionDate: '2026-04-30',
        sessionTime: { start: '19:00', end: '22:00' },
        attendees: { current: 3, max: 4 },
        approved: true,
        status: '접수중',
        author: '김태성',
        createdAt: '2026-04-08',
      },
    ])
  })

  test('parseMentoringDetail parses real key-value detail view', () => {
    const html = `
      <input type="hidden" name="reportCd" value="MRC020">
      <div class="top">
        <div class="group"><strong class="t">모집 명</strong><div class="c">[멘토 특강] 웹 성능 특강 [마감]</div></div>
        <div class="group"><strong class="t">상태</strong><div class="c"><strong class="color-red">[마감]</strong></div></div>
        <div class="group"><strong class="t">개설 승인</strong><div class="c"><strong class="color-blue2">OK</strong></div></div>
        <div class="group"><strong class="t">접수 기간</strong><div class="c">2026.04.01 ~ 2026.04.10</div></div>
        <div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.04.11 14:00시 ~ 15:30시</span></div></div>
        <div class="group"><strong class="t">장소</strong><div class="c">온라인(Webex)</div></div>
        <div class="group"><strong class="t">모집인원</strong><div class="c">20명</div></div>
        <div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div>
        <div class="group"><strong class="t">등록일</strong><div class="c">2026.04.01</div></div>
      </div>
      <div class="cont"><p>세션 본문</p></div>
    `

    expect(parseMentoringDetail(html, 9572)).toEqual({
      id: 9572,
      title: '웹 성능 특강',
      type: '멘토 특강',
      registrationPeriod: { start: '2026-04-01', end: '2026-04-10' },
      sessionDate: '2026-04-11',
      sessionTime: { start: '14:00', end: '15:30' },
      attendees: { current: 0, max: 20 },
      approved: true,
      status: '마감',
      author: '전수열',
      createdAt: '2026.04.01',
      content: '<p>세션 본문</p>',
      venue: '온라인(Webex)',
    })
  })

  test('parseRoomList parses real room cards with embedded time slots', () => {
    const html = `
      <ul class="bbs-reserve">
        <li class="item">
          <a href="javascript:void(0);" onclick="location.href='/sw/mypage/officeMng/view.do?menuNo=200058&sdate=2026-04-10&pageIndex=1&itemId=17';">
            <div class="cont">
              <h4 class="tit">스페이스 A1</h4>
              <ul class="txt bul-dot grey">
                <li>이용기간 : 2026-04-06 ~ 2026-04-30</li>
                <li><p>스페이스 A1 회의실 : 4인</p></li>
                <li class="time-list">
                  <span>가용시간</span>
                  <div class="time-grid">
                    <span>09:00</span>
                    <span class="not-reserve">09:30</span>
                  </div>
                </li>
              </ul>
            </div>
          </a>
        </li>
      </ul>
    `

    expect(parseRoomList(html)).toEqual([
      {
        itemId: 17,
        name: '스페이스 A1',
        capacity: 4,
        availablePeriod: { start: '2026-04-06', end: '2026-04-30' },
        description: '스페이스 A1 회의실 : 4인',
        timeSlots: [
          { time: '09:00', available: true },
          { time: '09:30', available: false },
        ],
      },
    ])
  })

  test('parseRoomSlots parses rentTime fragment', () => {
    const html = `
      <span class="ck-st2" data-hour="09" data-minute="00">
        <input type="checkbox" name="time" id="time1_1" value="1">
        <label for="time1_1">AM 09:00</label>
      </span>
      <input type="hidden" name="chkData_1" value="09:00" />
      <span class="ck-st2 disabled" data-hour="12" data-minute="00">
        <input type="checkbox" name="time" id="time1_7" value="7" disabled="disabled">
        <label for="time1_7">PM 12:00</label>
      </span>
      <input type="hidden" name="chkData_7" value="12:00" />
    `

    expect(parseRoomSlots(html)).toEqual([
      { time: '09:00', available: true },
      { time: '12:00', available: false },
    ])
  })

  test('parseDashboard parses real dashboard sections', () => {
    const html = `
      <ul class="dash-top">
        <li class="dash-card">
          <div class="dash-etc">
            <span>소속 :<br> Indent</span>
            <span>직책 :<br> </span>
          </div>
          <div class="dash-state">
            <div class="top">
              <span class="bg-orange label"><span>멘토</span></span>
              <div class="welcome"><strong>전수열</strong>님 안녕하세요.</div>
            </div>
            <ul class="dash-box">
              <li><strong class="t">팀명</strong> <div class="c">OpenSoma</div></li>
              <li><strong class="t">팀원</strong> <div class="c">김개발, 이개발</div></li>
              <li><strong class="t">멘토</strong> <div class="c">전수열</div></li>
            </ul>
          </div>
        </li>
      </ul>
      <ul class="bbs-dash_w">
        <li>멘토링 · 멘토특강
          <li><a href="/sw/mypage/mentoLec/view.do?qustnrSn=9582">게임 개발 AI 활용법 접수중</a></li>
        </li>
        <li>회의실 예약현황
          <li><a href="/sw/mypage/itemRent/view.do?rentId=17905">OpenCode 하네스 만들어보기 예약완료</a></li>
        </li>
      </ul>
    `

    expect(parseDashboard(html)).toEqual({
      name: '전수열',
      role: '멘토',
      organization: 'Indent',
      position: '',
      team: {
        name: 'OpenSoma',
        members: '김개발, 이개발',
        mentor: '전수열',
      },
      mentoringSessions: [
        {
          title: '게임 개발 AI 활용법',
          url: '/sw/mypage/mentoLec/view.do?qustnrSn=9582',
          status: '접수중',
        },
      ],
      roomReservations: [
        {
          title: 'OpenCode 하네스 만들어보기',
          url: '/sw/mypage/itemRent/view.do?rentId=17905',
          status: '예약완료',
        },
      ],
    })
  })

  test('parseNoticeList and parseNoticeDetail parse real notice structures', () => {
    const listHtml = `
      <table>
        <thead><tr><th>NO.</th><th>제목</th><th>작성자</th><th>등록일</th></tr></thead>
        <tbody>
          <tr>
            <td></td>
            <td><a href="/sw/mypage/myNotice/view.do?nttId=36387&menuNo=200038&pageIndex=1">[센터] 연수센터 이용 규칙 N</a></td>
            <td>AI·SW마에스트로</td>
            <td>2026.04.07 15:14:20</td>
          </tr>
        </tbody>
      </table>
    `
    const detailHtml = `
      <div class="bbs-view">
        <div class="top">
          <div class="tit">[센터] 연수센터 이용 규칙 N</div>
          <div class="etc">
            <span>등록일 : 2026.04.07 15:14:20</span>
            <span>작성자 : AI·SW마에스트로</span>
          </div>
        </div>
        <div class="cont"><p>상세 내용</p></div>
      </div>
    `

    expect(parseNoticeList(listHtml)).toEqual([
      {
        id: 36387,
        title: '[센터] 연수센터 이용 규칙 N',
        author: 'AI·SW마에스트로',
        createdAt: '2026.04.07 15:14:20',
      },
    ])
    expect(parseNoticeDetail(detailHtml, 36387)).toEqual({
      id: 36387,
      title: '[센터] 연수센터 이용 규칙 N',
      author: 'AI·SW마에스트로',
      createdAt: '2026.04.07 15:14:20',
      content: '<p>상세 내용</p>',
    })
  })

  test('parseTeamInfo parses team cards and summary', () => {
    const html = `
      <ul class="bbs-team">
        <li>
          <div class="top">
            <strong class="t"><a href="javascript:void(0);" onclick="teamPageGo('전수열','a','b');">김앤강</a></strong>
          </div>
          <p>팀원 3명</p>
          <button type="button">참여중</button>
        </li>
        <li>
          <div class="top">
            <strong class="t"><a href="javascript:void(0);" onclick="teamPageGo('전수열','c','d');">오픈소마</a></strong>
          </div>
          <p>팀원 5명</p>
          <button type="button">참여하기</button>
        </li>
      </ul>
      <p class="ico-team">현재 참여중인 방은 <strong class="color-blue">1</strong>/100팀 입니다</p>
    `

    expect(parseTeamInfo(html)).toEqual({
      teams: [
        { name: '김앤강', memberCount: 3, joinStatus: '참여중' },
        { name: '오픈소마', memberCount: 5, joinStatus: '참여하기' },
      ],
      currentTeams: 1,
      maxTeams: 100,
    })
  })

  test('parseMemberInfo parses dl pairs', () => {
    const html = `
      <dl><dt><span class="point">아이디</span></dt><dd>devxoul@gmail.com</dd></dl>
      <dl><dt><span class="point">이름</span></dt><dd>전수열</dd></dl>
      <dl><dt><span class="point">성별</span></dt><dd>남자</dd></dl>
      <dl><dt><span class="point">생년월일</span></dt><dd>1995-01-14</dd></dl>
      <dl><dt><span class="point">연락처</span></dt><dd>01020609858</dd></dl>
      <dl><dt><span class="point">소속</span></dt><dd>Indent</dd></dl>
      <dl><dt><span class="point">직책</span></dt><dd></dd></dl>
    `

    expect(parseMemberInfo(html)).toEqual({
      email: 'devxoul@gmail.com',
      name: '전수열',
      gender: '남자',
      birthDate: '1995-01-14',
      phone: '01020609858',
      organization: 'Indent',
      position: '',
    })
  })

  test('parseEventList parses 7-column event table', () => {
    const html = `
      <table>
        <thead><tr><th>NO.</th><th>구분</th><th>제목</th><th>접수기간</th><th>행사기간</th><th>상태</th><th>등록일</th></tr></thead>
        <tbody>
          <tr><td>11</td><td>행사</td><td><a href="/sw/mypage/applicants/view.do?bbsId=77&menuNo=200050">데모데이</a></td><td>2026.04.01 ~ 2026.04.05</td><td>2026.04.10 ~ 2026.04.10</td><td>[접수중]</td><td>2026-03-30</td></tr>
        </tbody>
      </table>
    `

    expect(parseEventList(html)).toEqual([
      {
        id: 77,
        category: '행사',
        title: '데모데이',
        registrationPeriod: { start: '2026-04-01', end: '2026-04-05' },
        eventPeriod: { start: '2026-04-10', end: '2026-04-10' },
        status: '접수중',
        createdAt: '2026-03-30',
      },
    ])
  })

  test('parseApplicationHistory parses 10-column mentoring history table', () => {
    const html = `
      <table>
        <thead>
          <tr><th>NO.</th><th>구분</th><th>제목</th><th>작성자</th><th>강의날짜</th><th>접수일</th><th>접수상태</th><th>개설승인</th><th>접수내역</th><th>비고</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>멘토 특강</td>
            <td><a href="/sw/mypage/mentoLec/view.do?qustnrSn=9572">웹 성능 특강</a></td>
            <td>전수열</td>
            <td>2026.04.11</td>
            <td>2026.04.02</td>
            <td>[신청완료]</td>
            <td>[OK]</td>
            <td>승인대기</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    `

    expect(parseApplicationHistory(html)).toEqual([
      {
        id: 1,
        category: '멘토 특강',
        title: '웹 성능 특강',
        author: '전수열',
        sessionDate: '2026-04-11',
        appliedAt: '2026.04.02',
        applicationStatus: '신청완료',
        approvalStatus: 'OK',
        applicationDetail: '승인대기',
        note: '-',
      },
    ])
  })

  test('parsePagination parses bbs-total block', () => {
    const html = `
      <ul class="bbs-total">
        <li>Total : 11</li>
        <li>1/2 Page</li>
      </ul>
    `

    expect(parsePagination(html)).toEqual({ total: 11, currentPage: 1, totalPages: 2 })
  })

  test('parseCsrfToken extracts hidden input', () => {
    expect(parseCsrfToken('<form><input type="hidden" name="csrfToken" value="csrf-123"></form>')).toBe('csrf-123')
  })
})
