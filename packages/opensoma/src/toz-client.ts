import {
  assertDurationInRange,
  buildBranchIdsParam,
  buildStartTimeParam,
  formatDuration,
  formatPhone,
  parseEmail,
  parsePhone,
} from './shared/utils/toz'
import {
  isReservationConfirmSuccess,
  parseBookingPageBranches,
  parseBookingPageMeetings,
  parseMypageReservations,
  parseTozBoothes,
  parseTozDurations,
  parseTozReserved,
} from './toz-formatters'
import { TozHttp, type TozHttpOptions } from './toz-http'
import type { TozBooth, TozBranch, TozDuration, TozMeeting, TozReservation, TozReserved } from './types'

export interface TozAvailabilityQuery {
  date: string
  startTime: string
  durationMinutes: number
  userCount: number
  branchIds: readonly number[]
}

export interface TozCheckQuery {
  date: string
  startTimes: readonly string[]
  durationMinutes: number
  userCount: number
  branchIds: readonly number[]
}

export interface TozCheckResult {
  startTime: string
  booths: TozBooth[]
  error?: string
}

export interface TozReserveBoothArgs {
  date: string
  startTime: string
  durationMinutes: number
  userCount: number
  boothId: number
}

export interface TozConfirmArgs {
  reservationId: string
  date: string
  startTime: string
  durationMinutes: number
  name: string
  phone: string
  email: string
  pinNum: string
  meetingId?: number
  newMeetingName?: string
  memo?: string
}

export interface TozSearchArgs {
  name: string
  phone: string
  startDate?: string
  endDate?: string
  meetingName?: string
}

export interface TozCancelArgs {
  reservationId: number
  name: string
  phone: string
}

export class TozClient {
  readonly http: TozHttp

  constructor(options: TozHttpOptions = {}) {
    this.http = new TozHttp(options)
  }

  async branches(): Promise<TozBranch[]> {
    await this.http.bootstrap()
    return parseBookingPageBranches(await this.http.get('/booking.htm'))
  }

  async meetings(): Promise<TozMeeting[]> {
    await this.http.bootstrap()
    return parseBookingPageMeetings(await this.http.get('/booking.htm'))
  }

  async durations(date: string, startTime: string): Promise<TozDuration[]> {
    await this.http.bootstrap()
    const param = buildStartTimeParam(startTime)
    const json = await this.http.postJson<unknown>('/ajaxCheckDurationTime.htm', {
      basedate: date,
      hour: param.slice(0, 2),
      minute: param.slice(2, 4),
    })
    return parseTozDurations(json)
  }

  async available(query: TozAvailabilityQuery): Promise<TozBooth[]> {
    assertDurationInRange(query.durationMinutes)
    await this.http.bootstrap()
    const json = await this.http.postJson<unknown>('/ajaxGetEnableBoothes.htm', {
      basedate: query.date,
      starttime: buildStartTimeParam(query.startTime),
      durationTime: formatDuration(query.durationMinutes),
      userCount: String(query.userCount),
      branchIds: buildBranchIdsParam(query.branchIds),
    })
    return parseTozBoothes(json)
  }

  async check(query: TozCheckQuery): Promise<TozCheckResult[]> {
    if (query.startTimes.length === 0) {
      throw new Error('toz check requires at least one --time. For a single slot, use `toz available` instead.')
    }
    if (query.startTimes.length > 6) {
      throw new Error(
        'Too many times (max 6 per invocation). Consider `toz available` for a single slot, or split into multiple invocations.',
      )
    }
    assertDurationInRange(query.durationMinutes)
    await this.http.bootstrap()

    const results: TozCheckResult[] = []
    for (const startTime of query.startTimes) {
      try {
        const booths = await this.available({
          date: query.date,
          startTime,
          durationMinutes: query.durationMinutes,
          userCount: query.userCount,
          branchIds: query.branchIds,
        })
        results.push({ startTime, booths })
      } catch (error) {
        results.push({
          startTime,
          booths: [],
          error: error instanceof Error ? error.message : String(error),
        })
      }
      await sleep(500)
    }
    return results
  }

  async reserveBooth(args: TozReserveBoothArgs): Promise<TozReserved> {
    assertDurationInRange(args.durationMinutes)
    await this.http.bootstrap()
    const json = await this.http.postJson<unknown>('/ajaxReservationBooth.htm', {
      basedate: args.date,
      starttime: buildStartTimeParam(args.startTime),
      durationTime: formatDuration(args.durationMinutes),
      userCount: String(args.userCount),
      booth_id: String(args.boothId),
    })
    const reserved = parseTozReserved(json)
    if (reserved.isLargeBooth) {
      throw new Error('대형부스 예약은 선입금 약관 동의가 필요합니다. v1에서는 지원하지 않습니다 (small booths only).')
    }
    return reserved
  }

  async skipEquipment(args: {
    reservationId: string
    date: string
    startTime: string
    durationMinutes: number
  }): Promise<void> {
    await this.http.postText('/ajaxReservationEquipment.htm', {
      reservationId: args.reservationId,
      basedate: args.date,
      starttime: buildStartTimeParam(args.startTime),
      durationTime: formatDuration(args.durationMinutes),
      equipmentNotebookChecked: 'false',
      equipmentProjectorChecked: 'false',
      equipmentMonitorChecked: 'false',
      equipmentPlayerChecked: 'false',
      equipmentSpeakerChecked: 'false',
      equipmentNotebookCnt: '0',
      equipmentProjectorCnt: '0',
      equipmentMonitorCnt: '0',
      equipmentPlayerCnt: '0',
      equipmentSpeakerCnt: '0',
    })
  }

  async sendOtp(phone: string): Promise<void> {
    const parts = parsePhone(phone)
    const result = await this.http.postText('/ajaxHpVerify.htm', { ...parts })
    if (result !== 'SUCCESS') {
      throw new Error(`OTP 발송 실패: ${result}`)
    }
  }

  async confirm(args: TozConfirmArgs): Promise<{ resultMsg: string; isLargeBooth: boolean }> {
    if (!args.meetingId && !args.newMeetingName) {
      throw new Error('meetingId 또는 newMeetingName 중 하나는 필수입니다.')
    }
    const phoneParts = parsePhone(args.phone)
    const emailParts = parseEmail(args.email)

    const json = await this.http.postJson<{ resultMsg?: string; message3?: string | null }>(
      '/ajaxReservationConfirm.htm',
      {
        reservationId: args.reservationId,
        phone: formatPhone(phoneParts),
        ...phoneParts,
        name: args.name,
        pinNum: args.pinNum,
        ...emailParts,
        meeting_id: args.meetingId ? String(args.meetingId) : '새모임',
        newMeetingName: args.newMeetingName ?? '',
        prepareMemo: args.memo ?? '',
        projectSeq: '',
        tozApplyType: '',
        addedInfo: '',
        attendType: '',
        isMobile: 'false',
      },
    )

    const resultMsg = json.resultMsg ?? ''
    if (!isReservationConfirmSuccess(resultMsg)) {
      throw new Error(resultMsg || '예약 확정에 실패했습니다.')
    }
    return { resultMsg, isLargeBooth: resultMsg.includes('대형부스') }
  }

  async destroyHold(): Promise<void> {
    await this.http.postText('/ajaxDestroyReservation.htm', {})
  }

  async myReservations(args: TozSearchArgs): Promise<TozReservation[]> {
    await this.http.bootstrap()
    await this.mypageLogin(args.name, args.phone)

    const html = await this.http.post('/mypage.htm', {
      opage: '1',
      rpage: '1',
      key: '',
      projectSeq: '',
      tozApplyType: '',
      addedInfo: '',
      startdate: args.startDate ?? '',
      enddate: args.endDate ?? '',
      meetingName: args.meetingName ?? '',
    })
    return parseMypageReservations(html)
  }

  async cancel(args: TozCancelArgs): Promise<void> {
    await this.http.bootstrap()
    await this.mypageLogin(args.name, args.phone)

    const result = await this.http.postText('/ajaxCancelReservation.htm', {
      reservation_id: String(args.reservationId),
    })
    if (result !== 'SUCCESS') {
      if (result === 'FAILED') throw new Error('취소하지 못했습니다.')
      throw new Error(result || '취소하지 못했습니다.')
    }
  }

  private async mypageLogin(name: string, phone: string): Promise<void> {
    const parts = parsePhone(phone)
    await this.http.post('/mypage_login_.htm', {
      key: '',
      projectSeq: '',
      tozApplyType: '',
      addedInfo: '',
      email: '',
      name,
      ...parts,
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
