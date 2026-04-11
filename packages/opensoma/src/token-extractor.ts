import { execSync } from 'node:child_process'
import { createDecipheriv, pbkdf2Sync } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

const COOKIE_QUERY =
  "SELECT encrypted_value, value FROM cookies WHERE host_key LIKE '%swmaestro.ai' AND name = 'JSESSIONID' ORDER BY last_access_utc DESC LIMIT 1"
const CHROMIUM_SALT = 'saltysalt'
const CHROMIUM_IV = Buffer.alloc(16, 0x20)

type BrowserConfig = {
  name: string
  macPath: string
  linuxPath: string
  keychainService: string
  keychainAccount: string
}

type CookieRow = {
  encrypted_value: Uint8Array | Buffer | null
  value: string | null
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

  const Database = require('better-sqlite3')
  const db = new Database(dbPath, { readonly: true })
  try {
    return db.prepare(COOKIE_QUERY).get() as CookieRow | undefined
  } finally {
    db.close()
  }
}

export class TokenExtractor {
  constructor(
    private readonly platform: NodeJS.Platform = process.platform,
    private readonly homeDirectory: string = homedir(),
  ) {}

  async extract(): Promise<{ sessionCookie: string } | null> {
    for (const databasePath of this.findCookieDatabases()) {
      const browser = this.getBrowserByPath(databasePath)
      if (!browser) {
        continue
      }

      const tempDirectory = mkdtempSync(join(tmpdir(), 'opensoma-cookie-db-'))
      const tempDatabasePath = join(tempDirectory, 'Cookies')

      try {
        copyFileSync(databasePath, tempDatabasePath)

        const row = queryCookieDb(tempDatabasePath)
        if (!row) {
          continue
        }

        const plaintextValue = typeof row.value === 'string' ? row.value.trim() : ''
        if (plaintextValue) {
          return { sessionCookie: plaintextValue }
        }

        if (!row.encrypted_value || row.encrypted_value.length === 0) {
          continue
        }

        const decryptedValue = await this.decryptCookie(Buffer.from(row.encrypted_value), browser.name)
        if (decryptedValue) {
          return { sessionCookie: decryptedValue }
        }
      } catch {
        continue
      } finally {
        rmSync(tempDirectory, { recursive: true, force: true })
      }
    }

    return null
  }

  findCookieDatabases(): string[] {
    const browserPaths =
      this.platform === 'darwin'
        ? BROWSERS.map((browser) =>
            join(this.homeDirectory, 'Library', 'Application Support', browser.macPath, 'Default', 'Cookies'),
          )
        : this.platform === 'linux'
          ? BROWSERS.map((browser) => join(this.homeDirectory, '.config', browser.linuxPath, 'Default', 'Cookies'))
          : []

    return browserPaths.filter((databasePath) => existsSync(databasePath))
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
}
