import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { TozPendingStore, type TozPendingReservation } from './toz-pending-store'

let configDir: string
const cleanups: (() => void)[] = []

function freshStore(): TozPendingStore {
  configDir = mkdtempSync(join(tmpdir(), 'toz-pending-'))
  cleanups.push(() => {
    require('node:fs').rmSync(configDir, { recursive: true, force: true })
  })
  return new TozPendingStore(configDir)
}

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.()
})

const sample: TozPendingReservation = {
  reservationId: 'abc-123',
  cookies: { JSESSIONID: 'XYZ' },
  branchName: '토즈타워점',
  branchTel: '02-3454-0116',
  boothGroupName: '2인부스 A타입',
  isLargeBooth: false,
  date: '2026-04-21',
  startTime: '14:00',
  endTime: '16:00',
  durationMinutes: 120,
  userCount: 2,
  boothId: 740,
  meetingId: 2305094,
  email: 'me@gmail.com',
  name: '홍길동',
  phone: '010-1234-5678',
  createdAt: '2026-04-17T18:42:13.291Z',
  expiresAt: '2026-04-17T18:47:13.291Z',
}

describe('TozPendingStore', () => {
  test('returns null when no pending file exists', async () => {
    const store = freshStore()
    expect(await store.get()).toBeNull()
  })

  test('round-trips a reservation through set/get', async () => {
    const store = freshStore()
    await store.set(sample)
    expect(await store.get()).toEqual(sample)
  })

  test('clear removes the file', async () => {
    const store = freshStore()
    await store.set(sample)
    await store.clear()
    expect(await store.get()).toBeNull()
  })

  test('clear is no-op when file does not exist', async () => {
    const store = freshStore()
    await store.clear()
    expect(await store.get()).toBeNull()
  })

  test('overwrites an existing reservation', async () => {
    const store = freshStore()
    await store.set(sample)
    const updated = { ...sample, reservationId: 'new-id' }
    await store.set(updated)
    expect(await store.get()).toEqual(updated)
  })
})
