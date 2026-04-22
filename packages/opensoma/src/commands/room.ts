import { Command } from 'commander'

import { MENU_NO } from '../constants'
import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import {
  buildRoomCancelPayload,
  buildRoomReservationPayload,
  buildRoomUpdatePayload,
  resolveRoomId,
} from '../shared/utils/swmaestro'
import { getHttpOrExit } from './helpers'

type ListOptions = { date?: string; room?: string; reservations?: boolean; pretty?: boolean }
type AvailableOptions = { date: string; pretty?: boolean }
type ReserveOptions = {
  room: string
  date: string
  slots: string
  title: string
  attendees?: string
  notes?: string
  pretty?: boolean
}
type GetOptions = { pretty?: boolean }
type UpdateOptions = {
  title?: string
  room?: string
  date?: string
  slots?: string
  attendees?: string
  notes?: string
  pretty?: boolean
}
type CancelOptions = { pretty?: boolean }
type ReservationsOptions = {
  status?: string
  startDate?: string
  endDate?: string
  page?: string
  pretty?: boolean
}

const ROOM_UPDATE_SUCCESS_PATTERN = /정상적으로|수정하였습니다|수정되었습니다|저장되었습니다|취소되었습니다/

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const date = options.date ?? new Date().toISOString().slice(0, 10)
    const html = await http.post('/mypage/officeMng/list.do', {
      menuNo: '200058',
      sdate: date,
      searchItemId: options.room ? String(resolveRoomId(options.room)) : '',
    })
    const rooms = formatters.parseRoomList(html)

    if (!options.reservations) {
      console.log(formatOutput(rooms, options.pretty))
      return
    }

    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        try {
          const detailHtml = await http.post('/mypage/officeMng/rentTime.do', {
            viewType: 'CONTBODY',
            itemId: String(room.itemId),
            rentDt: date,
          })

          return {
            ...room,
            timeSlots: formatters.parseRoomSlots(detailHtml),
          }
        } catch {
          return room
        }
      }),
    )

    console.log(formatOutput(enrichedRooms, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function reservationsAction(options: ReservationsOptions): Promise<void> {
  try {
    const status = options.status ?? 'confirmed'
    if (status !== 'confirmed' && status !== 'cancelled' && status !== 'all') {
      throw new Error(`Invalid --status value: ${status}. Use 'confirmed', 'cancelled', or 'all'.`)
    }

    const http = await getHttpOrExit()
    const params: Record<string, string> = {
      menuNo: MENU_NO.ROOM,
      pageIndex: options.page ?? '1',
    }
    if (options.startDate) params.sdate = options.startDate
    if (options.endDate) params.edate = options.endDate
    if (status === 'confirmed') params.searchStat = 'RS001'
    if (status === 'cancelled') params.searchStat = 'RS002'

    const html = await http.get('/mypage/itemRent/list.do', params)
    const result = {
      items: formatters.parseRoomReservationList(html),
      pagination: formatters.parsePagination(html),
    }
    console.log(formatOutput(result, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function availableAction(roomId: string, options: AvailableOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.post('/mypage/officeMng/rentTime.do', {
      viewType: 'CONTBODY',
      itemId: String(resolveRoomId(roomId)),
      rentDt: options.date,
    })
    console.log(formatOutput(formatters.parseRoomSlots(html), options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function reserveAction(options: ReserveOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    await http.post(
      '/mypage/itemRent/insert.do',
      buildRoomReservationPayload({
        roomId: resolveRoomId(options.room),
        date: options.date,
        slots: options.slots
          .split(',')
          .map((slot) => slot.trim())
          .filter(Boolean),
        title: options.title,
        attendees: options.attendees ? Number.parseInt(options.attendees, 10) : undefined,
        notes: options.notes,
      }),
    )
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function fetchReservationDetail(http: Awaited<ReturnType<typeof getHttpOrExit>>, rentId: number) {
  return formatters.parseRoomReservationDetail(
    await http.get('/mypage/itemRent/view.do', { menuNo: MENU_NO.ROOM, rentId: String(rentId) }),
  )
}

async function postRoomMutation(
  http: Awaited<ReturnType<typeof getHttpOrExit>>,
  payload: Record<string, string>,
): Promise<void> {
  try {
    await http.post('/mypage/itemRent/update.do', payload)
  } catch (error) {
    if (error instanceof Error && ROOM_UPDATE_SUCCESS_PATTERN.test(error.message)) {
      return
    }
    throw error
  }
}

async function getAction(rentIdArg: string, options: GetOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const rentId = Number.parseInt(rentIdArg, 10)
    const detail = await fetchReservationDetail(http, rentId)
    console.log(formatOutput(detail, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function updateAction(rentIdArg: string, options: UpdateOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const rentId = Number.parseInt(rentIdArg, 10)
    const existing = await fetchReservationDetail(http, rentId)
    const slots = options.slots
      ?.split(',')
      .map((slot) => slot.trim())
      .filter(Boolean)
    const payload = buildRoomUpdatePayload(existing, {
      title: options.title,
      roomId: options.room ? resolveRoomId(options.room) : undefined,
      date: options.date,
      slots: slots?.length ? slots : undefined,
      attendees: options.attendees ? Number.parseInt(options.attendees, 10) : undefined,
      notes: options.notes,
    })
    await postRoomMutation(http, payload)
    console.log(formatOutput({ ok: true, rentId }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function cancelAction(rentIdArg: string, options: CancelOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const rentId = Number.parseInt(rentIdArg, 10)
    const existing = await fetchReservationDetail(http, rentId)
    await postRoomMutation(http, buildRoomCancelPayload(existing))
    console.log(formatOutput({ ok: true, rentId }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

export const roomCommand = new Command('room')
  .description('Manage room reservations')
  .addCommand(
    new Command('list')
      .description('List rooms')
      .option('--date <date>', 'Reservation date')
      .option('--room <room>', 'Room filter')
      .option('--reservations', 'Include reservation info in time slots')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('available')
      .description('Show available time slots')
      .argument('<roomId>')
      .requiredOption('--date <date>', 'Reservation date')
      .option('--pretty', 'Pretty print JSON output')
      .action(availableAction),
  )
  .addCommand(
    new Command('reserve')
      .description('Reserve a room')
      .requiredOption('--room <room>', 'Room ID or short name')
      .requiredOption('--date <date>', 'Reservation date')
      .requiredOption('--slots <slots>', 'Comma-separated HH:MM values')
      .requiredOption('--title <title>', 'Reservation title')
      .option('--attendees <count>', 'Number of attendees')
      .option('--notes <notes>', 'Reservation notes')
      .option('--pretty', 'Pretty print JSON output')
      .action(reserveAction),
  )
  .addCommand(
    new Command('get')
      .description('Show a single reservation by rentId')
      .argument('<rentId>', 'Reservation ID returned from view.do')
      .option('--pretty', 'Pretty print JSON output')
      .action(getAction),
  )
  .addCommand(
    new Command('update')
      .description('Update an existing reservation (any subset of fields)')
      .argument('<rentId>', 'Reservation ID returned from view.do')
      .option('--title <title>', 'New title')
      .option('--room <room>', 'New room ID or short name')
      .option('--date <date>', 'New reservation date (YYYY-MM-DD)')
      .option('--slots <slots>', 'New comma-separated HH:MM values')
      .option('--attendees <count>', 'New number of attendees')
      .option('--notes <notes>', 'New notes')
      .option('--pretty', 'Pretty print JSON output')
      .action(updateAction),
  )
  .addCommand(
    new Command('cancel')
      .description('Cancel an existing reservation')
      .argument('<rentId>', 'Reservation ID returned from view.do')
      .option('--pretty', 'Pretty print JSON output')
      .action(cancelAction),
  )
  .addCommand(
    new Command('reservations')
      .description("List the user's room reservations")
      .option('--status <status>', "Filter by status: 'confirmed' (default), 'cancelled', or 'all'")
      .option('--start-date <date>', 'Earliest reservation date (YYYY-MM-DD)')
      .option('--end-date <date>', 'Latest reservation date (YYYY-MM-DD)')
      .option('--page <page>', 'Page number', '1')
      .option('--pretty', 'Pretty print JSON output')
      .action(reservationsAction),
  )
