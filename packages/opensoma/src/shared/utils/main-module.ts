import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Determines whether `moduleUrl` belongs to the script the process was launched
 * with — i.e. the module is the executable entry point, not an import.
 *
 * `process.argv[1]` keeps the launch path exactly as invoked, which under
 * Node.js may be a symlink (the npm `bin` symlink at e.g.
 * `/usr/local/bin/opensoma` -> `../lib/node_modules/opensoma/dist/src/cli.js`)
 * or otherwise non-canonical. `import.meta.url`, by contrast, is always the
 * fully resolved (symlink-followed) module path. Comparing the two with `===`
 * therefore fails whenever the CLI is launched through a symlink, silently
 * skipping `program.parse()` so the CLI produces no output at all.
 *
 * Canonicalizing both paths with `realpathSync` before comparing fixes this
 * while still returning `false` when the module is merely imported.
 */
export function isMainModule(launchPath: string | undefined, moduleUrl: string): boolean {
  if (!launchPath) {
    return false
  }

  const modulePath = fileURLToPath(moduleUrl)
  if (launchPath === modulePath) {
    return true
  }

  try {
    return realpathSync(launchPath) === realpathSync(modulePath)
  } catch {
    return false
  }
}
