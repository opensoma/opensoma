import { Command } from 'commander'

import { TOZ_BRANCHES } from '../constants'
import { CredentialManager } from '../credential-manager'
import { handleError } from '../shared/utils/error-handler'
import { formatOutput } from '../shared/utils/output'
import * as stderr from '../shared/utils/stderr'
import { TozClient } from '../toz-client'
import { TozPendingStore, type TozPendingReservation } from '../toz-pending-store'

type LoginOpts = { name: string; phone: string; pretty?: boolean }
type StatusOpts = { pretty?: boolean }
type BranchesOpts = { pretty?: boolean }
type MeetingsOpts = { pretty?: boolean }
type AvailableOpts = {
  date: string
  start: string
  duration: string
  userCount: string
  branch?: string[]
  pretty?: boolean
}
type CheckOpts = {
  date: string
  time: string[]
  duration: string
  userCount: string
  branch?: string[]
  pretty?: boolean
}
type ReserveRequestOpts = {
  date: string
  start: string
  duration: string
  userCount: string
  boothId: string
  meetingId?: string
  newMeeting?: string
  email: string
  memo?: string
  name?: string
  phone?: string
  pretty?: boolean
}
type ReserveConfirmOpts = { pin: string; pretty?: boolean }
type ReserveOpts = ReserveRequestOpts & { pin?: string }
type ListOpts = {
  start?: string
  end?: string
  meeting?: string
  name?: string
  phone?: string
  pretty?: boolean
}
type CancelOpts = { name?: string; phone?: string; pretty?: boolean }
type LogoutOpts = { pretty?: boolean }

function parseDurationFlag(value: string): number {
  const match = /^(\d+)\s*([hm])?$/i.exec(value.trim())
  if (!match) throw new Error(`Invalid --duration: ${value} (use e.g. "2h", "120", "150m")`)
  const n = Number.parseInt(match[1], 10)
  const unit = (match[2] ?? 'm').toLowerCase()
  return unit === 'h' ? n * 60 : n
}

function parseUserCount(value: string): number {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid --user-count: ${value}`)
  return n
}

function resolveBranchIds(values: readonly string[] | undefined): number[] {
  if (!values || values.length === 0) return TOZ_BRANCHES.map((b) => b.id)
  const ids: number[] = []
  for (const value of values) {
    const numeric = Number.parseInt(value, 10)
    if (Number.isFinite(numeric)) {
      ids.push(numeric)
      continue
    }
    const matched = TOZ_BRANCHES.find((b) => b.name === value || b.name.includes(value))
    if (!matched) throw new Error(`Unknown branch: ${value}`)
    ids.push(matched.id)
  }
  return ids
}

async function resolveIdentity(
  flagName: string | undefined,
  flagPhone: string | undefined,
): Promise<{ name: string; phone: string }> {
  if (flagName && flagPhone) return { name: flagName, phone: flagPhone }
  const stored = await new CredentialManager().getTozIdentity()
  const name = flagName ?? stored?.name
  const phone = flagPhone ?? stored?.phone
  if (!name || !phone) {
    throw new Error('Toz identity not set. Run: opensoma toz login --name <name> --phone <phone>')
  }
  return { name, phone }
}

async function loginAction(options: LoginOpts): Promise<void> {
  try {
    const manager = new CredentialManager()
    await manager.setTozIdentity(options.name, options.phone)
    console.log(
      formatOutput(
        { ok: true, message: `Toz identity saved for ${options.name} (${maskPhone(options.phone)})` },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function logoutAction(options: LogoutOpts): Promise<void> {
  try {
    await new CredentialManager().clearTozIdentity()
    await new TozPendingStore().clear()
    console.log(formatOutput({ ok: true }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function statusAction(options: StatusOpts): Promise<void> {
  try {
    const stored = await new CredentialManager().getTozIdentity()
    if (!stored) {
      console.log(formatOutput({ loggedIn: false }, options.pretty))
      return
    }
    console.log(formatOutput({ loggedIn: true, name: stored.name, phone: maskPhone(stored.phone) }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function branchesAction(options: BranchesOpts): Promise<void> {
  try {
    const branches = await new TozClient().branches()
    console.log(formatOutput(branches, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function meetingsAction(options: MeetingsOpts): Promise<void> {
  try {
    const meetings = await new TozClient().meetings()
    console.log(formatOutput(meetings, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function availableAction(options: AvailableOpts): Promise<void> {
  try {
    const booths = await new TozClient().available({
      date: options.date,
      startTime: options.start,
      durationMinutes: parseDurationFlag(options.duration),
      userCount: parseUserCount(options.userCount),
      branchIds: resolveBranchIds(options.branch),
    })
    console.log(formatOutput(booths, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function checkAction(options: CheckOpts): Promise<void> {
  try {
    const startedAt = Date.now()
    const checked = await new TozClient().check({
      date: options.date,
      startTimes: options.time,
      durationMinutes: parseDurationFlag(options.duration),
      userCount: parseUserCount(options.userCount),
      branchIds: resolveBranchIds(options.branch),
    })
    console.log(
      formatOutput(
        {
          date: options.date,
          durationMinutes: parseDurationFlag(options.duration),
          userCount: parseUserCount(options.userCount),
          checked,
          requestsIssued: options.time.length,
          wallTimeMs: Date.now() - startedAt,
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function reserveRequestAction(options: ReserveRequestOpts): Promise<void> {
  try {
    const identity = await resolveIdentity(options.name, options.phone)
    const durationMinutes = parseDurationFlag(options.duration)
    const userCount = parseUserCount(options.userCount)
    const boothId = Number.parseInt(options.boothId, 10)
    if (!Number.isFinite(boothId)) throw new Error(`Invalid --booth-id: ${options.boothId}`)
    const meetingId = options.meetingId ? Number.parseInt(options.meetingId, 10) : undefined
    if (options.meetingId && !Number.isFinite(meetingId)) throw new Error(`Invalid --meeting-id: ${options.meetingId}`)
    if (!meetingId && !options.newMeeting) throw new Error('--meeting-id or --new-meeting is required')

    const client = new TozClient()
    const reserved = await client.reserveBooth({
      date: options.date,
      startTime: options.start,
      durationMinutes,
      userCount,
      boothId,
    })
    await client.skipEquipment({
      reservationId: reserved.reservationId,
      date: options.date,
      startTime: options.start,
      durationMinutes,
    })
    await client.sendOtp(identity.phone)

    const endTime = computeEndTime(options.start, durationMinutes)
    const now = new Date()
    const pending: TozPendingReservation = {
      reservationId: reserved.reservationId,
      cookies: client.http.getCookies(),
      branchName: reserved.branchName,
      branchTel: reserved.branchTel,
      boothGroupName: reserved.boothGroupName,
      isLargeBooth: reserved.isLargeBooth,
      date: options.date,
      startTime: options.start,
      endTime,
      durationMinutes,
      userCount,
      boothId,
      meetingId,
      newMeetingName: options.newMeeting,
      email: options.email,
      memo: options.memo,
      name: identity.name,
      phone: identity.phone,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    }
    await new TozPendingStore().set(pending)

    console.log(
      formatOutput(
        {
          ok: true,
          reservationId: reserved.reservationId,
          branchName: reserved.branchName,
          boothGroupName: reserved.boothGroupName,
          date: options.date,
          startTime: options.start,
          endTime,
          expiresAt: pending.expiresAt,
          message: `SMS sent to ${maskPhone(identity.phone)}. Run: opensoma toz reserve-confirm --pin <pin>`,
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function reserveConfirmAction(options: ReserveConfirmOpts): Promise<void> {
  try {
    const store = new TozPendingStore()
    const pending = await store.get()
    if (!pending) {
      throw new Error('No pending toz reservation. Run: opensoma toz reserve-request first.')
    }
    if (Date.now() > new Date(pending.expiresAt).getTime()) {
      await store.clear()
      throw new Error(
        'Pending toz reservation expired (5-minute hold lapsed). Run: opensoma toz reserve-request again.',
      )
    }

    const client = new TozClient({ cookies: pending.cookies })
    const result = await client.confirm({
      reservationId: pending.reservationId,
      date: pending.date,
      startTime: pending.startTime,
      durationMinutes: pending.durationMinutes,
      name: pending.name,
      phone: pending.phone,
      email: pending.email,
      pinNum: options.pin,
      meetingId: pending.meetingId,
      newMeetingName: pending.newMeetingName,
      memo: pending.memo,
    })

    await store.clear()
    console.log(
      formatOutput(
        {
          ok: true,
          reservationId: pending.reservationId,
          branchName: pending.branchName,
          boothGroupName: pending.boothGroupName,
          date: pending.date,
          startTime: pending.startTime,
          endTime: pending.endTime,
          message: result.resultMsg,
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function reserveAction(options: ReserveOpts): Promise<void> {
  try {
    const identity = await resolveIdentity(options.name, options.phone)
    const durationMinutes = parseDurationFlag(options.duration)
    const userCount = parseUserCount(options.userCount)
    const boothId = Number.parseInt(options.boothId, 10)
    if (!Number.isFinite(boothId)) throw new Error(`Invalid --booth-id: ${options.boothId}`)
    const meetingId = options.meetingId ? Number.parseInt(options.meetingId, 10) : undefined
    if (!meetingId && !options.newMeeting) throw new Error('--meeting-id or --new-meeting is required')

    const client = new TozClient()
    stderr.info(`[1/4] Reserving booth ${boothId}...`)
    const reserved = await client.reserveBooth({
      date: options.date,
      startTime: options.start,
      durationMinutes,
      userCount,
      boothId,
    })
    stderr.info(`      ok (reservationId=${reserved.reservationId}, ${reserved.branchName} ${reserved.boothGroupName})`)

    stderr.info('[2/4] Skipping equipment...')
    await client.skipEquipment({
      reservationId: reserved.reservationId,
      date: options.date,
      startTime: options.start,
      durationMinutes,
    })
    stderr.info('      ok')

    stderr.info(`[3/4] Sending SMS to ${maskPhone(identity.phone)}...`)
    await client.sendOtp(identity.phone)
    stderr.info('      ok')

    const pin = options.pin ?? (await promptPin())
    stderr.info('[4/4] Confirming reservation...')
    const result = await client.confirm({
      reservationId: reserved.reservationId,
      date: options.date,
      startTime: options.start,
      durationMinutes,
      name: identity.name,
      phone: identity.phone,
      email: options.email,
      pinNum: pin,
      meetingId,
      newMeetingName: options.newMeeting,
      memo: options.memo,
    })
    stderr.info('      ok')

    console.log(
      formatOutput(
        {
          ok: true,
          reservationId: reserved.reservationId,
          branchName: reserved.branchName,
          boothGroupName: reserved.boothGroupName,
          date: options.date,
          startTime: options.start,
          endTime: computeEndTime(options.start, durationMinutes),
          message: result.resultMsg,
        },
        options.pretty,
      ),
    )
  } catch (error) {
    handleError(error)
  }
}

async function listAction(options: ListOpts): Promise<void> {
  try {
    const identity = await resolveIdentity(options.name, options.phone)
    const reservations = await new TozClient().myReservations({
      name: identity.name,
      phone: identity.phone,
      startDate: options.start,
      endDate: options.end,
      meetingName: options.meeting,
    })
    console.log(formatOutput(reservations, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

async function cancelAction(reservationId: string, options: CancelOpts): Promise<void> {
  try {
    const id = Number.parseInt(reservationId, 10)
    if (!Number.isFinite(id)) throw new Error(`Invalid reservationId: ${reservationId}`)
    const identity = await resolveIdentity(options.name, options.phone)
    await new TozClient().cancel({ reservationId: id, name: identity.name, phone: identity.phone })
    console.log(formatOutput({ ok: true, message: '취소되었습니다.' }, options.pretty))
  } catch (error) {
    handleError(error)
  }
}

function maskPhone(phone: string): string {
  return phone.replace(
    /^(\d{3})-?(\d{3,4})-?(\d{4})$/,
    (_, a: string, _b: string, c: string) => `${a}-${'*'.repeat(_b.length)}-${c}`,
  )
}

function computeEndTime(start: string, durationMinutes: number): string {
  const [h, m] = start.split(':').map((s) => Number.parseInt(s, 10))
  const total = h * 60 + m + durationMinutes
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
}

async function promptPin(): Promise<string> {
  process.stdout.write('Enter 6-digit PIN from SMS: ')
  const input = await Bun.stdin.text()
  return input.trim()
}

export const tozCommand = new Command('toz')
  .description('Manage TOZ external meeting room reservations (SW마에스트로 partnership)')
  .addCommand(
    new Command('login')
      .description('Save TOZ identity (name + phone) to credentials')
      .requiredOption('--name <name>', 'Reservation holder name')
      .requiredOption('--phone <phone>', 'Phone number, e.g. 010-1234-5678')
      .option('--pretty', 'Pretty print JSON output')
      .action(loginAction),
  )
  .addCommand(
    new Command('logout')
      .description('Clear stored TOZ identity and pending reservation state')
      .option('--pretty', 'Pretty print JSON output')
      .action(logoutAction),
  )
  .addCommand(
    new Command('status')
      .description('Show stored TOZ identity')
      .option('--pretty', 'Pretty print JSON output')
      .action(statusAction),
  )
  .addCommand(
    new Command('branches')
      .description('List partner branches (live from booking.htm)')
      .option('--pretty', 'Pretty print JSON output')
      .action(branchesAction),
  )
  .addCommand(
    new Command('meetings')
      .description('List active SW마에스트로 meetings (live from booking.htm)')
      .option('--pretty', 'Pretty print JSON output')
      .action(meetingsAction),
  )
  .addCommand(
    new Command('available')
      .description('Show available booths for one date+time+duration')
      .requiredOption('--date <date>', 'YYYY-MM-DD')
      .requiredOption('--start <time>', 'HH:MM')
      .requiredOption('--duration <duration>', 'e.g. 2h, 150m, 120 (default minutes)')
      .requiredOption('--user-count <n>', 'Number of attendees')
      .option('--branch <id-or-name...>', 'Branch IDs or names (default: all 9)')
      .option('--pretty', 'Pretty print JSON output')
      .action(availableAction),
  )
  .addCommand(
    new Command('check')
      .description('Check booth availability for multiple times (max 6, serial)')
      .requiredOption('--date <date>', 'YYYY-MM-DD')
      .requiredOption('--time <time...>', 'HH:MM (repeatable, max 6)')
      .requiredOption('--duration <duration>', 'e.g. 2h')
      .requiredOption('--user-count <n>', 'Number of attendees')
      .option('--branch <id-or-name...>', 'Branch IDs or names')
      .option('--pretty', 'Pretty print JSON output')
      .action(checkAction),
  )
  .addCommand(
    new Command('reserve-request')
      .description('Step 1 of non-interactive reservation: hold booth + send SMS')
      .requiredOption('--date <date>', 'YYYY-MM-DD')
      .requiredOption('--start <time>', 'HH:MM')
      .requiredOption('--duration <duration>', 'e.g. 2h')
      .requiredOption('--user-count <n>', 'Number of attendees')
      .requiredOption('--booth-id <id>', 'Booth ID from `toz available`')
      .option('--meeting-id <id>', 'Meeting ID from `toz meetings`')
      .option('--new-meeting <name>', 'Create a new meeting with this name')
      .requiredOption('--email <email>', 'Contact email')
      .option('--memo <text>', 'Reservation memo')
      .option('--name <name>', 'Override stored name')
      .option('--phone <phone>', 'Override stored phone')
      .option('--pretty', 'Pretty print JSON output')
      .action(reserveRequestAction),
  )
  .addCommand(
    new Command('reserve-confirm')
      .description('Step 2 of non-interactive reservation: finalize with PIN')
      .requiredOption('--pin <pin>', '6-digit PIN from SMS')
      .option('--pretty', 'Pretty print JSON output')
      .action(reserveConfirmAction),
  )
  .addCommand(
    new Command('reserve')
      .description('Interactive single-process reservation (prompts for PIN)')
      .requiredOption('--date <date>', 'YYYY-MM-DD')
      .requiredOption('--start <time>', 'HH:MM')
      .requiredOption('--duration <duration>', 'e.g. 2h')
      .requiredOption('--user-count <n>', 'Number of attendees')
      .requiredOption('--booth-id <id>', 'Booth ID')
      .option('--meeting-id <id>', 'Meeting ID')
      .option('--new-meeting <name>', 'Create new meeting with this name')
      .requiredOption('--email <email>', 'Contact email')
      .option('--memo <text>', 'Reservation memo')
      .option('--name <name>', 'Override stored name')
      .option('--phone <phone>', 'Override stored phone')
      .option('--pin <pin>', 'PIN if already received (skip prompt)')
      .option('--pretty', 'Pretty print JSON output')
      .action(reserveAction),
  )
  .addCommand(
    new Command('list')
      .description('List my TOZ reservations')
      .option('--start <date>', 'YYYY-MM-DD')
      .option('--end <date>', 'YYYY-MM-DD')
      .option('--meeting <name>', 'Filter by meeting name')
      .option('--name <name>', 'Override stored name')
      .option('--phone <phone>', 'Override stored phone')
      .option('--pretty', 'Pretty print JSON output')
      .action(listAction),
  )
  .addCommand(
    new Command('cancel')
      .description('Cancel a TOZ reservation')
      .argument('<reservationId>')
      .option('--name <name>', 'Override stored name')
      .option('--phone <phone>', 'Override stored phone')
      .option('--pretty', 'Pretty print JSON output')
      .action(cancelAction),
  )
