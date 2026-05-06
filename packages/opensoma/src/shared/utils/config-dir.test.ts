import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { CONFIG_DIR_ENV_VAR, getConfigDir } from './config-dir'

let originalValue: string | undefined

beforeEach(() => {
  originalValue = process.env[CONFIG_DIR_ENV_VAR]
  delete process.env[CONFIG_DIR_ENV_VAR]
})

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[CONFIG_DIR_ENV_VAR]
  } else {
    process.env[CONFIG_DIR_ENV_VAR] = originalValue
  }
})

describe('getConfigDir', () => {
  it('falls back to ~/.config/opensoma when env var is unset', () => {
    expect(getConfigDir()).toBe(join(homedir(), '.config', 'opensoma'))
  })

  it('returns OPENSOMA_CONFIG_DIR when set', () => {
    process.env[CONFIG_DIR_ENV_VAR] = '/custom/config/path'
    expect(getConfigDir()).toBe('/custom/config/path')
  })

  it('falls back to default when env var is empty string', () => {
    process.env[CONFIG_DIR_ENV_VAR] = ''
    expect(getConfigDir()).toBe(join(homedir(), '.config', 'opensoma'))
  })

  it('preserves relative paths verbatim', () => {
    process.env[CONFIG_DIR_ENV_VAR] = './local-config'
    expect(getConfigDir()).toBe('./local-config')
  })
})
