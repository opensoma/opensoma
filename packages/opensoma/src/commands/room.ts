import { Command } from 'commander'

import * as formatters from '../formatters'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import { buildRoomReservationPayload, resolveRoomId } from '../shared/utils/swmaestro'
import { getHttpOrExit } from './helpers'

type ListOptions = { date?: string; room?: string; pretty?: boolean }
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

async function listAction(options: ListOptions): Promise<void> {
  try {
    const http = await getHttpOrExit()
    const html = await http.post('/mypage/officeMng/list.do', {
      menuNo: '200058',
      sdate: options.date ?? new Date().toISOString().slice(0, 10),
      searchItemId: options.room ? String(resolveRoomId(options.room)) : '',
    })
    console.log(formatOutput(formatters.parseRoomList(html), options.pretty))
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

export const roomCommand = new Command('room')
  .description('Manage room reservations')
  .addCommand(
    new Command('list')
      .description('List rooms')
      .option('--date <date>', 'Reservation date')
      .option('--room <room>', 'Room filter')
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
