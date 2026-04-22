import { readFile } from 'node:fs/promises'

import { MENU_NO } from './constants'
import { CredentialManager } from './credential-manager'
import { AuthenticationError } from './errors'
import * as formatters from './formatters'
import { SomaHttp, type UserIdentity } from './http'
import { buildMentoringListParams, type MentoringSearchQuery } from './shared/utils/mentoring-params'
import {
  buildApplicationPayload,
  buildCancelApplicationPayload,
  buildDeleteMentoringPayload,
  buildMentoringPayload,
  buildReportPayload,
  buildRoomCancelPayload,
  buildRoomReservationPayload,
  buildRoomUpdatePayload,
  buildUpdateMentoringPayload,
  parseEventDetail,
  resolveRoomId,
  toMentoringType,
  toRegionCode,
  toReportTypeCd,
} from './shared/utils/swmaestro'
import type {
  ApplicationHistoryItem,
  ApprovalListItem,
  Dashboard,
  EventListItem,
  MemberInfo,
  MentoringDetail,
  MentoringListItem,
  MentoringUpdateOptions,
  NoticeDetail,
  NoticeListItem,
  Pagination,
  ReportCreateOptions,
  ReportDetail,
  ReportListItem,
  ReportUpdateOptions,
  RoomCard,
  RoomReservationDetail,
  RoomReservationListItem,
  RoomReservationStatus,
  RoomUpdateOptions,
  ScheduleListItem,
  TeamInfo,
} from './types'

export interface SomaClientOptions {
  sessionCookie?: string
  csrfToken?: string
  username?: string
  password?: string
  verbose?: boolean
  /** @internal */
  http?: SomaHttp
}

export class SomaClient {
  private readonly http: SomaHttp
  private readonly options: SomaClientOptions
  private loginCredentials: { username: string; password: string } | null
  // Single-flight guard: SWMaestro kills a session if it sees parallel logins for it.
  private reloginInFlight: Promise<void> | null = null

  readonly mentoring: {
    list(options?: {
      status?: string
      type?: string
      search?: MentoringSearchQuery
      page?: number
    }): Promise<{ items: MentoringListItem[]; pagination: Pagination }>
    get(id: number): Promise<MentoringDetail>
    create(params: {
      title: string
      type: 'public' | 'lecture'
      date: string
      startTime: string
      endTime: string
      venue: string
      maxAttendees?: number
      regStart?: string
      regEnd?: string
      content?: string
    }): Promise<void>
    update(id: number, params: MentoringUpdateOptions): Promise<void>
    delete(id: number): Promise<void>
    apply(id: number): Promise<void>
    cancel(params: { applySn: number; qustnrSn: number }): Promise<void>
    history(options?: { page?: number }): Promise<{ items: ApplicationHistoryItem[]; pagination: Pagination }>
  }

  readonly room: {
    list(options?: { date?: string; room?: string; includeReservations?: boolean }): Promise<RoomCard[]>
    available(roomId: number, date: string): Promise<RoomCard['timeSlots']>
    reserve(params: {
      roomId: number
      date: string
      slots: string[]
      title: string
      attendees?: number
      notes?: string
    }): Promise<void>
    get(rentId: number): Promise<RoomReservationDetail>
    update(rentId: number, params?: RoomUpdateOptions): Promise<void>
    cancel(rentId: number): Promise<void>
    reservations(options?: {
      status?: Exclude<RoomReservationStatus, 'unknown'> | 'all'
      startDate?: string
      endDate?: string
      page?: number
    }): Promise<{ items: RoomReservationListItem[]; pagination: Pagination }>
  }

  readonly dashboard: {
    get(): Promise<Dashboard>
  }

  readonly notice: {
    list(options?: { page?: number }): Promise<{ items: NoticeListItem[]; pagination: Pagination }>
    get(id: number): Promise<NoticeDetail>
  }

  readonly report: {
    list(options?: {
      page?: number
      searchField?: string
      searchKeyword?: string
    }): Promise<{ items: ReportListItem[]; pagination: Pagination }>
    get(id: number): Promise<ReportDetail>
    create(options: ReportCreateOptions, files: Array<{ buffer: Buffer; name: string }>): Promise<void>
    update(
      id: number,
      options: Omit<ReportUpdateOptions, 'id'>,
      file?: Buffer | string,
      fileName?: string,
    ): Promise<void>
    approval(options?: {
      page?: number
      month?: string
      reportType?: string
    }): Promise<{ items: ApprovalListItem[]; pagination: Pagination }>
  }

  readonly team: {
    show(): Promise<TeamInfo>
  }

  readonly member: {
    show(): Promise<MemberInfo>
  }

  readonly event: {
    list(options?: { page?: number }): Promise<{ items: EventListItem[]; pagination: Pagination }>
    get(id: number): Promise<unknown>
    apply(id: number): Promise<void>
  }

  readonly schedule: {
    list(options?: { page?: number }): Promise<{ items: ScheduleListItem[]; pagination: Pagination }>
  }

  constructor(options: SomaClientOptions = {}) {
    this.options = options
    this.loginCredentials =
      options.username && options.password ? { username: options.username, password: options.password } : null
    this.http =
      options.http ??
      new SomaHttp({
        sessionCookie: options.sessionCookie,
        csrfToken: options.csrfToken,
        verbose: options.verbose,
      })

    this.mentoring = {
      list: async (options) => {
        await this.requireAuth()
        const user = options?.search?.me ? await this.resolveUser() : undefined
        const html = await this.http.get(
          '/mypage/mentoLec/list.do',
          buildMentoringListParams({
            status: options?.status,
            type: options?.type,
            page: options?.page,
            search: options?.search,
            user,
          }),
        )
        return {
          items: formatters.parseMentoringList(html),
          pagination: formatters.parsePagination(html),
        }
      },
      get: async (id) => {
        await this.requireAuth()
        return formatters.parseMentoringDetail(
          await this.http.get('/mypage/mentoLec/view.do', {
            menuNo: MENU_NO.MENTORING,
            qustnrSn: String(id),
          }),
          id,
        )
      },
      create: async (params) => {
        await this.requireAuth()
        const html = await this.http.postForm('/mypage/mentoLec/insert.do', buildMentoringPayload(params))
        if (this.containsErrorIndicator(html)) {
          throw new Error(this.extractErrorMessage(html) || '멘토링 등록에 실패했습니다.')
        }
      },
      update: async (id, params) => {
        await this.requireAuth()
        const existing = await this.mentoring.get(id)
        const merged = buildUpdateMentoringPayload(id, {
          title: params.title ?? existing.title,
          type: params.type ?? toMentoringType(existing.type),
          date: params.date ?? existing.sessionDate,
          startTime: params.startTime ?? existing.sessionTime.start,
          endTime: params.endTime ?? existing.sessionTime.end,
          venue: params.venue ?? existing.venue,
          maxAttendees: params.maxAttendees ?? existing.attendees.max,
          regStart: params.regStart ?? existing.registrationPeriod.start,
          regEnd: params.regEnd ?? existing.registrationPeriod.end,
          content: params.content ?? existing.content,
        })
        const html = await this.http.postForm('/mypage/mentoLec/update.do', merged)
        if (this.containsErrorIndicator(html)) {
          throw new Error(this.extractErrorMessage(html) || '멘토링 수정에 실패했습니다.')
        }
      },
      delete: async (id) => {
        await this.requireAuth()
        await this.http.post('/mypage/mentoLec/delete.do', buildDeleteMentoringPayload(id))
      },
      apply: async (id) => {
        await this.requireAuth()
        await this.http.post('/application/application/application.do', buildApplicationPayload(id))
      },
      cancel: async (params) => {
        await this.requireAuth()
        await this.http.post('/mypage/userAnswer/cancel.do', buildCancelApplicationPayload(params))
      },
      history: async (options) => {
        await this.requireAuth()
        const html = await this.http.get('/mypage/userAnswer/history.do', {
          menuNo: MENU_NO.APPLICATION_HISTORY,
          ...(options?.page ? { pageIndex: String(options.page) } : {}),
        })
        return {
          items: formatters.parseApplicationHistory(html),
          pagination: formatters.parsePagination(html),
        }
      },
    }

    this.room = {
      list: async (options) => {
        await this.requireAuth()
        const date = options?.date ?? new Date().toISOString().slice(0, 10)
        const rooms = formatters.parseRoomList(
          await this.http.post('/mypage/officeMng/list.do', {
            menuNo: MENU_NO.ROOM,
            sdate: date,
            searchItemId: options?.room ? String(resolveRoomId(options.room)) : '',
          }),
        )

        if (!options?.includeReservations) return rooms

        return Promise.all(
          rooms.map(async (room) => {
            try {
              const html = await this.http.post('/mypage/officeMng/rentTime.do', {
                viewType: 'CONTBODY',
                itemId: String(room.itemId),
                rentDt: date,
              })

              return {
                ...room,
                timeSlots: formatters.parseRoomSlots(html),
              }
            } catch {
              return room
            }
          }),
        )
      },
      available: async (roomId, date) => {
        await this.requireAuth()
        return formatters.parseRoomSlots(
          await this.http.post('/mypage/officeMng/rentTime.do', {
            viewType: 'CONTBODY',
            itemId: String(roomId),
            rentDt: date,
          }),
        )
      },
      reserve: async (params) => {
        await this.requireAuth()
        await this.http.post('/mypage/itemRent/insert.do', buildRoomReservationPayload(params))
      },
      get: async (rentId) => {
        await this.requireAuth()
        return formatters.parseRoomReservationDetail(
          await this.http.get('/mypage/itemRent/view.do', {
            menuNo: MENU_NO.ROOM,
            rentId: String(rentId),
          }),
        )
      },
      update: async (rentId, params = {}) => {
        await this.requireAuth()
        const existing = await this.room.get(rentId)
        await this.postRoomUpdate(buildRoomUpdatePayload(existing, params))
      },
      cancel: async (rentId) => {
        await this.requireAuth()
        const existing = await this.room.get(rentId)
        await this.postRoomUpdate(buildRoomCancelPayload(existing))
      },
      reservations: async (options) => {
        await this.requireAuth()
        const params: Record<string, string> = {
          menuNo: MENU_NO.ROOM,
          pageIndex: String(options?.page ?? 1),
        }
        if (options?.startDate) params.sdate = options.startDate
        if (options?.endDate) params.edate = options.endDate
        const status = options?.status ?? 'confirmed'
        if (status !== 'all') {
          params.searchStat = status === 'cancelled' ? 'RS002' : 'RS001'
        }
        const html = await this.http.get('/mypage/itemRent/list.do', params)
        return {
          items: formatters.parseRoomReservationList(html),
          pagination: formatters.parsePagination(html),
        }
      },
    }

    this.dashboard = {
      get: async () => {
        await this.requireAuth()
        const [dashboard, { items: myMentoring }] = await Promise.all([
          formatters.parseDashboard(await this.http.get('/mypage/myMain/dashboard.do', { menuNo: MENU_NO.DASHBOARD })),
          this.mentoring.list({ search: { field: 'author', value: '@me', me: true } }),
        ])
        dashboard.mentoringSessions = myMentoring.map((item) => ({
          title: item.title,
          url: `/mypage/mentoLec/view.do?qustnrSn=${item.id}`,
          status: item.status,
          date: item.sessionDate,
          time: item.sessionTime.start,
          timeEnd: item.sessionTime.end,
          type: item.type,
        }))
        return dashboard
      },
    }

    this.notice = {
      list: async (options) => {
        await this.requireAuth()
        const html = await this.http.get('/mypage/myNotice/list.do', {
          menuNo: MENU_NO.NOTICE,
          ...(options?.page ? { pageIndex: String(options.page) } : {}),
        })
        return {
          items: formatters.parseNoticeList(html),
          pagination: formatters.parsePagination(html),
        }
      },
      get: async (id) => {
        await this.requireAuth()
        return formatters.parseNoticeDetail(
          await this.http.get('/mypage/myNotice/view.do', {
            menuNo: MENU_NO.NOTICE,
            nttId: String(id),
          }),
          id,
        )
      },
    }

    this.report = {
      list: async (options) => {
        await this.requireAuth()
        const params: Record<string, string> = {
          menuNo: MENU_NO.REPORT,
          pageIndex: String(options?.page ?? 1),
        }
        if (options?.searchField !== undefined) params.searchCnd = options.searchField
        if (options?.searchKeyword) params.searchWrd = options.searchKeyword
        const html = await this.http.get('/mypage/mentoringReport/list.do', params)
        return {
          items: formatters.parseReportList(html),
          pagination: formatters.parsePagination(html),
        }
      },
      get: async (id) => {
        await this.requireAuth()
        const html = await this.http.get('/mypage/mentoringReport/view.do', {
          menuNo: MENU_NO.REPORT,
          reportId: String(id),
        })
        return formatters.parseReportDetail(html, id)
      },
      create: async (options, files) => {
        await this.requireAuth()
        const payload = buildReportPayload({
          menteeRegion: options.menteeRegion,
          reportType: options.reportType,
          progressDate: options.progressDate,
          teamNames: options.teamNames,
          venue: options.venue,
          attendanceCount: options.attendanceCount,
          attendanceNames: options.attendanceNames,
          progressStartTime: options.progressStartTime,
          progressEndTime: options.progressEndTime,
          exceptStartTime: options.exceptStartTime,
          exceptEndTime: options.exceptEndTime,
          exceptReason: options.exceptReason,
          subject: options.subject,
          content: options.content,
          mentorOpinion: options.mentorOpinion,
          nonAttendanceNames: options.nonAttendanceNames,
          etc: options.etc,
        })
        const formData = new FormData()
        for (const [key, value] of Object.entries(payload)) {
          formData.append(key, value)
        }
        for (let i = 0; i < files.length; i++) {
          const { buffer, name } = files[i]
          const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
          formData.append(`file_1_${i + 1}`, new Blob([uint8Array as unknown as ArrayBuffer]), name)
        }
        formData.append('fileFieldNm_1', 'file_1')
        formData.append('atchFileId', '')
        await this.http.postMultipart('/mypage/mentoringReport/insert.do', formData)
      },
      update: async (id, options, file, fileName) => {
        await this.requireAuth()
        const existing = await this.report.get(id)
        const payload = buildReportPayload({
          menteeRegion: options.menteeRegion ?? toRegionCode(existing.menteeRegion),
          reportType: options.reportType ?? toReportTypeCd(existing.reportType),
          progressDate: options.progressDate ?? existing.progressDate,
          teamNames: options.teamNames ?? existing.teamNames,
          venue: options.venue ?? existing.venue,
          attendanceCount: options.attendanceCount ?? existing.attendanceCount,
          attendanceNames: options.attendanceNames ?? existing.attendanceNames,
          progressStartTime: options.progressStartTime ?? existing.progressStartTime,
          progressEndTime: options.progressEndTime ?? existing.progressEndTime,
          exceptStartTime: options.exceptStartTime ?? existing.exceptStartTime,
          exceptEndTime: options.exceptEndTime ?? existing.exceptEndTime,
          exceptReason: options.exceptReason ?? existing.exceptReason,
          subject: options.subject ?? existing.subject,
          content: options.content ?? existing.content,
          mentorOpinion: options.mentorOpinion ?? existing.mentorOpinion,
          nonAttendanceNames: options.nonAttendanceNames ?? existing.nonAttendanceNames,
          etc: options.etc ?? existing.etc,
          reportId: id,
        })
        const formData = new FormData()
        for (const [key, value] of Object.entries(payload)) {
          formData.append(key, value)
        }
        if (file) {
          const isBuffer = Buffer.isBuffer(file)
          const fileBuffer = isBuffer ? file : await readFile(file)
          const resolvedFileName = isBuffer ? (fileName ?? 'file') : (file.split('/').pop() ?? 'file')
          const uint8Array = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength)
          formData.append('file_1_1', new Blob([uint8Array as unknown as ArrayBuffer]), resolvedFileName)
          formData.append('fileFieldNm_1', 'file_1')
          formData.append('atchFileId', '')
        }
        await this.http.postMultipart('/mypage/mentoringReport/update.do', formData)
      },
      approval: async (options) => {
        await this.requireAuth()
        const params: Record<string, string> = {
          menuNo: MENU_NO.REPORT_APPROVAL,
          pageIndex: String(options?.page ?? 1),
        }
        if (options?.month) params.searchMonth = options.month
        if (options?.reportType !== undefined) params.searchReport = options.reportType
        const html = await this.http.get('/mypage/mentoringReport/resultList.do', params)
        return {
          items: formatters.parseApprovalList(html),
          pagination: formatters.parsePagination(html),
        }
      },
    }

    this.team = {
      show: async () => {
        await this.requireAuth()
        return formatters.parseTeamInfo(await this.http.get('/mypage/myTeam/team.do', { menuNo: MENU_NO.TEAM }))
      },
    }

    this.member = {
      show: async () => {
        await this.requireAuth()
        return formatters.parseMemberInfo(
          await this.http.get('/mypage/myInfo/forUpdateMy.do', { menuNo: MENU_NO.MEMBER_INFO }),
        )
      },
    }

    this.event = {
      list: async (options) => {
        await this.requireAuth()
        const html = await this.http.get('/mypage/applicants/list.do', {
          menuNo: MENU_NO.EVENT,
          ...(options?.page ? { pageIndex: String(options.page) } : {}),
        })
        return {
          items: formatters.parseEventList(html),
          pagination: formatters.parsePagination(html),
        }
      },
      get: async (id) => {
        await this.requireAuth()
        return parseEventDetail(
          await this.http.get('/mypage/applicants/view.do', {
            menuNo: MENU_NO.EVENT,
            bbsId: String(id),
          }),
        )
      },
      apply: async (id) => {
        await this.requireAuth()
        await this.http.post('/application/application/application.do', buildApplicationPayload(id))
      },
    }

    this.schedule = {
      list: async (options) => {
        await this.requireAuth()
        const html = await this.http.get('/mypage/schedule/list.do', {
          menuNo: MENU_NO.SCHEDULE,
          ...(options?.page ? { pageIndex: String(options.page) } : {}),
        })
        return formatters.parseScheduleList(html)
      },
    }
  }

  getSessionData(): { sessionCookie: string | undefined; csrfToken: string | null } {
    return {
      sessionCookie: this.http.getSessionCookie(),
      csrfToken: this.http.getCsrfToken(),
    }
  }

  private async requireAuth(): Promise<void> {
    let identity = await this.http.checkLogin()
    if (!identity && this.loginCredentials) {
      await this.relogin()
      identity = await this.http.checkLogin()
    }

    if (!identity) {
      throw new AuthenticationError()
    }
  }

  private async relogin(): Promise<void> {
    if (!this.loginCredentials) {
      throw new AuthenticationError()
    }
    if (!this.reloginInFlight) {
      const { username, password } = this.loginCredentials
      this.reloginInFlight = this.http.login(username, password).finally(() => {
        this.reloginInFlight = null
      })
    }
    await this.reloginInFlight
  }

  private async resolveUser(): Promise<UserIdentity | undefined> {
    const identity = await this.http.checkLogin()
    return identity ?? undefined
  }

  async login(username?: string, password?: string): Promise<void> {
    const resolvedUsername = username ?? this.options.username
    const resolvedPassword = password ?? this.options.password

    if (!resolvedUsername || !resolvedPassword) {
      throw new Error('Username and password are required')
    }

    await this.http.login(resolvedUsername, resolvedPassword)
    this.loginCredentials = {
      username: resolvedUsername,
      password: resolvedPassword,
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return Boolean(await this.http.checkLogin())
  }

  async whoami(): Promise<UserIdentity | null> {
    return this.http.checkLogin()
  }

  async logout(): Promise<void> {
    await this.http.logout()
  }

  async saveCredentials(manager = new CredentialManager()): Promise<void> {
    const sessionCookie = this.http.getSessionCookie()
    const csrfToken = this.http.getCsrfToken()

    if (!sessionCookie || !csrfToken) {
      throw new Error('Missing session cookie or CSRF token')
    }

    await manager.setCredentials({
      sessionCookie,
      csrfToken,
      username: this.loginCredentials?.username,
      password: this.loginCredentials?.password,
      loggedInAt: new Date().toISOString(),
    })
  }

  private async postRoomUpdate(payload: Record<string, string>): Promise<void> {
    try {
      await this.http.post('/mypage/itemRent/update.do', payload)
    } catch (error) {
      if (error instanceof Error && isSuccessAlertMessage(error.message)) {
        return
      }
      throw error
    }
  }

  private containsErrorIndicator(html: string): boolean {
    const errorPatterns = [
      'class="error"',
      'class="alert-danger"',
      'alert-error',
      '오류가 발생했습니다',
      '등록에 실패했습니다',
      '실패하였습니다',
      '잘못된 접근',
      '권한이 없습니다',
    ]
    if (errorPatterns.some((pattern) => html.includes(pattern))) {
      return true
    }
    const alertMatch = html.match(/<script[^>]*>\s*alert\(['"](.+?)['"]\)/)
    if (alertMatch && !isSuccessAlertMessage(alertMatch[1])) {
      return true
    }
    return false
  }

  private extractErrorMessage(html: string): string | null {
    const alertMatch = html.match(/<script[^>]*>\s*alert\(['"](.+?)['"]\)/)
    if (alertMatch && !isSuccessAlertMessage(alertMatch[1])) {
      return alertMatch[1]
    }
    const errorDivMatch = html.match(/class="error[^"]*"[^>]*>\s*([^<]+)/)
    if (errorDivMatch) {
      return errorDivMatch[1].trim()
    }
    return null
  }
}

function isSuccessAlertMessage(message: string): boolean {
  return /정상적으로|등록하였습니다|등록되었습니다|수정하였습니다|수정되었습니다|저장되었습니다|완료되었습니다|삭제되었습니다|취소되었습니다/.test(
    message,
  )
}
