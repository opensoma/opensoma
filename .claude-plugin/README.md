# OpenSoma

SWMaestro MyPage CLI & SDK for AI agents.

## Overview

OpenSoma wraps the SWMaestro MyPage platform (swmaestro.ai) to provide programmatic access to:

- **Mentoring sessions** - List, create, apply, cancel, and manage mentoring sessions
- **Meeting room reservations** - Reserve rooms at the SWMaestro center
- **Dashboard** - View upcoming sessions, notices, and personal information
- **Team info** - Access team details and member information
- **Notices** - Read official announcements

## Installation

```bash
npm install -g opensoma
```

## Authentication

### Browser Session Extraction

Extract existing session from Chromium-based browsers:

```bash
opensoma auth extract
```

### Login with Credentials

```bash
opensoma auth login --username <email> --password <password>
```

Or use environment variables:

```bash
export OPENSOMA_USERNAME=<email>
export OPENSOMA_PASSWORD=<password>
opensoma auth login
```

## Commands

All commands output JSON. Add `--pretty` for formatted output.

### Dashboard

```bash
opensoma dashboard show
```

### Mentoring

```bash
# List sessions
opensoma mentoring list
opensoma mentoring list --status open --type public

# Search
opensoma mentoring list --search "keyword"

# Get details
opensoma mentoring get <id>

# Create session
opensoma mentoring create \
  --title "Title" \
  --type public \
  --date 2025-01-15 \
  --start 14:00 \
  --end 16:00 \
  --venue "스페이스 A1"

# Apply to session
opensoma mentoring apply <id>

# Cancel application
opensoma mentoring cancel --apply-sn <number> --qustnr-sn <number>

# View history
opensoma mentoring history
```

### Meeting Rooms

```bash
# List rooms
opensoma room list --date 2025-01-15

# Check availability
opensoma room available <roomId> --date 2025-01-15

# Reserve
opensoma room reserve \
  --room A1 \
  --date 2025-01-15 \
  --slots "14:00,14:30,15:00" \
  --title "Team Meeting"
```

### Notices

```bash
opensoma notice list
opensoma notice get <id>
```

### Team & Member

```bash
opensoma team show
opensoma member show
```

## SDK

```typescript
import { SomaClient } from 'opensoma'

const client = new SomaClient({
  username: process.env.OPENSOMA_USERNAME,
  password: process.env.OPENSOMA_PASSWORD,
})
await client.login()

// Use the SDK
const dashboard = await client.dashboard.get()
const { items } = await client.mentoring.list({ status: 'open' })
```

## License

MIT
