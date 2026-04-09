# AGENTS.md

## Project Overview

SWMaestro MyPage CLI & SDK for AI agents. Wraps the SWMaestro platform (swmaestro.ai) to provide programmatic access to mentoring sessions, meeting room reservations, dashboard, notices, team info, and member profiles.

Runtime: Bun for development, Node.js-compatible output for npm distribution.

## Commands

```bash
# Install dependencies
bun install

# Run all unit tests
bun test

# Type checking
bun run typecheck

# Lint (oxlint)
bun run lint
bun run lint:fix

# Format (oxfmt)
bun run format
```

Always use `bun` — never `node`, `npm`, `npx`, `yarn`, or `pnpm`. Bun loads `.env` automatically; do not use dotenv.

## TypeScript Execution Model

### Local Development

Bun runs TypeScript directly — no compilation step needed.

- `bin` entry in `package.json` points to `./src/cli.ts`
- CLI entry point uses `#!/usr/bin/env bun` shebang
- Run directly: `bun src/cli.ts`

### Production Build (Publish)

`bun run build` compiles to `dist/` for npm consumers who don't have Bun.

1. `tsc` compiles `src/` → `dist/src/` (JS + declarations + source maps)
2. `tsc-alias` resolves `@/*` path aliases in the compiled output
3. `scripts/postbuild.ts` replaces `#!/usr/bin/env bun` → `#!/usr/bin/env node` in CLI file
4. `module` and `main` in `package.json` point to `dist/src/index.js`

npm consumers run compiled JS via Node.js. The `prepublishOnly` script runs the build, then `scripts/prepublish.ts` rewrites `bin` paths from `./src/*.ts` to `dist/src/*.js`. After publish, `postpublish` restores `package.json` via `git checkout`.

### Key Distinction

|             | Local (dev)       | Published (npm)          |
| ----------- | ----------------- | ------------------------ |
| Runtime     | Bun               | Node.js                  |
| Entry files | `src/cli.ts`      | `dist/src/cli.js`        |
| Shebang     | `#!/usr/bin/env bun` | `#!/usr/bin/env node` |
| Compilation | None (Bun runs TS) | `tsc` → `dist/`         |

## Release

Use the **Release** GitHub Actions workflow (`workflow_dispatch`). Enter the version (e.g., `0.2.0`) — it typechecks, lints, tests, bumps version in `package.json`, commits, tags, publishes to npm, and creates a GitHub Release. Tags have no `v` prefix.

### Version Decision

When asked to release without a specific version:

- **Patch** (x.y.Z) — bug fixes, docs, refactors, non-breaking changes
- **Minor** (x.Y.0) — new features, new commands, new options, expanded capabilities

Decide automatically based on commits since last release. Do not ask the user. Never bump major unless the user explicitly requests it. If the user specifies a version, use it as-is.
