import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export interface TozPendingReservation {
  reservationId: string
  cookies: Record<string, string>
  branchName: string
  branchTel: string
  boothGroupName: string
  isLargeBooth: boolean
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  userCount: number
  boothId: number
  meetingId?: number
  newMeetingName?: string
  email: string
  memo?: string
  name: string
  phone: string
  createdAt: string
  expiresAt: string
}

export class TozPendingStore {
  private readonly path: string

  constructor(configDir?: string) {
    const dir = configDir ?? join(homedir(), '.config', 'opensoma')
    this.path = join(dir, 'toz-pending.json')
  }

  async get(): Promise<TozPendingReservation | null> {
    if (!existsSync(this.path)) return null

    try {
      const raw = await readFile(this.path, 'utf8')
      return JSON.parse(raw) as TozPendingReservation
    } catch {
      return null
    }
  }

  async set(reservation: TozPendingReservation): Promise<void> {
    const dir = dirname(this.path)
    await mkdir(dir, { recursive: true })
    // Write to a temp file with 0o600 from creation, then rename atomically.
    // Avoids the default 0o644 window between writeFile() and chmod() that
    // would briefly expose the cookie + phone number to other users on the system.
    const tmp = `${this.path}.tmp-${process.pid}-${Date.now()}`
    await writeFile(tmp, JSON.stringify(reservation, null, 2), { mode: 0o600 })
    await rename(tmp, this.path)
  }

  async clear(): Promise<void> {
    await rm(this.path, { force: true })
  }
}
