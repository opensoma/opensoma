# Mentoring Report Writing Guide

Complete methodology for creating and submitting mentoring reports on the SWMaestro platform via `opensoma` CLI. This covers the full pipeline: reading transcriptions, extracting structured data, capturing evidence, and submitting/updating reports.

## Prerequisites

- `opensoma` CLI authenticated (`opensoma auth status` to verify)
- `agent-browser` CLI for PDF evidence capture (required)

## Report Field Reference

### Required Fields

| CLI Flag | Description | Notes |
|----------|-------------|-------|
| `--region <S\|B>` | Mentee region | `S`=Seoul, `B`=Busan |
| `--type <MRC010\|MRC020>` | Report type | `MRC010`=자유 멘토링, `MRC020`=멘토 특강 |
| `--date <yyyy-mm-dd>` | Session date | |
| `--venue <venue>` | Venue name | Must match platform values exactly (see Venues below) |
| `--attendance-count <n>` | Number of attendees | Mentees only, not mentor |
| `--attendance-names <names>` | Attendee full names | Comma-separated, use full names (성+이름) |
| `--start-time <HH:mm>` | Session start | 24-hour format |
| `--end-time <HH:mm>` | Session end | Must be after start |
| `--subject <text>` | Topic | Min 10 characters |
| `--content <text>` | Session content | Min 100 characters, **plain text** (not HTML) |
| `--file <path>` | Evidence file | PDF of mentoring session page recommended |

### Optional Fields

| CLI Flag | Description |
|----------|-------------|
| `--team <names>` | Team names. Only use for private mentoring (정규멘토링), otherwise use `-` |
| `--mentor-opinion <text>` | Mentor's opinion. Leave empty unless specific feedback needed |
| `--except-start <HH:mm>` | Break start time |
| `--except-end <HH:mm>` | Break end time |
| `--except-reason <text>` | Break reason |
| `--non-attendance <names>` | Absent mentee names |
| `--etc <text>` | Additional notes. Leave empty unless specific notes needed |

### Known Venues

- **토즈 (외부)**: 토즈-광화문점, 토즈-양재점, 토즈-강남컨퍼런스센터점, 토즈-건대점, 토즈-강남역토즈타워점, 토즈-선릉점, 토즈-역삼점, 토즈-홍대점, 토즈-신촌비즈니스센터점
- **온라인**: 온라인(Webex)
- **소마 12층**: 스페이스 A1–A8, M1, M2
- **소마 7층**: 스페이스 S

## Workflow

### Step 1: Identify the mentoring session

```bash
opensoma mentoring list --search "author:@me" --pretty
```

Find the session by date/time. Note the session ID for evidence capture later.

### Step 2: Get attendee full names

Transcriptions usually only contain first names. Get full names from the mentoring session detail page — the attendee table on the platform shows full names (성+이름):

```bash
opensoma mentoring get <session-id> --pretty
```

If full names aren't in the CLI output, use the browser evidence capture step (Step 4) — the session page shows the full attendee table with names.

### Step 3: Extract information from transcription

From the transcription or meeting notes, extract:

1. **Date, time, venue** — from metadata or context clues
2. **Attendee names** — cross-reference with Step 2 for full names
3. **Content** — the substantive discussion, structured into logical sections

#### Content writing guidelines

- Write in **plain text**, not HTML
- Structure with numbered sections (1. Topic, 2. Topic, ...)
- Use `- bullet points` for lists within sections
- Use names when listing per-person notes (e.g., `- 이수민: ...`)
- Cover: what was discussed, what advice was given, what action items were agreed
- Be comprehensive but concise — capture the substance, skip filler conversation
- Ignore speaker labels in transcriptions if they're inaccurate — focus on the content
- `mentorOpinion` and `etc` fields: leave empty by default. Only fill if the user explicitly requests or there are genuine special notes worth recording

#### Content structure template

```
1. [First Topic]

[Summary paragraph]

- [Detail point]
- [Detail point]

2. [Second Topic]

[Summary paragraph]

- [Per-person or per-item details]

3. [Recommendations / Action Items]

- [Action item 1]
- [Action item 2]
```

### Step 4: Capture evidence PDF

The evidence file should be a PDF of the mentoring session page from swmaestro.ai. This proves the session was officially registered and shows the attendee list.

#### Browser login via CDP cookie injection

The swmaestro.ai login uses a multi-step form submission that `agent-browser` cannot handle via normal form filling. Instead, inject the opensoma session cookie directly via Chrome DevTools Protocol:

```bash
# 1. Read the session cookie from opensoma credentials
COOKIE=$(cat ~/.config/opensoma/credentials.json | bun -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.credentials.sessionCookie);
")

# 2. Open any swmaestro page to establish the domain
agent-browser open https://www.swmaestro.ai/sw/main/main.do

# 3. Get the CDP page WebSocket URL
CDP_PORT=$(agent-browser get cdp-url | grep -oE '[0-9]+' | head -1)
PAGE_WS=$(curl -s http://127.0.0.1:$CDP_PORT/json | bun -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.find(t => t.type === 'page')?.webSocketDebuggerUrl || '');
")

# 4. Inject JSESSIONID via CDP (httpOnly — cannot be set via document.cookie)
bun -e "
const ws = new WebSocket('$PAGE_WS');
ws.onopen = () => {
  ws.send(JSON.stringify({
    id:1, method:'Network.setCookie',
    params:{name:'JSESSIONID', value:'$COOKIE',
            domain:'www.swmaestro.ai', path:'/', httpOnly:true, secure:false}
  }));
};
ws.onmessage = (e) => { console.log(e.data); ws.close(); };
setTimeout(() => process.exit(0), 3000);
"

# 5. Navigate to the mentoring session page (now authenticated)
agent-browser open "https://www.swmaestro.ai/sw/mypage/mentoLec/view.do?qustnrSn=<SESSION_ID>&menuNo=200046"

# 6. Verify login succeeded (should show 로그아웃, not 로그인)
agent-browser snapshot -i

# 7. Save as PDF
agent-browser pdf /tmp/mentoring-<SESSION_ID>.pdf

# 8. Clean up
agent-browser close
```

### Step 5: Submit the report

Save the content to a temp file and submit:

```bash
CONTENT=$(cat /tmp/report-content.txt)

opensoma report create \
  --region S \
  --type MRC010 \
  --date 2026-04-08 \
  --venue "토즈-강남역토즈타워점" \
  --attendance-count 3 \
  --attendance-names "김철수,이영희,박민수" \
  --start-time 20:00 \
  --end-time 22:00 \
  --subject "프로젝트 방향성 논의" \
  --content "$CONTENT" \
  --team "-" \
  --file /tmp/mentoring-9246.pdf \
  --pretty
```

### Step 6: Verify

```bash
opensoma report list --pretty
```

Confirm the new report appears with status "접수중".

### Step 7: Update if needed

Use `report update` for partial updates — only specify the fields you want to change:

```bash
opensoma report update <report-id> \
  --content "$NEW_CONTENT" \
  --file /tmp/new-evidence.pdf \
  --pretty
```

## Evidence File Rules

Per SWMaestro OT guidelines:
- Evidence photo/capture is **not mandatory** — only the report itself is required for mentoring hours to be recognized
- The `--file` CLI flag is technically required, so always attach something
- Best: PDF of mentoring session page (proves official registration + shows attendee list)
- Acceptable: Webex attendee screenshot, session detail export
- The report content is the primary record — write it thoroughly regardless of evidence quality

## Notes File (Optional)

Save a structured markdown note alongside the report for personal records:

```
YYYY-MM-DD 멘토링 보고 - <session topic>.md
```

Include a metadata table, subject, content sections, mentorOpinion, and etc — mirroring the report fields for easy reference and future edits.
