# Common Patterns

## Checking today's schedule

```bash
opensoma dashboard show --pretty
opensoma mentoring list --status open --pretty
opensoma room list --date $(date +%Y-%m-%d) --pretty
```

## Creating a mentoring session and reserving a room

```bash
# 1. Check room availability
opensoma room list --date 2026-04-15 --pretty

# 2. Reserve the room
opensoma room reserve --room 17 --date 2026-04-15 --slots "14:00,14:30,15:00,15:30" --title "TypeScript 기초"

# 3. Create the mentoring session
opensoma mentoring create \
  --title "TypeScript 기초 특강" \
  --type lecture \
  --date 2026-04-15 \
  --start 14:00 \
  --end 16:00 \
  --venue "스페이스 A1" \
  --max-attendees 8 \
  --reg-start 2026-04-10 \
  --reg-end 2026-04-14
```

## Checking a specific mentoring session

```bash
# List to find the ID
opensoma mentoring list --pretty

# Get full details
opensoma mentoring get 9572 --pretty
```

## Viewing team and member info

```bash
opensoma team show --pretty
opensoma member show --pretty
```

## Checking notices

```bash
opensoma notice list --pretty
opensoma notice get 1234 --pretty
```
