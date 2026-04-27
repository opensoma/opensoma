import { afterEach, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { AgentBrowserLauncher, assertSwmaestroUrl, buildStorageState } from './agent-browser-launcher'
import type { Spawner } from './agent-browser-launcher'

let createdDirs: string[] = []

afterEach(async () => {
  for (const dir of createdDirs) {
    await rm(dir, { recursive: true, force: true })
  }
  createdDirs = []
})

describe('buildStorageState', () => {
  it('returns a Playwright-compatible storage state with JSESSIONID host-only on www.swmaestro.ai', () => {
    const state = buildStorageState('test-session-value')

    expect(state).toEqual({
      cookies: [
        {
          name: 'JSESSIONID',
          value: 'test-session-value',
          domain: 'www.swmaestro.ai',
          path: '/',
          expires: -1,
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    })
  })

  it('does not use a leading-dot domain (host-only, not domain cookie)', () => {
    const state = buildStorageState('x')
    expect(state.cookies[0]?.domain).toBe('www.swmaestro.ai')
    expect(state.cookies[0]?.domain.startsWith('.')).toBe(false)
  })
})

describe('assertSwmaestroUrl', () => {
  it('accepts https://www.swmaestro.ai URLs', () => {
    expect(() => assertSwmaestroUrl('https://www.swmaestro.ai/sw/main/main.do')).not.toThrow()
  })

  it('accepts the bare swmaestro.ai apex', () => {
    expect(() => assertSwmaestroUrl('https://swmaestro.ai/')).not.toThrow()
  })

  it('rejects non-swmaestro hosts', () => {
    expect(() => assertSwmaestroUrl('https://evil.example.com/path')).toThrow(/swmaestro\.ai/)
  })

  it('rejects http:// (forces https)', () => {
    expect(() => assertSwmaestroUrl('http://www.swmaestro.ai/')).toThrow(/https/)
  })

  it('rejects malformed URLs', () => {
    expect(() => assertSwmaestroUrl('not-a-url')).toThrow(/Invalid URL/)
  })
})

describe('AgentBrowserLauncher.launch', () => {
  it('writes a state file with the JSESSIONID and invokes agent-browser with --state and open', async () => {
    const tmpRoot = await makeTempRoot()
    const allCommands: string[][] = []
    let stateContent = ''
    let stateMode = 0
    let dirMode = 0

    const spawn: Spawner = (command) => ({
      exited: (async () => {
        allCommands.push([...command])
        if (command[1] === '--state') {
          const statePath = command[2]
          if (!statePath) throw new Error('missing state path argument')
          stateContent = await readFile(statePath, 'utf8')
          stateMode = (await stat(statePath)).mode & 0o777
          const dir = statePath.replace(/\/state\.json$/, '')
          dirMode = (await stat(dir)).mode & 0o777
        }
        return 0
      })(),
    })

    const launcher = new AgentBrowserLauncher({ spawn, binary: 'agent-browser', tmpDir: tmpRoot })
    const result = await launcher.launch({
      url: 'https://www.swmaestro.ai/sw/mypage/myMain/dashboard.do',
      sessionCookie: 'abc-123-jsessionid',
    })

    expect(result.exitCode).toBe(0)
    expect(allCommands[0]).toEqual(['agent-browser', 'close', '--all'])

    const launchCmd = allCommands[1]
    expect(launchCmd?.[0]).toBe('agent-browser')
    expect(launchCmd?.[1]).toBe('--state')
    expect(launchCmd?.[3]).toBe('open')
    expect(launchCmd?.[4]).toBe('https://www.swmaestro.ai/sw/mypage/myMain/dashboard.do')

    const parsed = JSON.parse(stateContent) as { cookies: Array<{ name: string; value: string }> }
    expect(parsed.cookies[0]?.name).toBe('JSESSIONID')
    expect(parsed.cookies[0]?.value).toBe('abc-123-jsessionid')

    expect(stateMode).toBe(0o600)
    expect(dirMode).toBe(0o700)
  })

  it('closes any running daemon before launching so --state is not silently ignored', async () => {
    const tmpRoot = await makeTempRoot()
    const calls: string[] = []

    const spawn: Spawner = (command) => ({
      exited: (async () => {
        if (command[1] === 'close') calls.push('close')
        if (command[1] === '--state') calls.push('launch')
        return 0
      })(),
    })

    await new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot }).launch({
      url: 'https://www.swmaestro.ai/sw/main/main.do',
      sessionCookie: 'x',
    })

    expect(calls).toEqual(['close', 'launch'])
  })

  it('never includes the JSESSIONID value in argv', async () => {
    const tmpRoot = await makeTempRoot()
    const allArgs: string[] = []

    const spawn: Spawner = (command) => ({
      exited: (async () => {
        allArgs.push(...command)
        return 0
      })(),
    })

    const launcher = new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot })
    await launcher.launch({
      url: 'https://www.swmaestro.ai/sw/main/main.do',
      sessionCookie: 'super-secret-jsessionid-value',
    })

    for (const arg of allArgs) {
      expect(arg).not.toContain('super-secret-jsessionid-value')
    }
  })

  it('cleans up the state directory after agent-browser exits successfully', async () => {
    const tmpRoot = await makeTempRoot()
    let capturedStatePath = ''

    const spawn: Spawner = (command) => ({
      exited: (async () => {
        if (command[1] === '--state') {
          capturedStatePath = command[2] ?? ''
        }
        return 0
      })(),
    })

    await new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot }).launch({
      url: 'https://www.swmaestro.ai/sw/main/main.do',
      sessionCookie: 'x',
    })

    expect(existsSync(capturedStatePath)).toBe(false)
    const remaining = await readdir(tmpRoot)
    expect(remaining).toEqual([])
  })

  it('cleans up the state directory even if agent-browser throws', async () => {
    const tmpRoot = await makeTempRoot()
    let capturedStatePath = ''

    const spawn: Spawner = (command) => ({
      exited: (async () => {
        if (command[1] === '--state') {
          capturedStatePath = command[2] ?? ''
          throw new Error('boom')
        }
        return 0
      })(),
    })

    await expect(
      new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot }).launch({
        url: 'https://www.swmaestro.ai/sw/main/main.do',
        sessionCookie: 'x',
      }),
    ).rejects.toThrow('boom')

    expect(existsSync(capturedStatePath)).toBe(false)
    const remaining = await readdir(tmpRoot)
    expect(remaining).toEqual([])
  })

  it('propagates the agent-browser non-zero exit code', async () => {
    const tmpRoot = await makeTempRoot()
    const spawn: Spawner = (command) => ({
      exited: Promise.resolve(command[1] === '--state' ? 42 : 0),
    })

    const result = await new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot }).launch({
      url: 'https://www.swmaestro.ai/sw/main/main.do',
      sessionCookie: 'x',
    })

    expect(result.exitCode).toBe(42)
  })

  it('uses a custom binary path when provided', async () => {
    const tmpRoot = await makeTempRoot()
    const observedBinaries: string[] = []
    const spawn: Spawner = (command) => ({
      exited: (async () => {
        observedBinaries.push(command[0] ?? '')
        return 0
      })(),
    })

    await new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot, binary: '/custom/path/agent-browser' }).launch({
      url: 'https://www.swmaestro.ai/sw/main/main.do',
      sessionCookie: 'x',
    })

    expect(new Set(observedBinaries)).toEqual(new Set(['/custom/path/agent-browser']))
  })

  it('rejects non-swmaestro URLs before spawning anything', async () => {
    const tmpRoot = await makeTempRoot()
    let spawnCalled = false
    const spawn: Spawner = () => {
      spawnCalled = true
      return { exited: Promise.resolve(0) }
    }

    await expect(
      new AgentBrowserLauncher({ spawn, tmpDir: tmpRoot }).launch({
        url: 'https://evil.example.com/path',
        sessionCookie: 'x',
      }),
    ).rejects.toThrow(/swmaestro\.ai/)

    expect(spawnCalled).toBe(false)
    const remaining = await readdir(tmpRoot)
    expect(remaining).toEqual([])
  })
})

async function makeTempRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'opensoma-launcher-test-'))
  createdDirs.push(dir)
  return dir
}
