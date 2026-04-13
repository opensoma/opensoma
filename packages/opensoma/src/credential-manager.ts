import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { Credentials } from './types'

interface EncryptedSecret {
  ciphertext: string
  iv: string
  tag: string
}

interface StoredCredentials extends Omit<Credentials, 'password'> {
  encryptedPassword?: EncryptedSecret
}

export interface CredentialConfig {
  credentials: Credentials | null
}

export class CredentialManager {
  private configDir: string
  private credentialsPath: string
  private encryptionKeyPath: string

  constructor(configDir?: string) {
    this.configDir = configDir ?? join(homedir(), '.config', 'opensoma')
    this.credentialsPath = join(this.configDir, 'credentials.json')
    this.encryptionKeyPath = join(this.configDir, 'credentials.key')
  }

  async load(): Promise<CredentialConfig> {
    if (!existsSync(this.credentialsPath)) {
      return { credentials: null }
    }

    try {
      const content = await readFile(this.credentialsPath, 'utf8')
      const parsed = JSON.parse(content) as { credentials: StoredCredentials | null }
      return {
        credentials: parsed.credentials ? await this.hydrateCredentials(parsed.credentials) : null,
      }
    } catch {
      return { credentials: null }
    }
  }

  async save(config: CredentialConfig): Promise<void> {
    await mkdir(this.configDir, { recursive: true })
    await writeFile(
      this.credentialsPath,
      JSON.stringify(
        {
          credentials: config.credentials ? await this.serializeCredentials(config.credentials) : null,
        },
        null,
        2,
      ),
    )
    await chmod(this.credentialsPath, 0o600)
  }

  async getCredentials(): Promise<Credentials | null> {
    const config = await this.load()
    return config.credentials
  }

  async setCredentials(credentials: Credentials): Promise<void> {
    await this.save({ credentials })
  }

  async remove(): Promise<void> {
    await rm(this.credentialsPath, { force: true })
    await rm(this.encryptionKeyPath, { force: true })
  }

  private async hydrateCredentials(credentials: StoredCredentials): Promise<Credentials> {
    if (!credentials.encryptedPassword) {
      return credentials
    }

    const { encryptedPassword, ...rest } = credentials
    const password = await this.decryptSecret(encryptedPassword)
    return password ? { ...rest, password } : rest
  }

  private async serializeCredentials(credentials: Credentials): Promise<StoredCredentials> {
    if (!credentials.password) {
      return credentials
    }

    const { password, ...rest } = credentials
    return {
      ...rest,
      encryptedPassword: await this.encryptSecret(password),
    }
  }

  private async encryptSecret(secret: string): Promise<EncryptedSecret> {
    const key = await this.getOrCreateEncryptionKey()
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    }
  }

  private async decryptSecret(secret: EncryptedSecret): Promise<string> {
    const key = await this.getExistingEncryptionKey()
    if (!key) {
      return ''
    }

    try {
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(secret.iv, 'base64'))
      decipher.setAuthTag(Buffer.from(secret.tag, 'base64'))
      const decrypted = Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, 'base64')), decipher.final()])
      return decrypted.toString('utf8')
    } catch {
      return ''
    }
  }

  private async getOrCreateEncryptionKey(): Promise<Buffer> {
    if (existsSync(this.encryptionKeyPath)) {
      return Buffer.from(await readFile(this.encryptionKeyPath, 'utf8'), 'base64')
    }

    await mkdir(this.configDir, { recursive: true })
    const key = randomBytes(32)
    await writeFile(this.encryptionKeyPath, key.toString('base64'))
    await chmod(this.encryptionKeyPath, 0o600)
    return key
  }

  private async getExistingEncryptionKey(): Promise<Buffer | null> {
    if (!existsSync(this.encryptionKeyPath)) {
      return null
    }

    try {
      return Buffer.from(await readFile(this.encryptionKeyPath, 'utf8'), 'base64')
    } catch {
      return null
    }
  }
}
