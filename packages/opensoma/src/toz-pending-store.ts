import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

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
    await mkdir(join(this.path, '..'), { recursive: true })
    await writeFile(this.path, JSON.stringify(reservation, null, 2))
    await chmod(this.path, 0o600)
  }

  async clear(): Promise<void> {
    await rm(this.path, { force: true })
  }
}
