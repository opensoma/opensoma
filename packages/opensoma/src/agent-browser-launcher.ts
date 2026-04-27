import { randomBytes } from 'node:crypto'
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Minimal declaration so the web workspace tsconfig (which lacks @types/bun)
// can type-check this file without error. The real implementation always runs
// under Bun, which provides the full global at runtime.
declare const Bun: {
  spawn(
    command: string[],
    options: { stdout: 'inherit'; stderr: 'inherit'; stdin: 'inherit' },
  ): { exited: Promise<number> }
}

export interface AgentBrowserLaunchInput {
  url: string
  sessionCookie: string
}

export interface SpawnedProcess {
  exited: Promise<number>
}

export type Spawner = (command: string[]) => SpawnedProcess

export interface AgentBrowserLauncherOptions {
  spawn?: Spawner
  binary?: string
  tmpDir?: string
}

export interface LaunchResult {
  exitCode: number
  statePath: string
}

const SWMAESTRO_HOST = 'www.swmaestro.ai'
const ALLOWED_HOSTS = new Set([SWMAESTRO_HOST, 'swmaestro.ai'])

interface StorageStateCookie {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
}

interface StorageState {
  cookies: StorageStateCookie[]
  origins: never[]
}

export function buildStorageState(sessionCookie: string): StorageState {
  // Java EE JSESSIONID is host-only on the exact host that issued it. Use
  // www.swmaestro.ai (no leading dot) to match how the native server sets it.
  // Using `.swmaestro.ai` here would either fail to import or produce a
  // domain-cookie that the server treats as foreign.
  return {
    cookies: [
      {
        name: 'JSESSIONID',
        value: sessionCookie,
        domain: SWMAESTRO_HOST,
        path: '/',
        // -1 is the Playwright/agent-browser convention for session cookies
        // (no Expires/Max-Age attribute). JSESSIONID is a session cookie.
        expires: -1,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ],
    origins: [],
  }
}

export function assertSwmaestroUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`)
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`URL must use https:// (got ${parsed.protocol}//): ${rawUrl}`)
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `URL must point to swmaestro.ai (got ${parsed.hostname}). Cookie injection only works for swmaestro.ai targets.`,
    )
  }

  return parsed
}

function defaultSpawn(command: string[]): SpawnedProcess {
  // Bun.spawn with array args avoids shell interpretation entirely. The
  // randomized state-file path appears in argv but the JSESSIONID value
  // never does — that's the security guarantee.
  const proc = Bun.spawn(command, {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  })
  return { exited: proc.exited }
}

export class AgentBrowserLauncher {
  private readonly spawn: Spawner
  private readonly binary: string
  private readonly tmpRoot: string

  constructor(options: AgentBrowserLauncherOptions = {}) {
    this.spawn = options.spawn ?? defaultSpawn
    this.binary = options.binary ?? 'agent-browser'
    this.tmpRoot = options.tmpDir ?? tmpdir()
  }

  async launch(input: AgentBrowserLaunchInput): Promise<LaunchResult> {
    const target = assertSwmaestroUrl(input.url)
    const state = buildStorageState(input.sessionCookie)

    // agent-browser ignores --state if a daemon is already running. Close
    // first so our cookie injection actually takes effect. We don't care
    // about the close exit code (no-op if no daemon was running).
    await this.spawn([this.binary, 'close', '--all']).exited

    const stateDir = await this.createStateDir()
    const statePath = join(stateDir, 'state.json')

    try {
      await writeFile(statePath, JSON.stringify(state), { mode: 0o600 })
      await chmod(statePath, 0o600)

      const proc = this.spawn([this.binary, '--state', statePath, 'open', target.toString()])
      const exitCode = await proc.exited
      return { exitCode, statePath }
    } finally {
      await rm(stateDir, { recursive: true, force: true })
    }
  }

  private async createStateDir(): Promise<string> {
    // Random suffix on the directory name so concurrent launches don't
    // collide and so the path is hard to predict for same-UID local
    // attackers. mkdtemp creates with 0700 by default on macOS/Linux but we
    // chmod to be explicit across platforms.
    const prefix = `opensoma-agent-browser-${randomBytes(8).toString('hex')}-`
    const dir = await mkdtemp(join(this.tmpRoot, prefix))
    await chmod(dir, 0o700)
    return dir
  }
}
