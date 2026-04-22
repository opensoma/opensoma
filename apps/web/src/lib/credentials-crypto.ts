import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ENV_VAR = 'OPENSOMA_CREDENTIAL_SECRET'

export interface StoredCredentials {
  username: string
  password: string
}

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env[ENV_VAR]
  if (!raw) {
    throw new Error(
      `${ENV_VAR} is required for encrypting stored credentials. ` + 'Generate one with: openssl rand -base64 32',
    )
  }
  const decoded = Buffer.from(raw, 'base64')
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(`${ENV_VAR} must be a base64-encoded 32-byte key (got ${decoded.length} bytes after decoding).`)
  }
  cachedKey = decoded
  return cachedKey
}

export function encryptCredentials(credentials: StoredCredentials): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plaintext = Buffer.from(JSON.stringify(credentials), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`
}

export function decryptCredentials(token: string): StoredCredentials | null {
  try {
    const key = getKey()
    const [ivB64, tagB64, ctB64, ...rest] = token.split('.')
    if (!ivB64 || !tagB64 || !ctB64 || rest.length > 0) return null
    const iv = Buffer.from(ivB64, 'base64url')
    const tag = Buffer.from(tagB64, 'base64url')
    const ciphertext = Buffer.from(ctB64, 'base64url')
    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return null
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    const parsed = JSON.parse(plaintext) as Partial<StoredCredentials>
    if (typeof parsed.username !== 'string' || typeof parsed.password !== 'string') return null
    return { username: parsed.username, password: parsed.password }
  } catch {
    return null
  }
}

export function resetCredentialKeyCache(): void {
  cachedKey = null
}
