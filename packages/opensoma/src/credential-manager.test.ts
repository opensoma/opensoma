import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { CredentialManager } from './credential-manager'

let createdDirs: string[] = []

afterEach(async () => {
  for (const dir of createdDirs) {
    await new CredentialManager(dir).remove()
  }
  createdDirs = []
})

describe('CredentialManager', () => {
  test('loads empty config when file does not exist', async () => {
    const dir = await makeTempDir()
    const manager = new CredentialManager(dir)

    await expect(manager.load()).resolves.toEqual({ credentials: null })
    await expect(manager.getCredentials()).resolves.toBeNull()
  })

  test('saves and loads credentials with secure permissions', async () => {
    const dir = await makeTempDir()
    const manager = new CredentialManager(dir)

    await manager.setCredentials({
      sessionCookie: 'session-value',
      csrfToken: 'csrf-value',
      username: 'neo@example.com',
      loggedInAt: '2026-04-09T00:00:00.000Z',
    })

    await expect(manager.getCredentials()).resolves.toEqual({
      sessionCookie: 'session-value',
      csrfToken: 'csrf-value',
      username: 'neo@example.com',
      loggedInAt: '2026-04-09T00:00:00.000Z',
    })

    const fileStat = await stat(join(dir, 'credentials.json'))
    expect(fileStat.mode & 0o777).toBe(0o600)
  })

  test('removes credentials file', async () => {
    const dir = await makeTempDir()
    const manager = new CredentialManager(dir)

    await manager.setCredentials({
      sessionCookie: 'session-value',
      csrfToken: 'csrf-value',
    })
    await manager.remove()

    await expect(manager.getCredentials()).resolves.toBeNull()
  })
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'opensoma-credentials-'))
  createdDirs.push(dir)
  return dir
}
