import { describe, expect, test } from 'bun:test'

import {
  parseApprovalList,
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
  parseReportDetail,
  parseReportList,
  parseRoomList,
  parseRoomSlots,
  parseTeamInfo,
} from './formatters'
import { ApprovalListItemSchema, ReportDetailSchema, ReportListItemSchema } from './types'

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
      applicants: [],
    })
  })

  test('parseMentoringDetail parses applicant list table', () => {
    const html = `
      <div class="group"><strong class="t">모집 명</strong><div class="c">[자유 멘토링] 테스트 멘토링</div></div>
      <div class="group"><strong class="t">접수 기간</strong><div class="c">2026.04.01 ~ 2026.04.10</div></div>
      <div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.04.11 14:00시 ~ 15:30시</span></div></div>
      <div class="group"><strong class="t">모집인원</strong><div class="c">10명</div></div>
      <div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div>
      <div class="group"><strong class="t">등록일</strong><div class="c">2026.04.01</div></div>
      <div class="cont"><p>내용</p></div>
      <div class="total-normal mt50">신청자 리스트 [<strong class="color-blue">2 명</strong>]</div>
      <table>
        <thead>
          <tr><th>NO.</th><th>연수생</th><th>신청일</th><th>취소일</th><th>상태</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>2</td>
            <td class="popuser"><a href="javascript: popuser('...')">김태균</a></td>
            <td>2026.04.10 11:14</td>
            <td>-</td>
            <td><span class="color-blue">[신청완료]</span></td>
          </tr>
          <tr>
            <td>1</td>
            <td class="popuser"><a href="javascript: popuser('...')">이민호</a></td>
            <td>2026.04.09 09:30</td>
            <td>2026.04.10 14:22</td>
            <td><span class="color-red">[신청취소]</span></td>
          </tr>
        </tbody>
      </table>
    `
    const result = parseMentoringDetail(html, 1234)
    expect(result.applicants).toEqual([
      { name: '김태균', appliedAt: '2026.04.10 11:14', cancelledAt: '-', status: '신청완료' },
      { name: '이민호', appliedAt: '2026.04.09 09:30', cancelledAt: '2026.04.10 14:22', status: '신청취소' },
    ])
  })

  test('parseMentoringDetail returns empty applicants when no applicant table exists', () => {
    const html = `
      <div class="group"><strong class="t">모집 명</strong><div class="c">[자유 멘토링] 빈 멘토링</div></div>
      <div class="group"><strong class="t">접수 기간</strong><div class="c">2026.04.01 ~ 2026.04.10</div></div>
      <div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.04.11 14:00시 ~ 15:30시</span></div></div>
      <div class="group"><strong class="t">모집인원</strong><div class="c">5명</div></div>
      <div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div>
      <div class="group"><strong class="t">등록일</strong><div class="c">2026.04.01</div></div>
      <div class="cont"><p>내용</p></div>
    `
    expect(parseMentoringDetail(html, 5678).applicants).toEqual([])
  })

  test('parseMentoringDetail ignores unrelated 5-column tables in content', () => {
    const html = `
      <div class="group"><strong class="t">모집 명</strong><div class="c">[자유 멘토링] 콘텐츠 테이블 멘토링</div></div>
      <div class="group"><strong class="t">접수 기간</strong><div class="c">2026.04.01 ~ 2026.04.10</div></div>
      <div class="group"><strong class="t">강의날짜</strong><div class="c"><span>2026.04.11 14:00시 ~ 15:30시</span></div></div>
      <div class="group"><strong class="t">모집인원</strong><div class="c">5명</div></div>
      <div class="group"><strong class="t">작성자</strong><div class="c">전수열</div></div>
      <div class="group"><strong class="t">등록일</strong><div class="c">2026.04.01</div></div>
      <div class="cont">
        <table>
          <thead><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>data</td><td>data</td><td>data</td><td>data</td></tr>
          </tbody>
        </table>
      </div>
    `
    expect(parseMentoringDetail(html, 9999).applicants).toEqual([])
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

  describe('parseReportList', () => {
    test('parses report list table with all fields', () => {
      const html = `
        <ul class="bbs-total"><li><strong class="color-blue">Total :</strong> 2</li><li><span class="color-blue">1</span>/1 Page</li></ul>
        <table class=" t">
        <thead class="pc_only">
        <tr>
        <th>NO.</th><th>구분</th><th>제목</th><th>진행날짜</th><th>상태</th>
        <th class="pc_only">작성자</th><th class="pc_only">등록일</th>
        <th>인정시간</th><th>지급액</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td>2</td>
        <td>자유 멘토링</td>
        <td><a href="/sw/mypage/mentoringReport/view.do?menuNo=200049&amp;reportId=12345">2026년 04월 10일 멘토링 보고</a></td>
        <td>2026-04-10</td>
        <td>[승인]</td>
        <td class="pc_only">전수열</td>
        <td class="pc_only">2026-04-10</td>
        <td>2시간</td>
        <td>200,000</td>
        </tr>
        <tr>
        <td>1</td>
        <td>멘토 특강</td>
        <td><a href="/sw/mypage/mentoringReport/view.do?menuNo=200049&amp;reportId=67890">2026년 03월 15일 멘토링 보고</a></td>
        <td>2026-03-15</td>
        <td>[접수]</td>
        <td class="pc_only">전수열</td>
        <td class="pc_only">2026-03-15</td>
        <td>1시간30분</td>
        <td>150,000</td>
        </tr>
        </tbody>
        </table>
      `

      const result = parseReportList(html)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 12345,
        category: '자유 멘토링',
        title: '2026년 04월 10일 멘토링 보고',
        progressDate: '2026-04-10',
        status: '[승인]',
        author: '전수열',
        createdAt: '2026-04-10',
        acceptedTime: '2시간',
        payAmount: '200,000',
      })
      expect(result[1]).toEqual({
        id: 67890,
        category: '멘토 특강',
        title: '2026년 03월 15일 멘토링 보고',
        progressDate: '2026-03-15',
        status: '[접수]',
        author: '전수열',
        createdAt: '2026-03-15',
        acceptedTime: '1시간30분',
        payAmount: '150,000',
      })

      // Validate against schema
      result.forEach((item) => {
        ReportListItemSchema.parse(item)
      })
    })

    test('returns empty array for empty table', () => {
      const html = `
        <ul class="bbs-total"><li><strong class="color-blue">Total :</strong> 0</li><li><span class="color-blue">1</span>/1 Page</li></ul>
        <table class=" t">
        <thead class="pc_only">
        <tr>
        <th>NO.</th><th>구분</th><th>제목</th><th>진행날짜</th><th>상태</th>
        <th class="pc_only">작성자</th><th class="pc_only">등록일</th>
        <th>인정시간</th><th>지급액</th>
        </tr>
        </thead>
        <tbody></tbody>
        </table>
      `

      expect(parseReportList(html)).toEqual([])
    })

    test('prefers the actual title link in responsive report rows', () => {
      const html = `
        <table class="t">
          <tbody>
            <tr>
              <td class="pc_only"><a href="/sw/mypage/mentoringReport/view.do?reportId=28863&amp;menuNo=200049&amp;pageIndex=1">1</a></td>
              <td class="pc_only"><a href="/sw/mypage/mentoringReport/view.do?reportId=28863&amp;menuNo=200049&amp;pageIndex=1">자유 멘토링</a></td>
              <td class="tit">
                <div class="date_m block-t clearfix">
                  <span class="l"><a href="/sw/mypage/mentoringReport/view.do?reportId=28863&amp;menuNo=200049&amp;pageIndex=1">자유 멘토링</a></span>
                  <span class="r">2026.04.15</span>
                </div>
                <div class="rel">
                  <a href="/sw/mypage/mentoringReport/view.do?reportId=28863&amp;menuNo=200049&amp;pageIndex=1">[자유 멘토링] 2026년 04월 08일 멘토링 보고</a>
                  <div class="ab color-blue block-t"><strong class="label-state ing">접수중</strong></div>
                </div>
              </td>
              <td class="pc_only">2026-04-08</td>
              <td class="pc_only"><strong class="label-state ing">접수중</strong></td>
              <td class="pc_only">전수열</td>
              <td class="color-grey pc_only">2026.04.15</td>
              <td class="pc_only"></td>
              <td class="pc_only"></td>
            </tr>
          </tbody>
        </table>
      `

      expect(parseReportList(html)).toEqual([
        {
          id: 28863,
          category: '자유 멘토링',
          title: '[자유 멘토링] 2026년 04월 08일 멘토링 보고',
          progressDate: '2026-04-08',
          status: '접수중',
          author: '전수열',
          createdAt: '2026.04.15',
          acceptedTime: '',
          payAmount: '',
        },
      ])
    })
  })

  describe('parseReportDetail', () => {
    test('parses report detail view with all fields', () => {
      const html = `
        <div class="board-view">
        <table>
        <tbody>
        <tr><th>멘토링 대상</th><td>서울 연수생</td><th>구분</th><td>자유 멘토링</td></tr>
        <tr><th>진행 날짜</th><td>2026-04-10</td><th>작성자</th><td>전수열</td></tr>
        <tr><th>팀명</th><td>테스트팀</td><th>진행 장소</th><td>스페이스 A1</td></tr>
        <tr><th>참석 연수생</th><td>3명</td><th>참석자 이름</th><td>김철수, 이영희, 박민수</td></tr>
        <tr><th>진행시간</th><td>10:00 ~ 12:00</td><th>제외시간</th><td></td></tr>
        <tr><th>주제</th><td>AI 프로젝트 멘토링 주제</td></tr>
        <tr><th>추진 내용</th><td>멘토링 추진 내용을 100자 이상 작성합니다. 이 내용은 멘토링 세션에서 다룬 주요 내용을 포함합니다.</td></tr>
        <tr><th>멘토 의견</th><td>멘토 의견 내용</td></tr>
        <tr><th>무단불참자</th><td></td></tr>
        <tr><th>특이사항</th><td></td></tr>
        <tr><th>상태</th><td>승인</td><th>인정시간</th><td>2시간</td></tr>
        <tr><th>지급액</th><td>200,000</td></tr>
        </tbody>
        </table>
        </div>
      `

      const result = parseReportDetail(html, 12345)

      expect(result.id).toBe(12345)
      expect(result.menteeRegion).toBe('서울 연수생')
      expect(result.category).toBe('자유 멘토링')
      expect(result.progressDate).toBe('2026-04-10')
      expect(result.author).toBe('전수열')
      expect(result.subject).toBe('AI 프로젝트 멘토링 주제')
      expect(result.status).toBe('승인')
      expect(result.acceptedTime).toBe('2시간')
      expect(result.payAmount).toBe('200,000')

      // Validate against schema
      ReportDetailSchema.parse(result)
    })

    test('uses provided id in result', () => {
      const html = `
        <div class="board-view">
        <table>
        <tbody>
        <tr><th>멘토링 대상</th><td>부산 연수생</td><th>구분</th><td>멘토 특강</td></tr>
        <tr><th>진행 날짜</th><td>2026-03-15</td><th>작성자</th><td>김멘토</td></tr>
        <tr><th>주제</th><td>테스트 주제</td></tr>
        <tr><th>추진 내용</th><td>테스트 내용입니다. 100자 이상 작성해야 합니다. 충분한 길이의 테스트 내용을 작성합니다.</td></tr>
        <tr><th>상태</th><td>접수</td><th>인정시간</th><td>1시간30분</td></tr>
        <tr><th>지급액</th><td>150,000</td></tr>
        </tbody>
        </table>
        </div>
      `

      const result = parseReportDetail(html, 99999)
      expect(result.id).toBe(99999)
    })

    test('parses current report detail layout with grouped fields and files', () => {
      const html = `
        <form id="board">
          <div class="bbs-view-new write">
            <div class="group"><strong class="t">등록일</strong><div class="c">2026.04.15</div></div>
            <div class="group"><strong class="t">상태</strong><div class="c"><strong class="label-state ing">접수중</strong></div></div>
            <div class="group"><strong class="t">제목</strong><div class="c">[자유 멘토링] 2026년 04월 15일 멘토링 보고</div></div>
            <div class="group"><strong class="t">멘토링대상</strong><div class="c">서울 연수생</div></div>
            <div class="group"><strong class="t">구분</strong><div class="c"><div class="radio_box2 pink">자유 멘토링</div></div></div>
            <div class="group"><strong class="t">팀명</strong><div class="c">-</div></div>
            <div class="group"><strong class="t">진행 날짜</strong><div class="c"><input type="text" value="2026.04.12" readonly></div></div>
            <div class="group"><strong class="t">진행 멘토 명</strong><div class="c">전수열</div></div>
            <div class="group"><strong class="t">참석자 인원</strong><div class="c">3 명</div></div>
            <div class="group"><strong class="t">진행 장소</strong><div class="c"><input type="text" value="온라인" readonly></div></div>
            <div class="group"><strong class="t">참석자 이름</strong><div class="c"><input type="text" value="김철수, 이영희, 박민수" readonly></div></div>
            <div class="group"><strong class="t">진행시간</strong><div class="c">10:00 ~ 12:00 (총 2시간)</div></div>
            <div class="group"><strong class="t">제외시간</strong><div class="c">11:00 ~ 11:10 (총 10분)</div></div>
            <div class="group"><strong class="t">제외사유</strong><div class="c">휴식</div></div>
            <div class="group"><strong class="t">주제</strong><div class="c"><input type="text" value="프로젝트 아이디어 점검" readonly></div></div>
            <div class="group"><strong class="t">추진내용</strong><div class="c"><textarea readonly>첫째 줄\n둘째 줄</textarea></div></div>
            <div class="group"><strong class="t">멘토의견</strong><div class="c"><textarea readonly>좋은 흐름입니다.</textarea></div></div>
            <div class="group"><strong class="t">무단불참자</strong><div class="c"></div></div>
            <div class="group"><strong class="t">기타</strong><div class="c"><textarea readonly>후속 논의 예정</textarea></div></div>
            <ul class="file_list_new">
              <li><a href="/sw/cmmn/file/fileDown.do?menuNo=200049&amp;atchFileId=test&amp;fileSn=1">mentoring-9246.pdf [161.45 KB , 2026-04-15 ]</a></li>
            </ul>
          </div>
        </form>
      `

      const result = parseReportDetail(html, 28863)

      expect(result).toEqual({
        id: 28863,
        category: '자유 멘토링',
        title: '[자유 멘토링] 2026년 04월 15일 멘토링 보고',
        progressDate: '2026-04-12',
        status: '접수중',
        author: '전수열',
        createdAt: '2026-04-15',
        acceptedTime: '',
        payAmount: '',
        content: '첫째 줄\n둘째 줄',
        subject: '프로젝트 아이디어 점검',
        menteeRegion: '서울 연수생',
        reportType: '자유 멘토링',
        teamNames: '',
        venue: '온라인',
        attendanceCount: 3,
        attendanceNames: '김철수, 이영희, 박민수',
        progressStartTime: '10:00',
        progressEndTime: '12:00',
        exceptStartTime: '11:00',
        exceptEndTime: '11:10',
        exceptReason: '휴식',
        mentorOpinion: '좋은 흐름입니다.',
        nonAttendanceNames: '',
        etc: '후속 논의 예정',
        files: ['mentoring-9246.pdf [161.45 KB , 2026-04-15 ]'],
      })
    })
  })

  describe('parseApprovalList', () => {
    test('parses approval list table with 10 columns', () => {
      const html = `
        <ul class="bbs-total"><li><strong class="color-blue">Total :</strong> 1</li><li><span class="color-blue">1</span>/1 Page</li></ul>
        <table class=" t">
        <thead class="pc_only">
        <tr>
        <th>NO.</th><th>구분</th><th>제목</th><th>진행날짜</th><th>상태</th>
        <th class="pc_only">작성자</th><th class="pc_only">등록일</th>
        <th>인정시간</th><th>출장비</th><th>멘토링/특강 수당</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td>1</td>
        <td>자유 멘토링</td>
        <td><a href="/sw/mypage/mentoringReport/view.do?menuNo=200073&amp;reportId=12345">2026년 04월 10일 멘토링 보고</a></td>
        <td>2026-04-10</td>
        <td>[승인]</td>
        <td class="pc_only">전수열</td>
        <td class="pc_only">2026-04-10</td>
        <td>2시간</td>
        <td>50,000</td>
        <td>200,000</td>
        </tr>
        </tbody>
        </table>
      `

      const result = parseApprovalList(html)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 12345,
        category: '자유 멘토링',
        title: '2026년 04월 10일 멘토링 보고',
        progressDate: '2026-04-10',
        status: '[승인]',
        author: '전수열',
        createdAt: '2026-04-10',
        acceptedTime: '2시간',
        travelExpense: '50,000',
        mentoringAllowance: '200,000',
      })

      // Validate against schema
      result.forEach((item) => {
        ApprovalListItemSchema.parse(item)
      })
    })

    test('returns empty array for nodata table', () => {
      const html = `
        <table class=" t"><tbody><tr><td colspan="10" class="nodata">데이터가 없습니다.</td></tr></tbody></table>
      `

      expect(parseApprovalList(html)).toEqual([])
    })
  })
})
