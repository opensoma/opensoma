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
| `--mentor-opinion <text>` | Mentor's opinion. **Leave empty unless `--non-attendance` is set** — this field is for explaining absentee reasons, not general comments. See [Step 6.5 Rule 1](#rule-1--mentoropinion-is-gated-by-missing-members) |
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
- `mentorOpinion`: leave empty by default. Only fill when `--non-attendance` is set (the field exists to explain why specific mentees were absent), or when the user explicitly requests it. After submission, Step 6.5 verifies this rule is upheld.
- `etc`: leave empty by default. Only fill if the user explicitly requests or there are genuine special notes worth recording.

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

For 자유 멘토링 (`--type MRC010`), use a PDF of the mentoring session page from swmaestro.ai as the default evidence file. This proves the session was officially registered and shows the attendee list.

> **멘토 특강 (`--type MRC020`) requires stricter evidence — see [Lecture Reports: Three-Part Evidence](#lecture-reports-mrc020-three-part-evidence) below.** A single session-page PDF is **not** sufficient for lectures; you must merge a start photo, an end photo (both showing a visible displayed time and every participant's face), and the participant-list capture into one PDF.

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

### Step 6: Verify submission landed

`report create` returns `{ "ok": true }` on success but does **not** return the new report ID. Find it via `report list`:

```bash
opensoma report list --pretty
```

Confirm the new report appears at the top with status "접수중" and the expected `progressDate` / `title`. Note its `id`.

### Step 6.5: Post-submit verification (MANDATORY)

The platform happily accepts submissions that violate the agent-side rules in this guide (mentor opinion left in by accident, lecture evidence missing a photo, etc.). The CLI cannot prevent that. After every `report create` or `report update`, fetch the just-submitted report and verify the rules below were actually applied. If any check fails, fix it with `report update <id>` before moving on.

```bash
opensoma report get <id> --pretty
```

Relevant fields returned (see `ReportDetail` in the SDK):

| Field | Meaning | Verify |
|-------|---------|--------|
| `mentorOpinion` | 멘토 의견 (free-form mentor comment) | See rule 1 |
| `nonAttendanceNames` | Missing/absent member names (comma-separated) | Drives rule 1 |
| `etc` | 기타 (free-form misc note) | Should be empty unless the user explicitly asked for it |
| `files` | Array of attachment URLs on swmaestro.ai | See rule 2 |
| `attendanceCount` / `attendanceNames` | Attendee count and full names | Must match the participant-list capture exactly |

#### Rule 1 — `mentorOpinion` is gated by missing members

The 멘토 의견 field exists so the mentor can explain **why** specific mentees were absent. It is **not** a general comment box. Apply this conditional check:

- If `nonAttendanceNames` is **empty** (no missing members) → `mentorOpinion` **must also be empty**. A non-empty mentor opinion with no absences is almost always boilerplate the agent added on its own. Clear it:
  ```bash
  opensoma report update <id> --mentor-opinion ""
  ```
- If `nonAttendanceNames` is **non-empty** (one or more missing members) → `mentorOpinion` **should be non-empty** and must briefly explain each absentee's reason for missing. If it is empty in this case, ask the user for the reason and fill it in.

The same "leave empty unless explicitly asked" rule already applies to `etc` (see Step 3). Verify `etc` is empty too unless the user requested specific notes.

#### Rule 2 — Attachments contain the required evidence

Verify `files.length > 0` first — an empty `files` array means the upload silently dropped and the report is effectively unattached.

```bash
# Quick check from the JSON
opensoma report get <id> --pretty | jq '.files | length'
```

The CLI only exposes attachment **URLs**, not page counts, filenames, or content. To verify the attached PDF actually contains the required evidence, re-render the report view page and inspect the rendered attachment:

```bash
opensoma agent-browser launch \
  "https://www.swmaestro.ai/sw/mypage/mentoringReport/view.do?reportId=<ID>&menuNo=200049"
agent-browser snapshot -i
```

**For MRC010 (자유 멘토링):**

- [ ] `files.length >= 1`.
- [ ] The attachment listed under `첨부파일` is the session-page PDF and the filename roughly matches what you uploaded (`mentoring-<SESSION_ID>.pdf`).

**For MRC020 (멘토 특강) — three-part evidence is mandatory:**

The merged PDF from Step C must round-trip intact through the upload. Cropped uploads, single-photo uploads, and "I'll re-attach later" placeholders are all common silent failures.

- [ ] `files.length >= 1`.
- [ ] The attachment filename matches the merged PDF you produced in Step C (e.g. `lecture-evidence.pdf`), **not** a single photo or a stray participant-list-only PDF.
- [ ] Download the attached PDF and re-run the page-count sanity check from Step C. The attachment URL requires the swmaestro.ai session cookie, so download it through `opensoma agent-browser launch` on the report view page rather than a raw `curl` — agent-browser injects the same JSESSIONID opensoma uses for `report get` and follows the download link as a logged-in browser would. Once saved locally:
  ```bash
  pdfinfo /tmp/uploaded-evidence.pdf | grep '^Pages:'
  pdftotext /tmp/uploaded-evidence.pdf - | grep -c '신청완료'
  ```
  Page count must be `>= 3` (start photo + end photo + at least one participant-list page). `신청완료` count must be `>= attendanceCount`.
- [ ] Page 1 of the uploaded PDF is the start photo with the displayed time matching `progressStartTime`.
- [ ] Page 2 is the end photo with the displayed time matching `progressEndTime`.
- [ ] Remaining pages are the swmaestro.ai participant-list capture and every name in `attendanceNames` is present in those pages.

> Why not `curl <files[0]>` directly? The swmaestro.ai download endpoint requires a valid JSESSIONID and CSRF context — a raw `curl` without those headers gets redirected to the login page and writes an HTML error page to disk. Always download through `opensoma agent-browser launch` so the session opensoma already holds is reused; see [Browser login via `opensoma agent-browser launch`](#browser-login-via-opensoma-agent-browser-launch) for the security model.

If any MRC020 checkbox fails, **do not leave the report as-is**. Rebuild the merged PDF (Step C) and replace the attachment:

```bash
opensoma report update <id> --file /tmp/lecture-evidence.pdf --pretty
```

Then re-run Step 6.5 on the updated report. Repeat until every checkbox passes.

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
- Evidence photo/capture is **not mandatory for 자유 멘토링 (MRC010)** — only the report itself is required for mentoring hours to be recognized
- **멘토 특강 (MRC020) is the exception** — lectures require two photo evidence pages plus a participant-list capture. See [Lecture Reports: Three-Part Evidence](#lecture-reports-mrc020-three-part-evidence) below
- The `--file` CLI flag is technically required, so always attach something
- Best for MRC010: PDF of mentoring session page (proves official registration + shows attendee list)
- Acceptable for MRC010: Webex attendee screenshot, session detail export
- The report content is the primary record — write it thoroughly regardless of evidence quality

## Lecture Reports (MRC020): Three-Part Evidence

멘토 특강 (lecture) reports have stricter evidence requirements than 자유 멘토링. Treat evidence as a **three-part checklist**, not as “photos plus maybe something else.” The attachment **must** contain all three of the following, merged into a single PDF:

1. **Start photo** — An on-site photo taken at the beginning of the lecture.
2. **End photo** — A distinct on-site photo taken at the end of the lecture.
3. **swmaestro.ai participant-list capture** — A capture of the mentoring session's participant list page on swmaestro.ai, with **every participant row visible**.

The start and end photos **must** satisfy all of the following:

- **Displayed time is visible** — a clock readout from a laptop, TV, projector, wall clock, or any screen in the frame must be legible. The time in the start photo must roughly match `--start-time`; the time in the end photo must roughly match `--end-time`. This proves the session ran for the reported duration.
- **Every participant's face is visible** — the full set of participants listed in `--attendance-names` must appear, with faces (not just backs of heads) recognizable. The mentor should be in frame too, or in at least one of the two photos.
- The photos come from the user. Never invent them, never substitute stock images, never substitute slide screenshots, never reuse the same photo for both start and end.
- If the user has not provided both photos, or if either photo is missing the displayed time or any participant's face, stop and request a re-shoot before doing anything else.

The participant-list capture is a separate required evidence part. A truncated list (cropped, scrolled-mid-page, partial) is not acceptable. If the list is paginated, capture every page.

The CLI accepts exactly one file via `--file`. All three pieces of evidence (start photo, end photo, participant-list capture) must be merged into one PDF before submission.

### Non-negotiable pre-submit checklist for MRC020

Before running `opensoma report create` or `opensoma report update --file` for a lecture report, explicitly verify:

- [ ] Page 1 is the start photo and shows a displayed time matching `--start-time`.
- [ ] Page 2 is the end photo and shows a displayed time matching `--end-time`.
- [ ] Both photo pages show every participant's face.
- [ ] The remaining page(s) are the swmaestro.ai participant-list capture, not omitted.
- [ ] Every participant row is visible; if there are multiple pages, every page is included.
- [ ] `--attendance-count` and `--attendance-names` exactly match the participant-list capture.

If any checkbox fails, **do not submit**. Re-capture or rebuild the evidence PDF first.

### Step A: Capture the participant-list

Drive `opensoma agent-browser launch` to the lecture's view page (the same `mentoLec/view.do` URL used for MRC010 evidence), then capture as PDF. The PDF capture is preferred over a viewport screenshot because the attendee table at the bottom of the page can be long, and a full-page PDF captures all rows in one file.

**Credentials: reuse the opensoma session, do not re-authenticate.** `opensoma agent-browser launch` reads the JSESSIONID stored under the opensoma config directory (default `~/.config/opensoma/credentials.json`, override via `OPENSOMA_CONFIG_DIR`) and injects it into the browser at launch — the agent never types a password into swmaestro.ai. If the stored session is stale, opensoma silently re-uses the stored username/password to refresh it before launching. The injected cookie is written to a private temp state file (`0o700` dir, `0o600` file) and never appears on stdout, in argv, or in shell history. See the `Browser login via opensoma agent-browser launch` section above for the full security details.

```bash
# 0. Sanity-check that opensoma has a usable session. Required: status is
#    authenticated. If not, run `opensoma auth login` once — never re-login
#    from inside the agent-browser, and never paste credentials into argv.
opensoma auth status --pretty

# 1. Open the lecture session page pre-authenticated.
#    opensoma reuses the stored session cookie; if expired, it auto-recovers
#    via the stored username/password before launching the browser.
opensoma agent-browser launch \
  "https://www.swmaestro.ai/sw/mypage/mentoLec/view.do?qustnrSn=<SESSION_ID>&menuNo=200046"

# 2. Verify the attendee table is fully expanded (no "more" / pagination hidden rows).
#    Confirm every name in --attendance-names appears in the table.
#    Also confirm login succeeded — the page header should show 로그아웃 (logout),
#    not 로그인 (login). If you see 로그인, stop and run `opensoma auth status`.
agent-browser snapshot -i

# 3. Save as PDF — this becomes the participant-list portion of the evidence
agent-browser pdf /tmp/participants-<SESSION_ID>.pdf

# 4. Close
agent-browser close
```

**Verification before proceeding:**
- The PDF shows the full attendee table; no rows are cut off at the page break.
- Visible participant count matches the value you will pass to `--attendance-count`.
- Every name you plan to pass to `--attendance-names` appears in the capture, exactly.
- The page header shows 로그아웃, not 로그인 — confirming the saved credentials were applied.

If any check fails, re-capture before continuing. Do not fabricate names or counts to make the report "look right" — these must match the capture exactly. If the page shows 로그인, the stored opensoma session is unrecoverable; run `opensoma auth login` once from a terminal (not from within the agent-browser flow), then retry from step 1.

### Step B: Collect the start and end photos

Get exactly two photos from the user — a **start photo** and an **end photo** — and save them with names that preserve order:

```bash
ls /tmp/lecture-photos/
# 01-start.jpg  02-end.jpg
```

**Before merging, verify each photo satisfies all of the following:**

| Check | Start photo | End photo |
|-------|-------------|-----------|
| Displayed time visible (laptop/TV/projector/clock) | ✓ — roughly matches `--start-time` | ✓ — roughly matches `--end-time` |
| Every participant's face is visible | ✓ — all names in `--attendance-names` | ✓ — all names in `--attendance-names` |
| Not a slide screenshot, stock image, or placeholder | ✓ | ✓ |
| Distinct shot (not the same photo as the other) | ✓ | ✓ |

If any check fails, stop and request a corrected photo from the user. Do not proceed with a placeholder, a single photo, or a photo that omits any participant's face.

### Step C: Merge into one PDF

Combine the start photo, end photo, and participant-list PDF into a single PDF, **in this exact order**: start → end → participant-list. The chronological order matters because reviewers use it to read the time stamps in sequence.

The merge is a **two-stage** process: first convert the photos to a PDF, then concatenate that PDF with the participant-list PDF. A one-shot ImageMagick command mixing images and PDFs does **not** work without Ghostscript installed (`magick` shells out to `gs` for PDF input) and is not recommended.

#### Recommended: ImageMagick + pdfunite

Both ship on macOS via Homebrew (`brew install imagemagick poppler`) and are commonly preinstalled on Linux dev machines. Verified locally on macOS.

```bash
# Stage 1: photos → PDF (one page per photo, in the order listed on the command line)
magick /tmp/lecture-photos/01-start.jpg /tmp/lecture-photos/02-end.jpg /tmp/photos.pdf

# Stage 2: concatenate photos.pdf + participants.pdf → final evidence.pdf
pdfunite /tmp/photos.pdf /tmp/participants-<SESSION_ID>.pdf /tmp/lecture-evidence.pdf
```

#### Alternatives

```bash
# Alt 1: img2pdf + pdfunite — img2pdf preserves image quality losslessly,
# unlike `magick` which can re-encode JPEGs. Install via `brew install img2pdf`
# or `pip install img2pdf`. Useful when photo quality must be preserved.
img2pdf /tmp/lecture-photos/01-start.jpg /tmp/lecture-photos/02-end.jpg -o /tmp/photos.pdf
pdfunite /tmp/photos.pdf /tmp/participants-<SESSION_ID>.pdf /tmp/lecture-evidence.pdf

# Alt 2: img2pdf + qpdf — qpdf works the same as pdfunite for concatenation.
# Install via `brew install qpdf`.
img2pdf /tmp/lecture-photos/01-start.jpg /tmp/lecture-photos/02-end.jpg -o /tmp/photos.pdf
qpdf --empty --pages /tmp/photos.pdf /tmp/participants-<SESSION_ID>.pdf -- /tmp/lecture-evidence.pdf
```

> The `01-start.jpg` / `02-end.jpg` filenames are just examples; what matters is that the **start photo is the first image** passed to the conversion tool and the **end photo is the second**. Do not rely on shell globbing (`photo-*.jpg`) to preserve start/end order — list them explicitly.

**Open the merged PDF and verify** before submitting:
- Page 1 is the **start** photo; displayed time roughly matches `--start-time`; every participant's face is visible.
- Page 2 is the **end** photo; displayed time roughly matches `--end-time`; every participant's face is visible.
- Remaining pages are the participant-list capture, with the full attendee table visible.
- Photos are in a reasonable orientation (rotate beforehand if needed).
- Nothing is corrupted, blank, or rotated illegibly.

Quick sanity check that the merge produced a multi-page PDF with the attendee table intact:

```bash
# Page count should be photos_count + participant_list_pages (typically 2 + 1..N)
pdfinfo /tmp/lecture-evidence.pdf | grep '^Pages:'

# Optional: extract text and confirm '신청완료' appears at least --attendance-count times,
# proving the participant rows survived the merge
pdftotext /tmp/lecture-evidence.pdf - | grep -c '신청완료'
```

### Step D: Submit

```bash
opensoma report create \
  --region S \
  --type MRC020 \
  --date <yyyy-mm-dd> \
  --venue <venue> \
  --attendance-count <n> \
  --attendance-names "<full names matching the participant-list capture>" \
  --start-time <HH:mm> \
  --end-time <HH:mm> \
  --subject "<lecture title — min 10 chars>" \
  --content-file /tmp/lecture-content.txt \
  --file /tmp/lecture-evidence.pdf \
  --pretty
```

Then verify the report was accepted and the attachment is recorded:

```bash
opensoma report get <id> --pretty
```

### Hard rules

- **Never** submit a lecture report (`--type MRC020`) without an attachment that contains **all three** pieces of evidence: start photo, end photo, and swmaestro.ai participant-list capture.
- **Never** submit a lecture report with only one photo, the same photo used twice, or photos that omit any participant's face.
- **Never** submit photos that lack a visible displayed time (laptop/TV/projector/clock). The displayed time is the proof that the session actually ran for the reported duration; without it, the photo is not valid evidence.
- **Never** crop the participant list. If the list scrolls or paginates, capture all pages.
- **Never** fabricate participant names or counts to make `--attendance-count` / `--attendance-names` match the report. They must match the participant-list capture exactly.
- **Never** substitute the photo evidence with a screenshot of slides, a stock image, or a placeholder. 사진증빙 means actual on-site photos provided by the user.
- **Never** swap the order of start and end photos in the merged PDF. Start photo must precede end photo so reviewers read the times chronologically.
- The PDF is the only attachment slot. Don't call `report create` twice hoping to attach two files — the second call creates a second report, not a second attachment.
- **Never** treat `report create` returning `{"ok": true}` as proof the report is correct. Always run [Step 6.5: Post-submit verification](#step-65-post-submit-verification-mandatory) afterwards — it is the only step that catches a silently-dropped attachment, a stray `mentorOpinion`, or a participant-list page that did not survive the merge.

## Notes File (Optional)

Save a structured markdown note alongside the report for personal records:

```
YYYY-MM-DD 멘토링 보고 - <session topic>.md
```

Include a metadata table, subject, content sections, mentorOpinion, and etc — mirroring the report fields for easy reference and future edits.
