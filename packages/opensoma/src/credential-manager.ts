import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { Credentials } from './types'

export interface CredentialConfig {
  credentials: Credentials | null
}

export class CredentialManager {
  private configDir: string
  private credentialsPath: string

  constructor(configDir?: string) {
    this.configDir = configDir ?? join(homedir(), '.config', 'opensoma')
    this.credentialsPath = join(this.configDir, 'credentials.json')
  }

  async load(): Promise<CredentialConfig> {
    if (!existsSync(this.credentialsPath)) {
      return { credentials: null }
    }

    try {
      const content = await readFile(this.credentialsPath, 'utf8')
      return JSON.parse(content) as CredentialConfig
    } catch {
      return { credentials: null }
    }
  }

  async save(config: CredentialConfig): Promise<void> {
    await mkdir(this.configDir, { recursive: true })
    await writeFile(this.credentialsPath, JSON.stringify(config, null, 2))
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
  }
}
