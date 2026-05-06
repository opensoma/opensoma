import { homedir } from 'node:os'
import { join } from 'node:path'

export const CONFIG_DIR_ENV_VAR = 'OPENSOMA_CONFIG_DIR'

/**
 * Resolves the directory used to persist opensoma state (credentials, pending
 * reservations, etc.).
 *
 * Resolution order:
 *   1. `OPENSOMA_CONFIG_DIR` environment variable (if set and non-empty)
 *   2. `~/.config/opensoma`
 */
export function getConfigDir(): string {
  const fromEnv = process.env[CONFIG_DIR_ENV_VAR]
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv
  }
  return join(homedir(), '.config', 'opensoma')
}
