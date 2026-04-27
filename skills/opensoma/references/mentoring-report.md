# Mentoring Report Writing Guide

Complete methodology for creating and submitting mentoring reports on the SWMaestro platform via `opensoma` CLI. Reports can be written from various source materials — transcriptions, lecture slides, personal notes, or even just the mentor's memory of the session.

## Prerequisites

- `opensoma` CLI authenticated (`opensoma auth status` to verify)
- `agent-browser` CLI for PDF evidence capture (required)

## Source Types

Different source materials require different extraction approaches. Identify what you're working with:

| Source Type | What You Have | Extraction Approach |
|-------------|---------------|---------------------|
| **Transcription** | STT output from recording (`.md`, `.txt`, `.json`) | Extract topics, advice given, action items from conversation flow. Ignore inaccurate speaker labels — focus on content substance. |
| **Lecture Slides** | 강의자료, PDF, PPT | Summarize each section/slide group. Note key concepts taught, examples used, Q&A if available. |
| **Handwritten/Personal Notes** | Mentor or mentee notes, bullet points | Expand into structured prose. Fill gaps from memory or context. |
| **Memory Only** | No written source — mentor recalls the session | Ask the mentor for key topics, decisions made, action items. Structure from their answers. |
| **Mixed** | Combination of above | Cross-reference sources. Use the most detailed source as primary, others to fill gaps. |

### Source-Specific Tips

**Transcription**: Speaker labels from STT are often inaccurate — don't rely on them for attribution. Focus on what was said, not who said it, unless names are explicitly mentioned in the conversation. Look for metadata (date, duration) in the file header.

**Lecture Slides**: The report should capture what was *taught and discussed*, not just list slide titles. Include the mentor's explanations, emphasis points, and any live demos or examples that went beyond the slides.

**Notes**: Notes are typically terse. Expand abbreviations, add context that would be obvious to the note-taker but not to a report reader. Ask the user for clarification if notes are ambiguous.

**Memory Only**: Ask structured questions — "What were the main topics?", "What advice did you give?", "Were there action items?" — then compose the report from the answers.

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

Source materials often only contain first names or nicknames. Get full names from the mentoring session detail page — the attendee table on the platform shows full names (성+이름):

```bash
opensoma mentoring get <session-id> --pretty
```

If full names aren't in the CLI output, use the browser evidence capture step (Step 4) — the session page shows the full attendee table with names.

### Step 3: Write the report content

Extract information from whatever source material is available and compose the report.

#### Content writing guidelines

- Write in **plain text**, not HTML
- Structure with numbered sections (1. Topic, 2. Topic, ...)
- Use `- bullet points` for lists within sections
- Use full names when listing per-person notes (e.g., `- 이수민: ...`)
- Cover: what was discussed, what was taught/advised, what action items were agreed
- Be comprehensive but concise — capture the substance, not filler
- `mentorOpinion` and `etc` fields: leave empty by default. Only fill if the user explicitly requests or there are genuine special notes worth recording

#### Content structure by session type

**자유 멘토링 (MRC010)** — interactive small-group sessions:

```
1. [Discussion Topic A]

[What was discussed, what questions were asked, what advice was given]

- [Key point or per-person detail]
- [Key point or per-person detail]

2. [Discussion Topic B]

[Summary of discussion]

3. [Action Items / Next Steps]

- [What was agreed]
- [What to prepare for next session]
```

**멘토 특강 (MRC020)** — lecture/seminar format:

```
1. [Lecture Topic / Section]

[What was taught, key concepts covered, examples demonstrated]

- [Important takeaway]
- [Important takeaway]

2. [Hands-on / Demo Section] (if applicable)

[What participants practiced, tools used, outcomes]

3. [Q&A Summary] (if applicable)

- [Question]: [Answer/discussion]
- [Question]: [Answer/discussion]
```

### Step 4: Capture evidence PDF

The evidence file should be a PDF of the mentoring session page from swmaestro.ai. This proves the session was officially registered and shows the attendee list.

#### Required PDF Contents (MUST verify before submitting)

The captured PDF **must** contain all of the following fields, visible and complete. If any field is missing, truncated, or blank, the capture is invalid — do not submit the report until the PDF is correct.

| Field | Where it appears on the session page | How to verify |
|-------|--------------------------------------|---------------|
| **Title** (제목) | Header of the view page | Matches the mentoring title from `mentoring get <id>` |
| **Content** (내용) | Main body section | Full body text is rendered, not collapsed or cut off |
| **Venue** (장소) | Info table | Matches `--venue` value (e.g., `토즈-강남역토즈타워점`) |
| **Schedule** (일시) | Info table | Date + start–end time match `--date`, `--start-time`, `--end-time` |
| **Attendee list** (참석자/신청자 명단) | Attendee table at the bottom | Every full name used in `--attendance-names` appears in the table |

Before saving the PDF, take an `agent-browser snapshot -i` and confirm each of the five fields above is present. If the attendee table is hidden behind a tab or pagination control, expand/navigate it first, then re-capture.

#### Browser login via `opensoma agent-browser launch`

The swmaestro.ai login uses a multi-step form submission that `agent-browser` cannot handle via normal form filling. Use `opensoma agent-browser launch` to start agent-browser with the current opensoma session cookie pre-injected — the JSESSIONID is written to a private temp state file (`0o700` dir, `0o600` file, cleaned up on exit) and never appears on stdout, in argv, or in shell history.

```bash
# 1. Open the mentoring session page pre-authenticated.
#    opensoma auto-recovers an expired session before launching.
opensoma agent-browser launch \
  "https://www.swmaestro.ai/sw/mypage/mentoLec/view.do?qustnrSn=<SESSION_ID>&menuNo=200046"

# 2. Verify login succeeded (should show 로그아웃, not 로그인) AND that all
#    required fields are visible: title, content, venue, schedule, attendee list.
#    If the attendee table is hidden behind a tab, expand it first.
agent-browser snapshot -i

# 3. Save as PDF
agent-browser pdf /tmp/mentoring-<SESSION_ID>.pdf

# 4. Re-open the saved PDF and confirm all five required fields are present
#    and legible (title, content, venue, schedule, attendee list). If anything
#    is missing or truncated, re-launch from step 1 before submitting the report.

# 5. Clean up
agent-browser close
```

`opensoma agent-browser launch` only accepts `https://www.swmaestro.ai` or `https://swmaestro.ai` URLs (the cookie is host-scoped to the swmaestro.ai server that issued it). It exits with the agent-browser exit code, so it's safe to chain in scripts.

### Step 5: Submit the report

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
