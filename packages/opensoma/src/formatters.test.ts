import { describe, expect, it } from 'bun:test'

import {
  parseApprovalList,
  parseCsrfToken,
  parseDashboard,
  parseApplicationHistory,
  parseEventList,
  parseScheduleList,
  parseMemberInfo,
  parseMentoringDetail,
  parseMentoringEditForm,
  parseMentoringList,
  parseNoticeDetail,
  parseNoticeList,
  parsePagination,
  parseReportDetail,
  parseReportList,
  parseRoomList,
  parseRoomReservationDetail,
  parseRoomReservationList,
  parseRoomSlots,
  parseTeamInfo,
} from './formatters'
import { ApprovalListItemSchema, ReportDetailSchema, ReportListItemSchema } from './types'

describe('formatters', () => {
  it('parses real mentoring list rows from the list page', () => {
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

  it('parses the key-value sections of a real mentoring detail view', () => {
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

  it('parses the applicant list table on the mentoring detail view', () => {
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

  it('returns an empty applicant list when no applicant table is present', () => {
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

  it('ignores unrelated 5-column tables embedded in the detail content', () => {
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

  it('parses real room cards along with their embedded time slots', () => {
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

  it('parses a room reservation detail form into the mutable fields used by update.do', () => {
    const html = `
      <form id="frm" method="post">
        <input type="hidden" name="pageQueryString" value="menuNo=200058&pageIndex=" />
        <input type="hidden" name="rentId" value="18718" />
        <input type="hidden" name="csrfToken" id="csrfToken" value="" />
        <input type="hidden" name="menuNo" id="menuNo" value="200058" />
        <input type="hidden" name="itemId" id="itemId" value="17" />
        <input type="hidden" name="receiptStatCd" id="receiptStatCd" value="RS001" />
        <input type="hidden" name="title" value="멘토링" />
        <input type="hidden" name="rentDt" value="2026-05-31" />
        <input type="hidden" name="rentBgnde" value="2026-05-31 21:00:00.0" />
        <input type="hidden" name="rentEndde" value="2026-05-31 21:30:00.0" />
        <input type="hidden" name="infoCn" value="리뷰 세션" />
        <input type="hidden" name="rentNum" value="4" />
      </form>
    `

    expect(parseRoomReservationDetail(html)).toEqual({
      rentId: 18718,
      itemId: 17,
      title: '멘토링',
      date: '2026-05-31',
      startTime: '21:00',
      endTime: '21:30',
      attendees: 4,
      notes: '리뷰 세션',
      status: 'confirmed',
      statusCode: 'RS001',
    })
  })

  it('reports cancelled status and recovers the date from rentBgnde when rentDt is missing', () => {
    const html = `
      <form id="frm" method="post">
        <input type="hidden" name="rentId" value="18715" />
        <input type="hidden" name="itemId" value="17" />
        <input type="hidden" name="receiptStatCd" value="RS002" />
        <input type="hidden" name="title" value="취소된 예약" />
        <input type="hidden" name="rentBgnde" value="2026-06-02 10:00:00.0" />
        <input type="hidden" name="rentEndde" value="2026-06-02 10:30:00.0" />
        <input type="hidden" name="infoCn" value="" />
        <input type="hidden" name="rentNum" value="2" />
      </form>
    `

    expect(parseRoomReservationDetail(html)).toEqual({
      rentId: 18715,
      itemId: 17,
      title: '취소된 예약',
      date: '2026-06-02',
      startTime: '10:00',
      endTime: '10:30',
      attendees: 2,
      notes: '',
      status: 'cancelled',
      statusCode: 'RS002',
    })
  })

  it('parses the 7-column room reservation list table with rentId, venue, title, and time range', () => {
    const html = `
      <div class="bbs-list">
        <ul class="bbs-total">
          <li><strong>Total :</strong> 15</li>
          <li><span>1</span>/2 Page</li>
        </ul>
        <table>
          <thead>
            <tr>
              <th>NO.</th><th>회의실 명</th><th>제목</th><th>사용기간</th>
              <th>작성자</th><th>상태</th><th>등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>15</td>
              <td><a href="/sw/mypage/itemRent/view.do?rentId=18618&menuNo=200058">스페이스 M1</a></td>
              <td class="tit">
                <div class="rel">
                  <a href="/sw/mypage/itemRent/view.do?rentId=18618&menuNo=200058">멘토 특강</a>
                  <span class="ab">예약완료</span>
                </div>
              </td>
              <td>2026.05.31 16:00 ~ 17:30</td>
              <td>전수열</td>
              <td><span class="label-state y">예약완료</span></td>
              <td>2026.04.20</td>
            </tr>
            <tr>
              <td>14</td>
              <td><a href="/sw/mypage/itemRent/view.do?rentId=18616&menuNo=200058">스페이스 A3</a></td>
              <td class="tit">
                <div class="rel">
                  <a href="/sw/mypage/itemRent/view.do?rentId=18616&menuNo=200058">자유 멘토링</a>
                  <span class="ab">예약취소</span>
                </div>
              </td>
              <td>2026.05.31 13:00 ~ 14:30</td>
              <td>전수열</td>
              <td><span class="label-state n">예약취소</span></td>
              <td>2026.04.20</td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    expect(parseRoomReservationList(html)).toEqual([
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
        date: '2026-05-31',
        startTime: '13:00',
        endTime: '14:30',
        author: '전수열',
        status: 'cancelled',
        statusLabel: '예약취소',
        registeredAt: '2026.04.20',
      },
    ])
  })

  it('returns an empty reservation list when the 7-column table is missing', () => {
    expect(parseRoomReservationList('<div>nothing here</div>')).toEqual([])
  })

  it('parses the rentTime fragment for room slot availability and reservation info', () => {
    const html = `
      <span class="ck-st2" data-hour="09" data-minute="00">
        <input type="checkbox" name="time" id="time1_1" value="1">
        <label for="time1_1">AM 09:00</label>
      </span>
      <input type="hidden" name="chkData_1" value="09:00" />
      <span class="ck-st2 disabled" data-hour="12" data-minute="00">
        <input type="checkbox" name="time" id="time1_7" value="7" disabled="disabled">
        <label for="time1_7" title="점심 회의&lt;br&gt;예약자 : 김오픈">PM 12:00</label>
      </span>
      <input type="hidden" name="chkData_7" value="12:00" />
    `

    expect(parseRoomSlots(html)).toEqual([
      { time: '09:00', available: true },
      {
        time: '12:00',
        available: false,
        reservation: { title: '점심 회의', bookedBy: '김오픈' },
      },
    ])
  })

  it('parses every section of a real dashboard page', () => {
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
      teams: [],
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

  it('parses real notice list and detail page structures', () => {
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

  it('parses team cards together with the team count summary', () => {
    const html = `
      <ul class="bbs-team">
        <li>
          <div class="top">
            <strong class="t">
              <a href="javascript:void(0);" onclick="teamPageGo('전수열','owner-1','team-a');">김앤강</a>
            </strong>
            <span class="add-txt"></span>
            <ul class="info">
              <li><strong>팀장 : </strong> <span><a class="sui">강동우</a></span></li>
              <li>
                <strong>팀원 : </strong>
                <span><a href="javascript: popuser('uid-a')" class="sui">강경현</a></span>
                <span><a href="javascript: popuser('uid-b')" class="sui">강동우</a></span>
              </li>
              <li><strong>멘토 : </strong></li>
            </ul>
          </div>
          <div class="bot">
            <ul class="ict">
              <li>ICT기술분류(대) : <span>방송·콘텐츠</span></li>
              <li>ICT기술분류(중) : <span>콘텐츠</span></li>
            </ul>
            <div class="team-com"></div>
            <div class="btn_w">
              <button type="button" class="btn-team bg-light inTeam" value="team-a">참여</button>
            </div>
          </div>
        </li>
        <li>
          <div class="top">
            <strong class="t">
              <a href="javascript:void(0);" onclick="teamPageGo('전수열','owner-2','team-b');">오픈소마</a>
            </strong>
            <span class="add-txt">Previzion</span>
            <ul class="info">
              <li><strong>팀장 : </strong> <span><a class="sui">전수열</a></span></li>
              <li>
                <strong>팀원 : </strong>
                <span><a href="javascript: popuser('uid-1')" class="sui">전수열</a></span>
              </li>
              <li>
                <strong>멘토 : </strong>
                <span><a href="javascript: popuser('uid-m1')" class="sui">문승현</a></span>
              </li>
            </ul>
          </div>
          <div class="bot">
            <ul class="ict">
              <li>ICT기술분류(대) : <span>SW·SI</span></li>
              <li>ICT기술분류(중) : <span>응용SW</span></li>
            </ul>
            <div class="team-com">
              <span class="t2">멘토 구성 완료</span>
              <span class="t1">팀 구성 완료</span>
            </div>
            <div class="btn_w">
              <a href="javascript:void(0);" class="btn-team bg-black">완료</a>
            </div>
          </div>
        </li>
        <li>
          <div class="top">
            <strong class="t">
              <a href="javascript:void(0);" onclick="teamPageGo('전수열','owner-3','team-c');">LAUNS</a>
            </strong>
            <span class="add-txt"></span>
            <ul class="info">
              <li><strong>팀장 : </strong> <span><a class="sui">홍길동</a></span></li>
              <li><strong>팀원 : </strong></li>
              <li><strong>멘토 : </strong></li>
            </ul>
          </div>
          <div class="bot">
            <ul class="ict"></ul>
            <div class="team-com"></div>
            <div class="btn_w">
              <button type="button" class="btn-team bg-blue outTeam" value="team-c">탈퇴</button>
            </div>
          </div>
        </li>
      </ul>
      <p class="ico-team">현재 참여중인 방은 <strong class="color-blue">1</strong>/100팀 입니다</p>
    `

    expect(parseTeamInfo(html)).toEqual({
      teams: [
        {
          name: '김앤강',
          projectName: '',
          ownerId: 'owner-1',
          teamId: 'team-a',
          leader: '강동우',
          members: [
            { name: '강경현', userId: 'uid-a' },
            { name: '강동우', userId: 'uid-b' },
          ],
          mentors: [],
          ictCategoryMajor: '방송·콘텐츠',
          ictCategoryMinor: '콘텐츠',
          teamCompleted: false,
          mentorCompleted: false,
          joinStatus: '참여',
        },
        {
          name: '오픈소마',
          projectName: 'Previzion',
          ownerId: 'owner-2',
          teamId: 'team-b',
          leader: '전수열',
          members: [{ name: '전수열', userId: 'uid-1' }],
          mentors: [{ name: '문승현', userId: 'uid-m1' }],
          ictCategoryMajor: 'SW·SI',
          ictCategoryMinor: '응용SW',
          teamCompleted: true,
          mentorCompleted: true,
          joinStatus: '완료',
        },
        {
          name: 'LAUNS',
          projectName: '',
          ownerId: 'owner-3',
          teamId: 'team-c',
          leader: '홍길동',
          members: [],
          mentors: [],
          ictCategoryMajor: '',
          ictCategoryMinor: '',
          teamCompleted: false,
          mentorCompleted: false,
          joinStatus: '탈퇴',
        },
      ],
      currentTeams: 1,
      maxTeams: 100,
    })
  })

  it('parses member info from <dl> definition pairs', () => {
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

  it('parses the 7-column event list table', () => {
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

  it('parses the 3-column monthly schedule table and synthesizes pagination', () => {
    const html = `
      <table>
        <thead><tr><th>NO.</th><th>팀명</th><th>팀장</th><th>팀원</th><th>멘토명</th><th>프로젝트 명</th><th>ICT기술분류(대)</th><th>ICT기술분류(중)</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>팀78</td><td>배준서</td><td>이유제, 이중곤</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>날짜</th><th>구분</th><th>제목</th></tr></thead>
        <tbody>
          <tr><td>2026-04-21~2026-04-26</td><td>교육</td><td>[교육] 디자인씽킹 교육</td></tr>
        </tbody>
      </table>
    `

    expect(parseScheduleList(html)).toEqual({
      items: [
        {
          id: 1,
          category: '교육',
          title: '[교육] 디자인씽킹 교육',
          period: { start: '2026-04-21', end: '2026-04-26' },
        },
      ],
      pagination: { total: 1, currentPage: 1, totalPages: 1 },
    })
  })

  it('returns empty items when the monthly schedule table is missing', () => {
    const html = `
      <table>
        <thead><tr><th>NO.</th><th>팀명</th></tr></thead>
        <tbody><tr><td>1</td><td>팀78</td></tr></tbody>
      </table>
    `

    expect(parseScheduleList(html)).toEqual({
      items: [],
      pagination: { total: 0, currentPage: 1, totalPages: 1 },
    })
  })

  it('honors the parsed pagination block when SWMaestro provides one', () => {
    const html = `
      <table>
        <thead><tr><th>날짜</th><th>구분</th><th>제목</th></tr></thead>
        <tbody>
          <tr><td>2026-04-21~2026-04-26</td><td>교육</td><td>강의</td></tr>
        </tbody>
      </table>
      <ul class="bbs-total"><li>Total : 9</li><li>2/3 Page</li></ul>
    `

    expect(parseScheduleList(html).pagination).toEqual({ total: 9, currentPage: 2, totalPages: 3 })
  })

  it('parses the 10-column mentoring application history table', () => {
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
        url: '/sw/mypage/mentoLec/view.do?qustnrSn=9572',
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

  it('parses the bbs-total pagination block', () => {
    const html = `
      <ul class="bbs-total">
        <li>Total : 11</li>
        <li>1/2 Page</li>
      </ul>
    `

    expect(parsePagination(html)).toEqual({ total: 11, currentPage: 1, totalPages: 2 })
  })

  it('extracts the CSRF token from a hidden input field', () => {
    expect(parseCsrfToken('<form><input type="hidden" name="csrfToken" value="csrf-123"></form>')).toBe('csrf-123')
  })

  describe('parseReportList', () => {
    it('parses every field of the report list table', () => {
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

    it('returns an empty array when the report list table has no rows', () => {
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
  })

  describe('parseReportDetail', () => {
    it('parses every field of the report detail view', () => {
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

    it('uses the provided id in the parsed report detail', () => {
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
  })

  describe('parseApprovalList', () => {
    it('parses every column of the 10-column approval list table', () => {
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

    it('returns an empty array when the approval table shows the nodata row', () => {
      const html = `
        <table class=" t"><tbody><tr><td colspan="10" class="nodata">데이터가 없습니다.</td></tr></tbody></table>
      `

      expect(parseApprovalList(html)).toEqual([])
    })
  })
})

describe('parseMentoringEditForm', () => {
  const untilLectureHtml = `
    <form id="board">
      <input type="hidden" name="qustnrSn" value="9572" />
      <input type="radio" name="reportCd" value="MRC010" />
      <input type="radio" name="reportCd" value="MRC020" checked />
      <input type="text" name="qustnrSj" value="웹 성능 특강" />
      <input type="radio" name="receiptType" value="UNTIL_LECTURE" checked />
      <input type="radio" name="receiptType" value="DIRECT" />
      <input type="text" name="bgndeDate" value="2026-04-01" />
      <select name="bgndeTime"><option value="00:00" selected>00시</option></select>
      <input type="text" name="enddeDate" value="2026-04-11" />
      <select name="enddeTime"><option value="14:00" selected>14시</option></select>
      <input type="text" name="eventDt" value="2026-04-11" />
      <select name="eventStime"><option value="14:00" selected>14시</option></select>
      <select name="eventEtime"><option value="15:30" selected>15시30분</option></select>
      <input type="text" name="applyCnt" value="20" />
      <select name="place"><option value="온라인(Webex)" selected>온라인(Webex)</option></select>
    </form>
  `

  const directHtml = `
    <form id="board">
      <input type="hidden" name="qustnrSn" value="10551" />
      <input type="radio" name="reportCd" value="MRC010" />
      <input type="radio" name="reportCd" value="MRC020" checked />
      <input type="text" name="qustnrSj" value="리뷰 검증" />
      <input type="radio" name="receiptType" value="UNTIL_LECTURE" />
      <input type="radio" name="receiptType" value="DIRECT" checked />
      <input type="text" name="bgndeDate" value="2026-11-01" />
      <select name="bgndeTime"><option value="09:00" selected>09시</option></select>
      <input type="text" name="enddeDate" value="2026-12-20" />
      <select name="enddeTime"><option value="18:00" selected>18시</option></select>
      <input type="text" name="eventDt" value="2026-12-30" />
      <select name="eventStime"><option value="19:00" selected>19시</option></select>
      <select name="eventEtime"><option value="20:00" selected>20시</option></select>
      <input type="text" name="applyCnt" value="10" />
      <select name="place"><option value="온라인(Webex)" selected>온라인(Webex)</option></select>
    </form>
  `

  it('extracts the UNTIL_LECTURE receipt window and session schedule verbatim from the form', () => {
    const form = parseMentoringEditForm(untilLectureHtml)

    expect(form).toMatchObject({
      id: 9572,
      title: '웹 성능 특강',
      reportCd: 'MRC020',
      receiptType: 'UNTIL_LECTURE',
      bgndeDate: '2026-04-01',
      bgndeTime: '00:00',
      enddeDate: '2026-04-11',
      enddeTime: '14:00',
      eventDt: '2026-04-11',
      eventStime: '14:00',
      eventEtime: '15:30',
      applyCnt: 20,
      place: '온라인(Webex)',
    })
  })

  it('preserves the DIRECT receipt window so partial updates do not silently switch to UNTIL_LECTURE defaults', () => {
    const form = parseMentoringEditForm(directHtml)

    expect(form.receiptType).toBe('DIRECT')
    expect(form.bgndeDate).toBe('2026-11-01')
    expect(form.bgndeTime).toBe('09:00')
    expect(form.enddeDate).toBe('2026-12-20')
    expect(form.enddeTime).toBe('18:00')
  })

  it('falls back to the INITIAL_DATA JS block when the server omits option[selected] on time selects', () => {
    const html = `
      <form id="board">
        <input type="hidden" name="qustnrSn" value="10552" />
        <input type="radio" name="reportCd" value="MRC020" checked />
        <input type="text" name="qustnrSj" value="리뷰 검증" />
        <input type="text" name="bgndeDate" value="2026-11-01" />
        <select id="bgndeTime" name="bgndeTime"></select>
        <input type="text" name="enddeDate" value="2026-12-20" />
        <select id="enddeTime" name="enddeTime"></select>
        <input type="text" name="eventDt" value="2026-12-30" />
        <select id="eventStime" name="eventStime"></select>
        <select id="eventEtime" name="eventEtime"></select>
        <input type="text" name="applyCnt" value="10" />
        <select name="place"><option value="온라인(Webex)" selected>온라인(Webex)</option></select>
      </form>
      <script>
      var INITIAL_DATA = {
        bgndeDate: '2026-11-01',
        bgndeTime: '09:00',
        enddeDate: '2026-12-20',
        enddeTime: '18:00',
        eventDt: '2026-12-30',
        eventStime: '19:00',
        eventEtime: '20:00',
        receiptType: 'DIRECT'
      };
      </script>
    `

    const form = parseMentoringEditForm(html)

    expect(form).toMatchObject({
      receiptType: 'DIRECT',
      bgndeDate: '2026-11-01',
      bgndeTime: '09:00',
      enddeDate: '2026-12-20',
      enddeTime: '18:00',
      eventStime: '19:00',
      eventEtime: '20:00',
    })
  })

  it('uses the provided id argument when the form has no qustnrSn hidden input', () => {
    const html = `<form id="board">
      <input type="radio" name="reportCd" value="MRC010" checked />
      <input type="radio" name="receiptType" value="UNTIL_LECTURE" checked />
      <input type="text" name="qustnrSj" value="" />
      <input type="text" name="bgndeDate" value="2026-04-01" />
      <select name="bgndeTime"><option value="00:00" selected>00시</option></select>
      <input type="text" name="enddeDate" value="2026-04-01" />
      <select name="enddeTime"><option value="10:00" selected>10시</option></select>
      <input type="text" name="eventDt" value="2026-04-01" />
      <select name="eventStime"><option value="10:00" selected>10시</option></select>
      <select name="eventEtime"><option value="11:00" selected>11시</option></select>
      <input type="text" name="applyCnt" value="3" />
      <select name="place"><option value="온라인(Webex)" selected>온라인(Webex)</option></select>
    </form>`

    expect(parseMentoringEditForm(html, 77).id).toBe(77)
  })
})
