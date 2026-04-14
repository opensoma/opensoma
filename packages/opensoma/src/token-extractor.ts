import { execSync } from 'node:child_process'
import { createDecipheriv, pbkdf2Sync } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

const COOKIE_QUERY =
  "SELECT encrypted_value, last_access_utc, value FROM cookies WHERE host_key LIKE '%swmaestro.ai' AND name = 'JSESSIONID' ORDER BY last_access_utc DESC LIMIT 1"
const CHROMIUM_SALT = 'saltysalt'
const CHROMIUM_IV = Buffer.alloc(16, 0x20)
const PROFILE_DIR_PATTERN = /^Profile\s+\d+$/

type BrowserConfig = {
  name: string
  macPath: string
  linuxPath: string
  keychainService: string
  keychainAccount: string
}

type CookieRow = {
  encrypted_value: ArrayBuffer | Uint8Array | Buffer | null
  last_access_utc?: number | bigint | null
  value: ArrayBuffer | Uint8Array | Buffer | string | null
}

export interface ExtractedSessionCandidate {
  browser: string
  lastAccessUtc: number
  profile: string
  sessionCookie: string
}

export const BROWSERS: BrowserConfig[] = [
  {
    name: 'Chrome',
    macPath: 'Google Chrome',
    linuxPath: 'google-chrome',
    keychainService: 'Chrome Safe Storage',
    keychainAccount: 'Chrome',
  },
  {
    name: 'Edge',
    macPath: 'Microsoft Edge',
    linuxPath: 'microsoft-edge',
    keychainService: 'Microsoft Edge Safe Storage',
    keychainAccount: 'Microsoft Edge',
  },
  {
    name: 'Brave',
    macPath: 'BraveSoftware/Brave-Browser',
    linuxPath: 'BraveSoftware/Brave-Browser',
    keychainService: 'Brave Safe Storage',
    keychainAccount: 'Brave',
  },
  {
    name: 'Arc',
    macPath: join('Arc', 'User Data'),
    linuxPath: join('Arc', 'User Data'),
    keychainService: 'Arc Safe Storage',
    keychainAccount: 'Arc',
  },
  {
    name: 'Vivaldi',
    macPath: 'Vivaldi',
    linuxPath: 'Vivaldi',
    keychainService: 'Vivaldi Safe Storage',
    keychainAccount: 'Vivaldi',
  },
  {
    name: 'Chromium',
    macPath: 'Chromium',
    linuxPath: 'Chromium',
    keychainService: 'Chromium Safe Storage',
    keychainAccount: 'Chromium',
  },
]

function queryCookieDb(dbPath: string): CookieRow | undefined {
  if (typeof globalThis.Bun !== 'undefined') {
    const { Database } = require('bun:sqlite')
    const db = new Database(dbPath, { readonly: true })
    try {
      const row = db.query(COOKIE_QUERY).get() as CookieRow | undefined
      return row ?? undefined
    } finally {
      db.close()
    }
  }

  try {
    const Database = require('better-sqlite3') as new (
      path: string,
      options?: { readonly?: boolean },
    ) => {
      close: () => void
      prepare: (query: string) => { get: () => CookieRow | undefined }
    }
    const db = new Database(dbPath, { readonly: true })
    try {
      return db.prepare(COOKIE_QUERY).get() ?? undefined
    } finally {
      db.close()
    }
  } catch {
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (
        path: string,
        options?: { readonly?: boolean },
      ) => {
        close: () => void
        prepare: (query: string) => { get: () => CookieRow | undefined }
      }
    }
    const db = new DatabaseSync(dbPath, { readonly: true })
    try {
      return db.prepare(COOKIE_QUERY).get() ?? undefined
    } finally {
      db.close()
    }
  }
}

export class TokenExtractor {
  constructor(
    private readonly platform: NodeJS.Platform = process.platform,
    private readonly homeDirectory: string = homedir(),
  ) {}

  async extract(): Promise<{ sessionCookie: string } | null> {
    const candidates = await this.extractCandidates()
    const firstCandidate = candidates[0]

    if (!firstCandidate) {
      return null
    }

    return { sessionCookie: firstCandidate.sessionCookie }
  }

  async extractCandidates(): Promise<ExtractedSessionCandidate[]> {
    const candidates = new Map<string, ExtractedSessionCandidate>()

    for (const databasePath of this.findCookieDatabases()) {
      const browser = this.getBrowserByPath(databasePath)
      if (!browser) {
        continue
      }

      const profile = basename(dirname(databasePath))

      const tempDirectory = mkdtempSync(join(tmpdir(), 'opensoma-cookie-db-'))
      const tempDatabasePath = join(tempDirectory, 'Cookies')

      try {
        copySqliteDatabase(databasePath, tempDatabasePath)

        const row = queryCookieDb(tempDatabasePath)
        if (!row) {
          continue
        }

        const plaintextValue = normalizeCookieText(row.value)
        if (plaintextValue) {
          this.addCandidate(candidates, {
            browser: browser.name,
            lastAccessUtc: this.normalizeLastAccessUtc(row.last_access_utc),
            profile,
            sessionCookie: plaintextValue,
          })
          continue
        }

        const encryptedValue = normalizeCookieBytes(row.encrypted_value)
        if (!encryptedValue || encryptedValue.length === 0) {
          continue
        }

        const decryptedValue = await this.decryptCookie(encryptedValue, browser.name)
        if (decryptedValue) {
          this.addCandidate(candidates, {
            browser: browser.name,
            lastAccessUtc: this.normalizeLastAccessUtc(row.last_access_utc),
            profile,
            sessionCookie: decryptedValue,
          })
        }
      } catch {
      } finally {
        rmSync(tempDirectory, { recursive: true, force: true })
      }
    }

    return [...candidates.values()].sort((left, right) => right.lastAccessUtc - left.lastAccessUtc)
  }

  findCookieDatabases(): string[] {
    return BROWSERS.flatMap((browser) => this.findBrowserCookieDatabases(browser))
  }

  private async decryptCookie(encryptedValue: Buffer, browserName: string): Promise<string> {
    if (encryptedValue.length === 0) {
      return ''
    }

    if (this.platform === 'linux') {
      return this.decryptChromiumValue(encryptedValue, pbkdf2Sync('peanuts', CHROMIUM_SALT, 1, 16, 'sha1'))
    }

    if (this.platform === 'darwin') {
      const key = await this.getMacOSEncryptionKey(browserName)
      return this.decryptChromiumValue(encryptedValue, key)
    }

    return ''
  }

  private async getMacOSEncryptionKey(browserName: string): Promise<Buffer> {
    const browser = BROWSERS.find((entry) => entry.name === browserName)
    if (!browser) {
      throw new Error(`Unsupported browser: ${browserName}`)
    }

    const password = execSync(
      `security find-generic-password -s ${JSON.stringify(browser.keychainService)} -a ${JSON.stringify(browser.keychainAccount)} -w`,
      { encoding: 'utf8' },
    ).trimEnd()

    return pbkdf2Sync(password, CHROMIUM_SALT, 1003, 16, 'sha1')
  }

  private decryptChromiumValue(encryptedValue: Buffer, key: Buffer): string {
    const encryptedPayload =
      encryptedValue.subarray(0, 3).toString('utf8') === 'v10' ? encryptedValue.subarray(3) : encryptedValue
    const decipher = createDecipheriv('aes-128-cbc', key, CHROMIUM_IV)
    decipher.setAutoPadding(true)
    const decrypted = Buffer.concat([decipher.update(encryptedPayload), decipher.final()])

    // Chromium v130+ prepends a 32-byte integrity hash before the actual cookie value
    if (decrypted.length > 32) {
      const hasNonPrintablePrefix = decrypted.subarray(0, 32).some((b) => b < 0x20 || b > 0x7e)
      if (hasNonPrintablePrefix) {
        return decrypted.subarray(32).toString('utf8')
      }
    }

    return decrypted.toString('utf8')
  }

  private getBrowserByPath(databasePath: string): BrowserConfig | undefined {
    return BROWSERS.find(
      (browser) => databasePath.includes(`${browser.macPath}/`) || databasePath.includes(`${browser.linuxPath}/`),
    )
  }

  private addCandidate(candidates: Map<string, ExtractedSessionCandidate>, candidate: ExtractedSessionCandidate): void {
    const existing = candidates.get(candidate.sessionCookie)
    if (!existing || existing.lastAccessUtc < candidate.lastAccessUtc) {
      candidates.set(candidate.sessionCookie, candidate)
    }
  }

  private findBrowserCookieDatabases(browser: BrowserConfig): string[] {
    const browserRoot = this.getBrowserRoot(browser)
    if (!browserRoot || !existsSync(browserRoot)) {
      return []
    }

    return readdirSync(browserRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && this.isSupportedProfileDirectory(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => join(browserRoot, entry.name, 'Cookies'))
      .filter((databasePath) => existsSync(databasePath))
  }

  private getBrowserRoot(browser: BrowserConfig): string | null {
    if (this.platform === 'darwin') {
      return join(this.homeDirectory, 'Library', 'Application Support', browser.macPath)
    }

    if (this.platform === 'linux') {
      return join(this.homeDirectory, '.config', browser.linuxPath)
    }

    return null
  }

  private isSupportedProfileDirectory(profileName: string): boolean {
    return profileName === 'Default' || PROFILE_DIR_PATTERN.test(profileName)
  }

  private normalizeLastAccessUtc(lastAccessUtc: number | bigint | null | undefined): number {
    if (typeof lastAccessUtc === 'bigint') {
      return Number(lastAccessUtc)
    }

    return typeof lastAccessUtc === 'number' ? lastAccessUtc : 0
  }
}

function copySqliteDatabase(sourcePath: string, targetPath: string): void {
  copyFileSync(sourcePath, targetPath)

  for (const suffix of ['-wal', '-shm']) {
    const sidecarSourcePath = `${sourcePath}${suffix}`
    if (!existsSync(sidecarSourcePath)) {
      continue
    }

    copyFileSync(sidecarSourcePath, `${targetPath}${suffix}`)
  }
}

function normalizeCookieBytes(value: ArrayBuffer | Uint8Array | Buffer | null): Buffer | null {
  if (!value) {
    return null
  }

  if (Buffer.isBuffer(value)) {
    return value
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value)
  }

  return Buffer.from(value)
}

function normalizeCookieText(value: ArrayBuffer | Uint8Array | Buffer | string | null): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  const bytes = normalizeCookieBytes(value)
  return bytes ? bytes.toString('utf8').trim() : ''
}
