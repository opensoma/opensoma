# AGENTS.md

## Project Overview

SWMaestro MyPage CLI & SDK for AI agents. Wraps the SWMaestro platform (swmaestro.ai) to provide programmatic access to mentoring sessions, meeting room reservations, dashboard, notices, team info, member profiles, and events.

Runtime: Bun for development, Node.js-compatible output for npm distribution.

**Monorepo Structure**: The publishable npm package is at `packages/opensoma/`. The root is `opensoma-monorepo` (private) and contains the web app at `apps/web/`.

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

Use the **Release** GitHub Actions workflow (`workflow_dispatch`). It typechecks, lints, tests, bumps version in `package.json` / `README.md` / `.claude-plugin/plugin.json` / `skills/*/SKILL.md`, commits, tags, publishes to npm with provenance, and creates a GitHub Release.

```bash
gh workflow run release.yml -f version=0.3.0
```

Tags have no `v` prefix.

### Version Decision

When asked to release without a specific version:

- **Patch** (x.y.Z) — bug fixes, docs, refactors, non-breaking changes
- **Minor** (x.Y.0) — new features, new commands, new options, expanded capabilities

Decide automatically based on commits since last release. Do not ask the user. Never bump major unless the user explicitly requests it. If the user specifies a version, use it as-is.

## Testing Philosophy

### 1. Test behavior, not implementation

A good test survives refactors of its subject's internals and fails only when **observable behavior** changes. Concretely: if you renamed a private helper or split a function in two and tests broke, the tests were coupled to implementation.

**Acceptance bar: the mutation check.**

After writing a test, ask: "If I comment out the line of production code this test is supposed to guard, does the test fail?" If not, the test verifies nothing meaningful.

Applied during review: when adding a new step to a pipeline, commenting out the wiring MUST break at least one test. Otherwise the test suite gives false confidence.

### 2. Test at the right layer

Code has layers. Tests must target the layer that owns the behavior being verified.

- **CLI / UI layer** — prompts, spinners, `process.exit`, argument parsing. Hard to test, and rarely worth testing. Keep thin.
- **Domain / pipeline layer** — the actual logic: composition of steps, data transformations, orchestration. **This is the primary test surface.**
- **Primitive layer** — individual file writes, shell invocations, pure functions. Unit-test for edge cases not easily covered by pipeline tests.

When you find yourself mocking `@clack/prompts` or stubbing `process.cwd` to test domain logic, that's a signal: the domain logic is in the wrong place. Extract it into a pure function and test it directly.

### 3. Pipeline tests must verify composition, not just steps

For orchestrator functions that compose multiple sub-steps (pipelines, workflows, sagas):

- Unit tests on each sub-step are **necessary but not sufficient**.
- You also need tests that exercise the orchestrator end-to-end and assert on:
  - **Order of execution** (sequence of events / side-effect observable ordering)
  - **Data flow between steps** (step N sees the output of step N-1)
  - **Failure propagation** (fatal vs soft-fail semantics)

If a new step can be added, removed, or reordered without breaking a test, composition is untested.

**How to do it:** make the orchestrator emit observable events (progress callbacks, returned result structures, or async-iterator yields) and assert on the observed sequence.

### 4. One function, one concern

A function that both prompts the user AND runs business logic AND handles `process.exit` has three concerns and three reasons to change. Split them:

- The pure logic becomes testable without mocks.
- The I/O layer becomes small enough that manual review is sufficient.
- New steps get added to the pure layer and are caught by pipeline tests.

### 5. Test doubles sparingly

Every mock is a theory about how a collaborator behaves. Theories rot. Prefer:

1. **Real implementations with controlled inputs** — tmp directories, in-memory state, real subprocess calls when fast enough.
2. **Hand-rolled fakes** when the real thing is genuinely unavailable or too slow.
3. **Mocking libraries** only as a last resort, and only at module boundaries.

If a test requires mocking `@clack/prompts` just to exercise logic, refactor. Don't mock.

### 6. When to skip testing

Simple data classes, type-only files, auto-generated code, and trivial constants don't need tests. Use judgment — a test that only restates a literal is noise.

### 7. TDD is the default, not a ceremony

Write the failing test first when:

- Behavior is non-trivial
- Edge cases matter
- The API shape is unclear (tests force you to be a consumer)

Skip TDD for throwaway scripts or when the test setup outweighs the logic being tested. This is a tool, not a religion.

## PR & Commit Messages

Never use real names in PR titles, commit messages, or PR descriptions. Always use placeholders (e.g., `<name>`, `<user>`, `<author>`) if a name reference is needed.
