---
name: opensoma
description: Interact with SWMaestro MyPage - manage mentoring sessions, reserve meeting rooms, view dashboard, team info, notices, and member profiles
version: 0.1.0
allowed-tools: Bash(opensoma:*)
metadata:
  openclaw:
    requires:
      bins:
        - opensoma
    install:
      - kind: node
        package: opensoma
        bins: [opensoma]
---

# opensoma

A TypeScript CLI tool that enables AI agents and humans to interact with the SWMaestro MyPage platform (swmaestro.ai). Supports mentoring session management, meeting room reservations, dashboard viewing, notices, team info, and member profiles.

## Quick Start

```bash
# 1. Login
opensoma auth login --username user@example.com --password mypassword

# 2. Check dashboard
opensoma dashboard show --pretty

# 3. List mentoring sessions
opensoma mentoring list --status open --pretty

# 4. Reserve a meeting room
opensoma room list --date 2026-04-10 --pretty
opensoma room available 17 --date 2026-04-10 --pretty
opensoma room reserve --room 17 --date 2026-04-10 --slots "14:00,14:30,15:00,15:30" --title "팀 회의"
```

Credentials are stored at `~/.config/opensoma/credentials.json` after login.

## Authentication

### Login with credentials

```bash
opensoma auth login --username <email> --password <password>
```

Or use environment variables:
```bash
SOMA_USERNAME=user@example.com SOMA_PASSWORD=mypassword opensoma auth login
```

### Extract from browser (alternative)

If logged into swmaestro.ai in a Chromium browser (Chrome, Edge, Brave, Arc, Vivaldi):
```bash
opensoma auth extract
```

### Check status

```bash
opensoma auth status --pretty
```

### Logout

```bash
opensoma auth logout
```

## Commands

### Mentoring

```bash
# List sessions (filters: --status open|closed|my, --type free|lecture)
opensoma mentoring list --pretty
opensoma mentoring list --status open --type lecture --pretty
opensoma mentoring list --page 2 --pretty

# Get session detail
opensoma mentoring get <id> --pretty

# Create a session (mentor only)
opensoma mentoring create \
  --title "TypeScript 기초 특강" \
  --type lecture \
  --date 2026-04-15 \
  --start 14:00 \
  --end 16:00 \
  --venue "스페이스 M1" \
  --max-attendees 10 \
  --reg-start 2026-04-10 \
  --reg-end 2026-04-14 \
  --pretty

# Delete a session (author only)
opensoma mentoring delete <id>

# Apply to a session (mentee)
opensoma mentoring apply <id>

# Cancel application (mentee)
opensoma mentoring cancel --apply-sn <applySn> --qustnr-sn <qustnrSn>

# View application history (mentee)
opensoma mentoring history --pretty
```

### Meeting Rooms

```bash
# List rooms with availability for a date
opensoma room list --pretty
opensoma room list --date 2026-04-10 --pretty
opensoma room list --date 2026-04-10 --room A1 --pretty

# Check available time slots for a specific room
opensoma room available <roomId> --date 2026-04-10 --pretty

# Reserve a room (slots must be consecutive, max 8 = 4 hours)
opensoma room reserve \
  --room 17 \
  --date 2026-04-10 \
  --slots "14:00,14:30,15:00,15:30" \
  --title "팀 회의" \
  --attendees 4 \
  --notes "프로젝트 진행상황 공유" \
  --pretty
```

Room IDs: A1=17, A2=18, A3=19, A4=20, A5=21, A6=22, A7=23, A8=24

### Dashboard

```bash
opensoma dashboard show --pretty
```

Returns: user info, team info, mentoring session status, room reservation status.

### Notices

```bash
opensoma notice list --pretty
opensoma notice list --page 2 --pretty
opensoma notice get <id> --pretty
```

### Team

```bash
opensoma team show --pretty
```

Returns: team name, members list, mentor assignment.

### Member Info

```bash
opensoma member show --pretty
```

Returns: name, email, phone, organization, position, role.

### Events (행사 게시판)

```bash
opensoma event list --pretty
opensoma event get <id> --pretty
opensoma event apply <id>
```

## Output Format

All commands output compact JSON by default. Use `--pretty` for indented output.

```bash
# Compact (default, for AI agents)
opensoma mentoring list
# {"items":[...],"pagination":{"total":42,"currentPage":1,"totalPages":5}}

# Pretty (for humans)
opensoma mentoring list --pretty
# {
#   "items": [...],
#   "pagination": { ... }
# }
```

Errors are written to stderr:
```json
{"error":"Not logged in. Run: opensoma auth login"}
```

## Common Patterns

See [references/common-patterns.md](references/common-patterns.md) for detailed workflow examples.

## Troubleshooting

### "Not logged in" error
```bash
opensoma auth login --username <email> --password <password>
# Or extract from browser:
opensoma auth extract
```

### "No SWMaestro session found in any browser"
Login to swmaestro.ai in a supported Chromium browser first:
Chrome, Edge, Brave, Arc, Vivaldi, or Chromium.

### "command not found: opensoma"
```bash
bun install -g opensoma
# Or use npx:
npx opensoma --help
```

### Session expired
SWMaestro sessions expire. Re-login:
```bash
opensoma auth login --username <email> --password <password>
```

## Limitations

- SWMaestro uses server-rendered HTML, not a REST API. Data is parsed from HTML responses.
- Sessions may expire without notice. Re-login if commands start failing.
- File uploads (mentoring attachments) are not yet supported.
- Meeting room M1, M2, and 7층 S room IDs may need manual lookup.
