import { describe, expect, it } from 'bun:test'

import { VENUES } from '../../constants'
import {
  buildMentoringPayload,
  buildReportPayload,
  buildRoomCancelPayload,
  buildRoomReservationPayload,
  buildRoomUpdatePayload,
  buildUpdateMentoringPayload,
  resolveReportFileUrl,
  resolveReportProgressPlace,
  resolveVenue,
  toReportTypeCd,
  validateAttendeeCount,
} from './swmaestro'

const baseExisting = {
  rentId: 18718,
  itemId: 17,
  title: '멘토링',
  date: '2026-05-31',
  startTime: '21:00',
  endTime: '21:30',
  attendees: 4,
  notes: '',
  statusCode: 'RS001',
}

describe('resolveVenue', () => {
  it('prepends "토즈-" to bare TOZ location names', () => {
    expect(resolveVenue('광화문점')).toBe('토즈-광화문점')
    expect(resolveVenue('양재점')).toBe('토즈-양재점')
    expect(resolveVenue('강남컨퍼런스센터점')).toBe('토즈-강남컨퍼런스센터점')
    expect(resolveVenue('강남역토즈타워점')).toBe('토즈-강남역토즈타워점')
    expect(resolveVenue('선릉점')).toBe('토즈-선릉점')
  })

  it('preserves trailing spaces that native ships for 건대/역삼/홍대 <option> values', () => {
    expect(resolveVenue('건대점')).toBe('토즈-건대점 ')
    expect(resolveVenue('역삼점')).toBe('토즈-역삼점 ')
    expect(resolveVenue('홍대점')).toBe('토즈-홍대점 ')
    expect(resolveVenue('토즈-건대점')).toBe('토즈-건대점 ')
    expect(resolveVenue('토즈-역삼점')).toBe('토즈-역삼점 ')
    expect(resolveVenue('토즈-홍대점')).toBe('토즈-홍대점 ')
  })

  it('passes through TOZ locations that already have the prefix', () => {
    expect(resolveVenue('토즈-광화문점')).toBe('토즈-광화문점')
    expect(resolveVenue('토즈-강남역토즈타워점')).toBe('토즈-강남역토즈타워점')
  })

  it('resolves "신촌비즈니스센터점" to "연수센터-7"', () => {
    expect(resolveVenue('신촌비즈니스센터점')).toBe('연수센터-7')
    expect(resolveVenue('토즈-신촌비즈니스센터점')).toBe('연수센터-7')
  })

  it('passes through non-TOZ venues unchanged', () => {
    expect(resolveVenue('온라인(Webex)')).toBe('온라인(Webex)')
    expect(resolveVenue('스페이스 A1')).toBe('스페이스 A1')
    expect(resolveVenue('스페이스 M1')).toBe('스페이스 M1')
    expect(resolveVenue('스페이스 S')).toBe('스페이스 S')
    expect(resolveVenue('(엑스퍼트) 연수센터_라운지')).toBe('(엑스퍼트) 연수센터_라운지')
    expect(resolveVenue('(엑스퍼트) 외부_카페')).toBe('(엑스퍼트) 외부_카페')
  })

  it('trims surrounding whitespace from the input', () => {
    expect(resolveVenue('  강남역토즈타워점  ')).toBe('토즈-강남역토즈타워점')
    expect(resolveVenue(' 스페이스 A1 ')).toBe('스페이스 A1')
  })

  it('passes through unknown venues unchanged', () => {
    expect(resolveVenue('기타 장소')).toBe('기타 장소')
  })
})

describe('buildRoomReservationPayload', () => {
  it('sets rentEndde using the native lastSlot.minute+29 formula so tooltips render :59 like swmaestro.ai', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['13:00', '13:30'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 13:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 13:59:00')
    expect(payload['time[0]']).toBe('13:00')
    expect(payload['time[1]']).toBe('13:30')
    expect(payload['time[2]']).toBeUndefined()
    expect(payload['chkData_1']).toBe('2026-04-20|13:00|17')
    expect(payload['chkData_2']).toBe('2026-04-20|13:30|17')
    expect(payload['chkData_3']).toBeUndefined()
  })

  it('emits :29 for a single :00 slot so the tooltip mirrors native behavior', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['13:00'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 13:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 13:29:00')
    expect(payload['time[0]']).toBe('13:00')
    expect(payload['time[1]']).toBeUndefined()
  })

  it('handles a reservation ending at the last available slot', () => {
    const payload = buildRoomReservationPayload({
      roomId: 17,
      date: '2026-04-20',
      slots: ['23:00', '23:30'],
      title: '회의',
    })

    expect(payload.rentBgnde).toBe('2026-04-20 23:00:00')
    expect(payload.rentEndde).toBe('2026-04-20 23:59:00')
  })

  it('rejects non-consecutive slots', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: ['13:00', '14:00'],
        title: '회의',
      }),
    ).toThrow('Time slots must be consecutive')
  })

  it('rejects invalid time slots', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: ['25:00'],
        title: '회의',
      }),
    ).toThrow('Invalid time slot')
  })

  it('rejects empty slot lists', () => {
    expect(() =>
      buildRoomReservationPayload({
        roomId: 17,
        date: '2026-04-20',
        slots: [],
        title: '회의',
      }),
    ).toThrow('At least one time slot is required')
  })
})

describe('buildRoomUpdatePayload', () => {
  it('serialises the existing reservation unchanged when no overrides are supplied', () => {
    const payload = buildRoomUpdatePayload(baseExisting)

    expect(payload).toEqual({
      menuNo: '200058',
      rentId: '18718',
      itemId: '17',
      receiptStatCd: 'RS001',
      title: '멘토링',
      rentDt: '2026-05-31',
      rentBgnde: '2026-05-31 21:00:00',
      rentEndde: '2026-05-31 21:30:00',
      infoCn: '',
      rentNum: '4',
      pageQueryString: '',
    })
  })

  it('applies title, attendees, and notes overrides while keeping the schedule fields', () => {
    const payload = buildRoomUpdatePayload(baseExisting, {
      title: '스터디',
      attendees: 6,
      notes: '리뷰 세션',
    })

    expect(payload.title).toBe('스터디')
    expect(payload.rentNum).toBe('6')
    expect(payload.infoCn).toBe('리뷰 세션')
    expect(payload.rentBgnde).toBe('2026-05-31 21:00:00')
    expect(payload.rentEndde).toBe('2026-05-31 21:30:00')
    expect(payload['time[0]']).toBeUndefined()
  })

  it('rewrites schedule fields and re-emits time/chkData entries when slots change', () => {
    const payload = buildRoomUpdatePayload(baseExisting, {
      slots: ['22:00', '22:30', '23:00'],
    })

    expect(payload.rentBgnde).toBe('2026-05-31 22:00:00')
    expect(payload.rentEndde).toBe('2026-05-31 23:29:00')
    expect(payload['time[0]']).toBe('22:00')
    expect(payload['time[1]']).toBe('22:30')
    expect(payload['time[2]']).toBe('23:00')
    expect(payload['chkData_1']).toBe('2026-05-31|22:00|17')
    expect(payload['chkData_3']).toBe('2026-05-31|23:00|17')
  })

  it('uses the new roomId and date when both schedule overrides are provided', () => {
    const payload = buildRoomUpdatePayload(baseExisting, {
      roomId: 22,
      date: '2026-06-01',
      slots: ['10:00', '10:30'],
    })

    expect(payload.itemId).toBe('22')
    expect(payload.rentDt).toBe('2026-06-01')
    expect(payload.rentBgnde).toBe('2026-06-01 10:00:00')
    expect(payload.rentEndde).toBe('2026-06-01 10:59:00')
    expect(payload['chkData_1']).toBe('2026-06-01|10:00|22')
  })

  it('rejects invalid slot overrides', () => {
    expect(() => buildRoomUpdatePayload(baseExisting, { slots: ['22:00', '23:00'] })).toThrow(
      'Time slots must be consecutive',
    )
  })

  it('preserves the existing status code so confirmed reservations stay confirmed', () => {
    const payload = buildRoomUpdatePayload({ ...baseExisting, statusCode: 'RS001' }, { title: '수정본' })
    expect(payload.receiptStatCd).toBe('RS001')
  })
})

describe('buildRoomCancelPayload', () => {
  it('flips receiptStatCd to RS002 while keeping every other field identical to the existing reservation', () => {
    const payload = buildRoomCancelPayload(baseExisting)

    expect(payload.receiptStatCd).toBe('RS002')
    expect(payload.rentId).toBe('18718')
    expect(payload.title).toBe('멘토링')
    expect(payload.rentBgnde).toBe('2026-05-31 21:00:00')
    expect(payload.rentEndde).toBe('2026-05-31 21:30:00')
    expect(payload.rentNum).toBe('4')
  })
})

const baseMentoring = {
  title: '스터디',
  type: 'public' as const,
  date: '2026-05-10',
  startTime: '14:00',
  endTime: '15:00',
  venue: '스페이스 A1',
}

function seoulDateTimeParts(date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((values, part) => {
      if (
        part.type === 'year' ||
        part.type === 'month' ||
        part.type === 'day' ||
        part.type === 'hour' ||
        part.type === 'minute'
      ) {
        return { ...values, [part.type]: part.value }
      }
      return values
    }, {})

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

describe('buildMentoringPayload', () => {
  it('defaults the registration start to the creation request time for future mentoring', () => {
    const before = seoulDateTimeParts()
    const payload = buildMentoringPayload({ ...baseMentoring, date: '2999-05-10' })
    const after = seoulDateTimeParts()

    expect([`${before.date} ${before.time}`, `${after.date} ${after.time}`]).toContain(
      `${payload.bgndeDate} ${payload.bgndeTime}`,
    )
    expect('bgnde' in payload).toBe(false)
    expect('endde' in payload).toBe(false)
  })

  it('keeps the mentoring date fallback for non-future sessions', () => {
    const payload = buildMentoringPayload({ ...baseMentoring, date: '2000-05-10' })

    expect(payload.bgndeDate).toBe('2000-05-10')
    expect(payload.bgndeTime).toBe('00:00')
  })

  it('defaults receiptType to UNTIL_LECTURE and aligns enddeDate/enddeTime with the lecture start', () => {
    const payload = buildMentoringPayload(baseMentoring)

    expect(payload.receiptType).toBe('UNTIL_LECTURE')
    expect(payload.enddeDate).toBe('2026-05-10')
    expect(payload.enddeTime).toBe('14:00')
  })

  it('uses the user-supplied registration end window when receiptType is DIRECT', () => {
    const payload = buildMentoringPayload({
      ...baseMentoring,
      receiptType: 'DIRECT',
      regStart: '2026-05-01',
      regStartTime: '09:00',
      regEnd: '2026-05-09',
      regEndTime: '18:00',
    })

    expect(payload.receiptType).toBe('DIRECT')
    expect(payload.bgndeDate).toBe('2026-05-01')
    expect(payload.bgndeTime).toBe('09:00')
    expect(payload.enddeDate).toBe('2026-05-09')
    expect(payload.enddeTime).toBe('18:00')
  })

  it('sends the stateCd and qustnrAt values the current form posts', () => {
    const payload = buildMentoringPayload(baseMentoring)

    expect(payload.stateCd).toBe('A')
    expect(payload.qustnrAt).toBe('N')
    expect(payload.openAt).toBe('Y')
  })

  it('maps public/lecture types to MRC010/MRC020 and validates the default attendee count', () => {
    expect(buildMentoringPayload({ ...baseMentoring, type: 'public' }).reportCd).toBe('MRC010')
    expect(buildMentoringPayload({ ...baseMentoring, type: 'public' }).applyCnt).toBe('3')
    expect(buildMentoringPayload({ ...baseMentoring, type: 'lecture' }).reportCd).toBe('MRC020')
    expect(buildMentoringPayload({ ...baseMentoring, type: 'lecture' }).applyCnt).toBe('6')
  })

  it('rejects attendee counts that violate the form rules', () => {
    expect(() => buildMentoringPayload({ ...baseMentoring, maxAttendees: 1 })).toThrow(
      '자유 멘토링은 2명 이상 5명 이하로 설정해야 합니다.',
    )
    expect(() => buildMentoringPayload({ ...baseMentoring, maxAttendees: 6 })).toThrow(
      '자유 멘토링은 2명 이상 5명 이하로 설정해야 합니다.',
    )
    expect(() => buildMentoringPayload({ ...baseMentoring, type: 'lecture', maxAttendees: 4 })).toThrow(
      '멘토 특강은 6명 이상으로 설정해야 합니다.',
    )
  })

  it('passes through the venue resolver so TOZ aliases are normalised', () => {
    expect(buildMentoringPayload({ ...baseMentoring, venue: '광화문점' }).place).toBe('토즈-광화문점')
  })

  it('mirrors native checkForm() by replacing double quotes in qustnrSj with single quotes', () => {
    const payload = buildMentoringPayload({ ...baseMentoring, title: '"테스트" 멘토링' })

    expect(payload.qustnrSj).toBe("'테스트' 멘토링")
  })

  it('mirrors the native DEXT5 empty-body placeholder when content is missing', () => {
    const nativeEmpty =
      '<p style="font-family: 굴림; font-size: 12pt; line-height: 1.2; margin-top: 0px; margin-bottom: 0px;">&nbsp;</p>'

    expect(buildMentoringPayload(baseMentoring).qestnarCn).toBe(nativeEmpty)
    expect(buildMentoringPayload({ ...baseMentoring, content: '' }).qestnarCn).toBe(nativeEmpty)
    expect(buildMentoringPayload({ ...baseMentoring, content: '   \n  ' }).qestnarCn).toBe(nativeEmpty)
  })

  it('passes through rich HTML from the editor unchanged', () => {
    const payload = buildMentoringPayload({ ...baseMentoring, content: '<p>세션 본문</p>' })

    expect(payload.qestnarCn).toBe('<p>세션 본문</p>')
  })
})

describe('buildUpdateMentoringPayload', () => {
  it('injects the target qustnrSn while preserving the supplied registration start', () => {
    const payload = buildUpdateMentoringPayload(9999, { ...baseMentoring, regStart: '2026-05-10' })

    expect(payload.qustnrSn).toBe('9999')
    expect(payload.bgndeDate).toBe('2026-05-10')
    expect(payload.receiptType).toBe('UNTIL_LECTURE')
    expect(payload.stateCd).toBe('A')
  })
})

describe('validateAttendeeCount', () => {
  it('accepts public counts within 2-5 and lecture counts of 6 or more', () => {
    expect(() => validateAttendeeCount('public', 2)).not.toThrow()
    expect(() => validateAttendeeCount('public', 5)).not.toThrow()
    expect(() => validateAttendeeCount('lecture', 6)).not.toThrow()
    expect(() => validateAttendeeCount('lecture', 100)).not.toThrow()
  })

  it('rejects counts outside the server-enforced bounds', () => {
    expect(() => validateAttendeeCount('public', 1)).toThrow()
    expect(() => validateAttendeeCount('public', 6)).toThrow()
    expect(() => validateAttendeeCount('lecture', 5)).toThrow()
  })
})

describe('buildReportPayload', () => {
  it('builds regular mentoring report payloads with the confirmed team name', () => {
    const payload = buildReportPayload({
      menteeRegion: 'S',
      reportType: 'MRC990',
      progressDate: '2026-06-04',
      teamNames: 'Team Alpha',
      venue: '스페이스 A1',
      attendanceCount: 2,
      attendanceNames: 'Trainee One, Trainee Two',
      progressStartTime: '10:00',
      progressEndTime: '12:00',
      subject: '정규 멘토링 보고 주제',
      content:
        '정규 멘토링에서 담당 팀 연수생과 진행한 내용을 충분히 기록합니다. 팀명을 모르는 경우에도 서버가 받는 빈 팀명 값으로 보고서를 작성할 수 있어야 합니다.',
    })

    expect(payload.reportGubunCd).toBe('MRC990')
    expect(payload.teamNms).toBe('Team Alpha')
    expect(payload.nttSj).toBe('[정규 멘토링] 2026년 06월 04일 멘토링 보고')
  })

  it('rejects regular mentoring report payloads without a team name', () => {
    expect(() =>
      buildReportPayload({
        menteeRegion: 'S',
        reportType: 'MRC990',
        progressDate: '2026-06-04',
        teamNames: '   ',
        venue: '스페이스 A1',
        attendanceCount: 2,
        attendanceNames: 'Trainee One, Trainee Two',
        progressStartTime: '10:00',
        progressEndTime: '12:00',
        subject: '정규 멘토링 보고 주제',
        content:
          '정규 멘토링에서 담당 팀 연수생과 진행한 내용을 충분히 기록합니다. 팀명은 사용자에게 확인한 담당 팀을 사용해야 합니다.',
      }),
    ).toThrow('--team <names> is required for MRC990 reports.')
  })

  it('maps parsed regular mentoring labels back to MRC990 for updates', () => {
    expect(toReportTypeCd('정규 멘토링')).toBe('MRC990')
    expect(toReportTypeCd('MRC990')).toBe('MRC990')
  })

  it('sends Busan progressPlace as the CD_* code the native form expects', () => {
    const payload = buildReportPayload({
      menteeRegion: 'B',
      reportType: 'MRC010',
      progressDate: '2026-06-05',
      teamNames: 'Team Alpha',
      venue: '온라인(Webex)',
      attendanceCount: 3,
      attendanceNames: 'Trainee One, Trainee Two, Trainee Three',
      progressStartTime: '21:00',
      progressEndTime: '22:00',
      subject: '부산 자유 멘토링 보고 주제',
      content:
        '부산 팀과 진행한 자유 멘토링 내용을 충분히 기록합니다. 온라인 진행 장소가 서버에 정상 반영되도록 진행 장소 코드를 전송해야 합니다.',
    })

    expect(payload.progressPlace).toBe('CD_25')
  })

  it('sends Seoul progressPlace as the display name verbatim', () => {
    const payload = buildReportPayload({
      menteeRegion: 'S',
      reportType: 'MRC010',
      progressDate: '2026-06-05',
      teamNames: 'Team Alpha',
      venue: '스페이스 A7',
      attendanceCount: 2,
      attendanceNames: 'Trainee One, Trainee Two',
      progressStartTime: '10:00',
      progressEndTime: '11:00',
      subject: '서울 자유 멘토링 보고 주제',
      content:
        '서울 팀과 진행한 자유 멘토링 내용을 충분히 기록합니다. 오프라인 진행 장소가 서버에 정상 반영되도록 표시 이름을 그대로 전송해야 합니다.',
    })

    expect(payload.progressPlace).toBe('스페이스 A7')
  })
})

describe('resolveReportProgressPlace', () => {
  it('maps Busan venues to their CD_* codes by display name or bare code', () => {
    expect(resolveReportProgressPlace('온라인(Webex)', 'B')).toBe('CD_25')
    expect(resolveReportProgressPlace('온라인', 'B')).toBe('CD_25')
    expect(resolveReportProgressPlace('하이텐 - 21호실(6인)', 'B')).toBe('CD_1')
    expect(resolveReportProgressPlace('CD_25', 'B')).toBe('CD_25')
  })

  it('maps the canonical EXPERT_CAFE venue label to the Busan code', () => {
    expect(resolveReportProgressPlace(VENUES.EXPERT_CAFE, 'B')).toBe('CD_9')
    expect(resolveReportProgressPlace('(엑스퍼트) 외부 공간', 'B')).toBe('CD_9')
  })

  it('passes Busan venues with no known mapping through unchanged', () => {
    expect(resolveReportProgressPlace('스페이스 A7', 'B')).toBe('스페이스 A7')
  })

  it('keeps Seoul venues as display names', () => {
    expect(resolveReportProgressPlace('온라인(Webex)', 'S')).toBe('온라인(Webex)')
    expect(resolveReportProgressPlace('스페이스 A7', 'S')).toBe('스페이스 A7')
  })
})

describe('resolveReportFileUrl', () => {
  const files = ['https://www.swmaestro.ai/sw/file/1', 'https://www.swmaestro.ai/sw/file/2']

  it('returns the first file by default', () => {
    expect(resolveReportFileUrl(files, 42)).toBe('https://www.swmaestro.ai/sw/file/1')
  })

  it('returns the requested 1-based file index', () => {
    expect(resolveReportFileUrl(files, 42, 2)).toBe('https://www.swmaestro.ai/sw/file/2')
    expect(resolveReportFileUrl(files, 42, '2')).toBe('https://www.swmaestro.ai/sw/file/2')
  })

  it('throws when the report has no files', () => {
    expect(() => resolveReportFileUrl([], 42)).toThrow('Report 42 has no attached files.')
  })

  it('throws when the index is out of range', () => {
    expect(() => resolveReportFileUrl(files, 42, 5)).toThrow(
      '--file-index 5 is out of range. Report 42 has 2 attached file(s).',
    )
  })

  it('rejects a decimal file index instead of silently truncating it', () => {
    expect(() => resolveReportFileUrl(files, 42, '1.5')).toThrow('--file-index must be a positive integer')
  })

  it('rejects a non-numeric or trailing-garbage file index', () => {
    expect(() => resolveReportFileUrl(files, 42, '2abc')).toThrow('--file-index must be a positive integer')
    expect(() => resolveReportFileUrl(files, 42, 'abc')).toThrow('--file-index must be a positive integer')
  })

  it('rejects zero and negative indexes', () => {
    expect(() => resolveReportFileUrl(files, 42, '0')).toThrow('--file-index must be a positive integer')
    expect(() => resolveReportFileUrl(files, 42, -1)).toThrow('--file-index must be a positive integer')
  })
})
