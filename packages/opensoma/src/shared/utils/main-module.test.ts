import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { isMainModule } from './main-module'

function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'opensoma-main-module-'))
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('isMainModule', () => {
  it('returns true when the launch path equals the module path', () => {
    withTempDir((dir) => {
      const file = join(dir, 'cli.js')
      writeFileSync(file, '')

      expect(isMainModule(file, pathToFileURL(file).href)).toBe(true)
    })
  })

  it('returns true when the launch path is a symlink to the module (npm bin case)', () => {
    withTempDir((dir) => {
      const real = join(dir, 'cli.js')
      const link = join(dir, 'opensoma')
      writeFileSync(real, '')
      symlinkSync(real, link)

      // Node sets process.argv[1] to the symlink path as invoked, while
      // import.meta.url is the canonical (symlink-resolved) module path.
      expect(isMainModule(link, pathToFileURL(real).href)).toBe(true)
    })
  })

  it('returns false when the launch path points to a different module (imported as a library)', () => {
    withTempDir((dir) => {
      const moduleFile = join(dir, 'cli.js')
      const otherEntry = join(dir, 'other.js')
      writeFileSync(moduleFile, '')
      writeFileSync(otherEntry, '')

      expect(isMainModule(otherEntry, pathToFileURL(moduleFile).href)).toBe(false)
    })
  })

  it('returns false when there is no launch path', () => {
    expect(isMainModule(undefined, import.meta.url)).toBe(false)
  })
})
