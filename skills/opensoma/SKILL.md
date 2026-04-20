---
name: opensoma
description: Interact with SWMaestro MyPage - manage mentoring sessions and reports, reserve meeting rooms, view dashboard, team info, notices, events, and member profiles. MUST also use when creating mentoring reports (멘토링 보고) from transcriptions or meeting notes, submitting or updating reports via CLI.
version: 0.5.1
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

opensoma is a comprehensive command-line interface and software development kit designed to bridge the gap between AI agents and the SWMaestro MyPage platform (swmaestro.ai). By wrapping the platform's complex, server-rendered interface, opensoma provides a clean, programmatic way to manage mentoring sessions, reserve meeting rooms at the SWMaestro center, monitor dashboard metrics, access official notices, and retrieve team or member profiles. It is built to handle the intricacies of the SWMaestro ecosystem, allowing for seamless automation of common administrative and educational tasks within the program. Whether you are a mentor organizing a lecture or a mentee looking for the next learning opportunity, opensoma streamlines your interaction with the SWMaestro platform by providing a structured, JSON-based interface to a traditionally unstructured web environment.

### Important: CLI Only

It is critical that you never attempt to scrape swmaestro.ai directly or initiate raw HTTP requests to the platform's endpoints. The SWMaestro MyPage is built on a traditional server-rendered Java/Spring architecture that does not expose a public REST API. The platform relies heavily on stateful session management, utilizing JSESSIONID cookies and CSRF (Cross-Site Request Forgery) tokens for security. Every interaction requires these tokens to be correctly extracted from the HTML and passed back in subsequent requests. The opensoma CLI is specifically engineered to manage this entire lifecycle internally. It handles HTML parsing, session persistence, and token synchronization without requiring external intervention. Any attempt to bypass the CLI and make direct network calls will result in immediate failure due to missing session state, incorrect headers, or the inability to parse the complex, non-standard HTML structures that the platform returns. The CLI acts as a protective layer, ensuring that your interactions are both valid and secure according to the platform's requirements. Direct HTTP calls will fail because they require session cookies, CSRF tokens, and HTML parsing that the CLI manages.

### Key Concepts

To effectively use opensoma, you must understand the following core concepts that govern its operation:

- **Session-based Authentication**: Unlike modern APIs that use persistent tokens like JWTs or API keys, SWMaestro uses a stateful session model. When you log in, the server issues a JSESSIONID cookie that must be sent with every subsequent request. These sessions are temporary and will expire after a period of inactivity or when the server-side session is cleared. If a command fails with an authentication error, it is a signal that the session has likely expired and you must re-authenticate using the `auth login` or `auth extract` commands.
- **HTML Scraping and Transformation**: Because there is no underlying JSON API, the CLI acts as a transformation layer. It fetches the server-rendered HTML pages, parses the DOM structure, and extracts the relevant data points to construct a clean JSON response. This process is sensitive to changes in the platform's UI, and the CLI is updated to maintain compatibility with the latest HTML structures. The CLI handles the heavy lifting of converting unstructured HTML into structured data.
- **Room Reservation Slot System**: Meeting room reservations at the SWMaestro center are managed in 30-minute increments. The available window for reservations typically spans from 09:00 in the morning to 23:30 at night. When making a reservation for a block of time, you must specify each 30-minute slot individually (e.g., "14:00,14:30,15:00"). These slots must be consecutive to form a valid booking. Furthermore, the system enforces a maximum limit of 8 slots (equivalent to 4 hours) per single reservation to ensure fair access for all participants.
- **Room Reservation Update & Cancel**: The SWMaestro web UI does not expose an edit flow, but the server endpoint `/mypage/itemRent/update.do` accepts updates and is fully functional. `opensoma room update <rentId>` lets you change any subset of fields (title, room, date, slots, attendees, notes) while leaving the rest untouched. `opensoma room cancel <rentId>` internally flips `receiptStatCd` from `RS001` (confirmed) to `RS002` (cancelled) through the same endpoint. Use `opensoma room get <rentId>` first when you need to inspect the current state.
- **Room ID Mapping**: Meeting rooms can be referenced by short name (e.g., A1) or numeric ID. The CLI resolves short names to numeric IDs automatically via `resolveRoomId`. Known room mappings:
  - **스페이스 A1**: 17 (Capacity: 4)
  - **스페이스 A2**: 18 (Capacity: 4)
  - **스페이스 A3**: 19 (Capacity: 4)
  - **스페이스 A4**: 20 (Capacity: 4)
  - **스페이스 A5**: 21 (Capacity: 4)
  - **스페이스 A6**: 22 (Capacity: 4)
  - **스페이스 A7**: 23 (Capacity: 4)
  - **스페이스 A8**: 24 (Capacity: 4)
- **Mentoring Venues**: When creating mentoring sessions or reports, the `--venue` option accepts these known venue names. Toz locations require the `토즈-` prefix:
  - SWMaestro center rooms: 스페이스 A1–A8, 스페이스 M1, 스페이스 M2, 스페이스 S
  - Toz locations: 토즈-광화문점, 토즈-양재점, 토즈-강남컨퍼런스센터점, 토즈-건대점, 토즈-강남역토즈타워점, 토즈-선릉점, 토즈-역삼점, 토즈-홍대점, 토즈-신촌비즈니스센터점
  - Online: 온라인(Webex)
  - Expert: (엑스퍼트) 연수센터_라운지, (엑스퍼트) 외부_카페
- **Mentoring Session Types**:
  - **자유 멘토링 (Public Mentoring)**: These are typically smaller, more intimate sessions focused on specific technical hurdles, project feedback, or career advice. They often have a limited number of attendees and are highly interactive. Any mentee can apply.
  - **멘토 특강 (Mentor Lecture)**: These are larger-scale educational events or seminars led by mentors. They are designed for a broader audience and may be held in larger seminar rooms or conducted online.

### Quick Start

Get started with the most common workflows immediately:

```bash
# 1. Authenticate your session
# Use your SWMaestro email and password
opensoma auth login --username user@example.com --password mypassword

# 2. View your current status and upcoming events
# The --pretty flag makes the JSON output readable for humans
opensoma dashboard show --pretty

# 3. Browse available mentoring sessions
# This lists sessions currently open for registration
opensoma mentoring list --status open --pretty

# 4. Reserve a meeting room for a team session
# First, check what's available on a specific date
opensoma room list --date 2026-04-10 --pretty
# Check specific slots for a room (e.g., Room 17)
opensoma room available 17 --date 2026-04-10 --pretty
# Make the reservation
opensoma room reserve --room 17 --date 2026-04-10 --slots "14:00,14:30,15:00,15:30" --title "팀 주간 회의"
```

### Authentication

The `auth` command group is the gateway to all other operations. It manages the lifecycle of your SWMaestro session.

- `auth login`: This is the primary method for establishing a session. You must provide your SWMaestro email via `--username` and your password via `--password`. For security, you can also set these as environment variables (`OPENSOMA_USERNAME` and `OPENSOMA_PASSWORD`) to avoid leaving them in your shell history. The command will attempt to log in, retrieve the necessary cookies, and store them locally.
- `auth extract`: A powerful alternative for users who are already logged into SWMaestro in their web browser. This command scans the cookie stores of supported Chromium-based browsers (including Google Chrome, Microsoft Edge, Brave, Arc, Vivaldi, and standard Chromium) to find an active `JSESSIONID`. If found, it imports the session into the CLI, allowing you to bypass the login step. This is particularly useful for avoiding repeated password entry.
- `auth status`: Use this command to verify your current connection state. It returns a JSON object indicating whether credentials exist on your machine and, more importantly, whether the current session is still recognized as valid by the SWMaestro server. It also provides the timestamp of your last successful login and the username associated with the session.
- `auth logout`: When you are finished with your session, use this command to securely remove all stored credentials, cookies, and session data from your local configuration directory. This ensures that no sensitive session information remains on the disk.

All authentication data is stored in a JSON file located at `~/.config/opensoma/credentials.json`. This file is created with 0600 permissions, ensuring that only your user account can read or write to it.

### Memory

The agent maintains a `~/.config/opensoma/MEMORY.md` file as persistent memory across sessions. This is agent-managed — the CLI does not read or write this file. Use the `Read` and `Write` tools to manage your memory file.

#### Reading Memory

At the **start of every task**, read `~/.config/opensoma/MEMORY.md` using the `Read` tool to load any previously discovered user profile, team details, room IDs, and preferences.

- If the file doesn't exist yet, that's fine — proceed without it and create it when you first have useful information to store.
- If the file can't be read (permissions, missing directory), proceed without memory — don't error out.

#### Writing Memory

After discovering useful information, update `~/.config/opensoma/MEMORY.md` using the `Write` tool. Write triggers include:

- After discovering user profile details (from `dashboard show`, `member show`)
- After discovering team details, such as team name or member list (from `team show`)
- After discovering room IDs or preferred rooms (from `room list`, `room available`)
- After the user gives you an alias or preference ("call A1 my usual room", "always use --pretty")
- After recording notice or event IDs that have been summarized or acted upon

When writing, include the **complete file content** — the `Write` tool overwrites the entire file.

#### What to Store

- User profile: name, role (멘토/연수생), organization, position
- Team information: team name, member names, mentor assignments
- Room registry: room names to numeric IDs, capacity, typical availability
- Preferences: output formats, common reservation titles, favorite mentoring topics
- Processed data: IDs of notices or events already summarized or acted upon
- Aliases: nicknames or shorthand the user uses for rooms, people, or sessions

#### What NOT to Store

Never store passwords, JSESSIONID cookies, CSRF tokens, or any sensitive data. Never store transient state (current room availability, session expiry times). Never store raw HTML content — only extracted, relevant data.

#### Handling Stale Data

If a memorized ID returns an error (room not found, session invalid), remove it from `MEMORY.md`. Don't blindly trust memorized data — verify when something seems off. Prefer re-querying over using a memorized ID that might be stale.

#### Format / Example

```markdown
# OpenSoma Memory

## User Profile

- Name: 홍길동
- Role: 멘토
- Organization: Acme Corp
- Position: CTO

## Team Details

- Team Name: 팀이름
- Members: 김멘티, 이멘티

## Room Registry

- A1 (17): 4인실, 홍길동 멘토가 선호하는 회의실
- A5 (21): 4인실

## Aliases

- "usual room" → A1 (17)
- "team meeting" → default reservation title

## Preferences

- Always use --pretty for output
- Default reservation title: "멘토링 세션"
- Preferred mentoring type: public (자유 멘토링)

## Notes

- Notice #42 already summarized
- Event #15 applied
```

> Memory lets you skip repeated `dashboard show`, `room list`, and `team show` calls. When you already know an ID or detail from a previous session, use it directly.

### Commands

#### Auth Commands

Commands for managing your SWMaestro session and credentials.

```bash
# Authenticate with email and password
# Flags: --username, --password, --pretty
opensoma auth login --username <username> --password <password> [--pretty]

# Import an active session from your browser
# Supports: Chrome, Edge, Brave, Arc, Vivaldi, Chromium
opensoma auth extract [--pretty]

# Check if you are currently authenticated and if the session is valid
opensoma auth status [--pretty]

# Clear all stored session data and log out
opensoma auth logout [--pretty]
```

#### Mentoring Commands

Comprehensive management of mentoring sessions, from discovery to application.

```bash
# List mentoring sessions with optional filters
# --status: open (접수중), closed (마감)
# --type: public (자유 멘토링), lecture (멘토 특강)
# --search: Search by title (default), author, or content
#   "keyword"         → title search
#   "title:keyword"   → title search (explicit)
#   "author:이름"     → author search
#   "author:@me"      → my sessions only
#   "content:keyword" → content search
# --page: Navigate through results (default: 1)
#
# Default filter by role (apply automatically unless user specifies otherwise):
#   Mentor → --search "author:@me" (show my mentorings)
#   Mentee → no filter (show all)
opensoma mentoring list [--status <open|closed>] [--type <public|lecture>] [--search <query>] [--page <n>] [--pretty]

# Retrieve full details for a specific mentoring session
# Includes content (HTML), venue, and attendee counts
opensoma mentoring get <id> [--pretty]

# Create a new mentoring session (Available for Mentors only)
# --title: The name of the session
# --type: public or lecture
# --date: YYYY-MM-DD
# --start: HH:MM (24-hour format)
# --end: HH:MM (24-hour format)
# --venue: Location name (e.g., "스페이스 A1")
# --max-attendees: Maximum number of participants
# --reg-start: Registration start date (YYYY-MM-DD)
# --reg-end: Registration end date (YYYY-MM-DD)
# --content: Detailed description in HTML format
opensoma mentoring create --title <title> --type <public|lecture> --date <YYYY-MM-DD> --start <HH:MM> --end <HH:MM> --venue <venue> [--max-attendees <n>] [--reg-start <YYYY-MM-DD>] [--reg-end <YYYY-MM-DD>] [--content <html>] [--pretty]

# Update an existing mentoring session (partial update — only specified fields are changed)
opensoma mentoring update <id> [--title <title>] [--type <public|lecture>] [--date <YYYY-MM-DD>] [--start <HH:MM>] [--end <HH:MM>] [--venue <venue>] [--max-attendees <n>] [--reg-start <YYYY-MM-DD>] [--reg-end <YYYY-MM-DD>] [--content <html>] [--pretty]

# Delete a mentoring session you created
opensoma mentoring delete <id> [--pretty]

# Apply for a mentoring session (Available for Mentees only)
opensoma mentoring apply <id> [--pretty]

# Cancel an existing mentoring application
# Requires applySn and qustnrSn, which can be found in mentoring history
opensoma mentoring cancel --apply-sn <id> --qustnr-sn <id> [--pretty]

# View your complete mentoring application history
opensoma mentoring history [--page <n>] [--pretty]
```

#### Room Commands

Manage meeting room reservations at the SWMaestro center.

```bash
# List all rooms and their availability for a specific date
# --date: Target date (YYYY-MM-DD), defaults to today
# --room: Filter by a specific room name (e.g., "A1")
opensoma room list [--date <YYYY-MM-DD>] [--room <name>] [--pretty]

# Check the availability of 30-minute slots for a specific room
# Accepts short name (e.g., A1) or numeric ID (e.g., 17)
opensoma room available <room> --date <YYYY-MM-DD> [--pretty]

# Reserve a room for a specific set of time slots
# --room: Room short name (e.g., A1) or numeric ID (e.g., 17)
# --date: YYYY-MM-DD
# --slots: Comma-separated list of 30-minute slots (e.g., "14:00,14:30,15:00")
# --title: The purpose of the reservation
# --attendees: Number of people expected
# --notes: Additional information for the reservation
opensoma room reserve --room <room> --date <YYYY-MM-DD> --slots <HH:MM,...> --title <title> [--attendees <n>] [--notes <text>] [--pretty]

# Get a single reservation by rentId. rentId comes from the URL of
# /mypage/itemRent/view.do?rentId=... (visible on the dashboard and `itemRent/list.do`).
opensoma room get <rentId> [--pretty]

# Update an existing reservation. Only the fields you pass are changed; the rest stay the same.
# The SWMaestro web UI does not expose this, but the server endpoint is fully functional.
# Pass --slots only when you want to change the time block; otherwise time slots stay as-is.
opensoma room update <rentId> [--title <title>] [--room <room>] [--date <YYYY-MM-DD>] [--slots <HH:MM,...>] [--attendees <n>] [--notes <text>] [--pretty]

# Cancel a reservation. Internally flips the status code to RS002 via update.do.
opensoma room cancel <rentId> [--pretty]
```

#### Dashboard Commands

Get a high-level overview of your SWMaestro activity.

```bash
# Show a summary of your profile, upcoming mentoring, and room reservations
opensoma dashboard show [--pretty]
```

#### Notice Commands

Stay informed with official announcements from the SWMaestro center.

```bash
# List all notices with pagination support
opensoma notice list [--page <n>] [--pretty]

# Read the full content of a specific notice
opensoma notice get <id> [--pretty]
```

#### Team Commands

Access information about your team and its members.

```bash
# Show your team name, member list, and current status
opensoma team show [--pretty]
```

#### Member Commands

View and verify your personal profile data.

```bash
# Show your email, phone number, organization, and other profile details
opensoma member show [--pretty]
```

#### Event Commands

Manage your participation in SWMaestro-wide events.

```bash
# List all upcoming events
opensoma event list [--page <n>] [--pretty]

# Get detailed information about a specific event
opensoma event get <id> [--pretty]

# Submit an application for an event
opensoma event apply <id> [--pretty]
```

#### Report Commands

Manage mentoring reports and approvals. Reports document mentoring sessions that took place and are submitted for approval and payment processing.

**Report Types:**
- **MRC010**: 자유 멘토링 (Public Mentoring) report
- **MRC020**: 멘토 특강 (Mentor Lecture) report

**Region Codes:**
- **S**: Seoul (서울)
- **B**: Busan (부산)

```bash
# List mentoring reports with optional search
# --search-field: Filter field (전체/제목/내용)
# --search: Search keyword
opensoma report list [--page <n>] [--search-field <field>] [--search <keyword>] [--pretty]

# Get detailed information about a specific report
opensoma report get <id> [--pretty]

# Create a new mentoring report (requires evidence file)
# --region: Mentee region (S=Seoul, B=Busan)
# --type: Report type (MRC010=자유 멘토링, MRC020=멘토 특강)
# --content: Inline text, or use - to read from stdin (min 100 chars)
# --content-file: Alternative to --content; read content from a file
# --subject: Must be at least 10 characters
# --file: Evidence file attachment (required)
opensoma report create \
  --region <S|B> \
  --type <MRC010|MRC020> \
  --date <YYYY-MM-DD> \
  --venue <venue> \
  --attendance-count <n> \
  --attendance-names <names> \
  --start-time <HH:MM> \
  --end-time <HH:MM> \
  --subject <text> \
  --content <text> \
  --file <path> \
  [--team <names>] \
  [--except-start <HH:MM>] \
  [--except-end <HH:MM>] \
  [--except-reason <text>] \
  [--mentor-opinion <text>] \
  [--non-attendance <names>] \
  [--etc <text>] \
  [--pretty]

# Update an existing mentoring report (partial update)
# Only specify the fields you want to change; unspecified fields keep existing values
# --content-file is NOT available on update
opensoma report update <id> \
  [--region <S|B>] \
  [--type <MRC010|MRC020>] \
  [--date <YYYY-MM-DD>] \
  [--venue <venue>] \
  [--attendance-count <n>] \
  [--attendance-names <names>] \
  [--start-time <HH:MM>] \
  [--end-time <HH:MM>] \
  [--subject <text>] \
  [--content <text>] \
  [--team <names>] \
  [--except-start <HH:MM>] \
  [--except-end <HH:MM>] \
  [--except-reason <text>] \
  [--mentor-opinion <text>] \
  [--non-attendance <names>] \
  [--etc <text>] \
  [--file <path>] \
  [--pretty]

# List report approvals and payment status
# --month: Filter by month (01-12)
# --type: Filter by report type (MRC010/MRC020)
opensoma report approval [--page <n>] [--month <mm>] [--type <MRC010|MRC020>] [--pretty]
```

### Global Options

Every command in the opensoma CLI supports the following global option:

- `--pretty`: When this flag is present, the CLI will output the JSON response in a formatted, indented style. This is highly recommended for human users and for agents during the debugging phase. When the flag is omitted, the CLI outputs compact, single-line JSON. This compact format is the default and is optimized for AI agents to minimize token consumption and maximize context window efficiency. It allows for more data to be processed within a single turn.

### Output Format

The CLI is designed to be "JSON-first." All successful operations return a JSON object or array. Errors are also returned as JSON but are directed to the standard error (stderr) stream. This consistent format makes it easy to parse and handle responses programmatically.

Example of a successful compact response:
`{"items":[{"id":123,"title":"Notice"}],"pagination":{"total":1}}`

Example of an error response:
`{"error":"Session expired. Please log in again."}`

For a complete reference of the JSON schemas for every command, please consult the [references/output-format.md](references/output-format.md) document.

### Pagination

To handle large datasets, commands that return lists (such as `mentoring list`, `notice list`, and `event list`) implement a standard pagination model. The response will include a `pagination` object with the following fields:

- `total`: The total number of items available across all pages.
- `currentPage`: The index of the page currently being returned.
- `totalPages`: The total number of pages available.

You can navigate through these pages by using the `--page <n>` option, where `<n>` is the desired page number starting from 1. This allows you to efficiently browse through hundreds of entries without overwhelming the system.

### Common Patterns

For detailed workflow examples and best practices, refer to the [references/common-patterns.md](references/common-patterns.md) document. This includes patterns for daily schedule checks, creating mentoring sessions with room reservations, and handling common error scenarios.

### Writing Mentoring Reports

For the complete methodology on creating mentoring reports from any source material (transcriptions, lecture slides, personal notes, or memory) — including content extraction by source type, evidence PDF capture via browser automation, and the full submit/update workflow — read [references/mentoring-report.md](references/mentoring-report.md).

### Troubleshooting

1. **Authentication Loop**: If you find yourself repeatedly getting "Session expired" errors even after logging in, check if your system clock is synchronized. Significant clock drift can cause session cookies to be treated as expired immediately.
2. **Browser Extraction Issues**: If `auth extract` fails, ensure that your browser is completely closed or that you have granted the necessary permissions for the CLI to access the browser's profile directory. On some systems, browser security features may block external access to cookie databases.
3. **Missing Data in Responses**: If a JSON response is missing fields you expect, it may be because that data isn't available for your specific user role (e.g., a Mentee cannot see certain Mentor-only fields).
4. **Command Not Found**: If the shell cannot find the `opensoma` command, ensure it is installed globally via `bun install -g opensoma` or `npm install -g opensoma`. Alternatively, use `npx opensoma` to run it without a global installation.
5. **Network Timeouts**: SWMaestro's servers can occasionally be slow or unresponsive. If a command hangs, try again after a few moments. The CLI does not currently implement aggressive retry logic.
6. **Empty Results**: If a list is empty, verify your authentication status with `auth status`. If valid, the list may simply have no items matching your criteria.
7. **HTML Parsing Errors**: If the platform's HTML structure changes, the CLI may fail to parse data correctly. In such cases, check for CLI updates or report the issue to the maintainers.
8. **CSRF Token Mismatch**: If you encounter errors related to CSRF tokens, try logging out and logging back in to refresh your session and tokens.
9. **Permission Denied**: Ensure that the user running the CLI has the necessary permissions to read and write to the `~/.config/opensoma` directory.
10. **Invalid Room IDs**: If a room reservation fails with an "Invalid Room ID" error, use `room list` to verify the correct numeric ID for the target room.

### Limitations

- **HTML Parsing Fragility**: Because the CLI relies on parsing server-rendered HTML, any change to the SWMaestro website's layout or structure can potentially break specific commands. Always ensure you are using the latest version of the CLI.
- **No Real-time Notifications**: The CLI is a request-response tool. It cannot "listen" for new notices or mentoring sessions in real-time. You must poll the relevant list commands to find updates.
- **Attachment Handling**: File upload is only supported for mentoring reports (`report create` and `report update`). General attachment downloading (e.g., notice attachments) is not supported.
- **File Attachments for Reports**: The `report create` command requires an evidence file (`--file`). The file is uploaded as a multipart form. Only one file per report is supported. The `report update` command optionally replaces the file.
- **Role Restrictions**: Many operations are strictly bound to your SWMaestro role. Mentors cannot apply for sessions, and Mentees cannot create them. The CLI will return an error if you attempt an unauthorized action.
- **Reservation Race Conditions**: The SWMaestro room reservation system is highly competitive. A room slot that appears available when you run `room list` may be booked by another user by the time you run `room reserve`. Always attempt reservations as quickly as possible after checking availability.
- **Undo Operations**: Write operations like `create`, `delete`, `reserve`, and `apply` are executed immediately and cannot be undone through the CLI. Double-check your parameters before executing these commands.
- **Rate Limiting**: While the CLI doesn't enforce rate limits, the SWMaestro server might if it detects an unusual volume of requests. Use the CLI responsibly and avoid excessive polling.
- **Platform Availability**: The CLI depends on the swmaestro.ai platform being online. If the platform is down for maintenance, the CLI will also be unavailable.
- **Browser Compatibility**: The `auth extract` command is limited to Chromium-based browsers. Users of Firefox or Safari must use the `auth login` command.
- **Data Precision**: Some data points extracted from HTML may be slightly less precise than those from a native API (e.g., relative timestamps like "2 hours ago" instead of exact ISO strings).
- **Concurrent Sessions**: Logging in via the CLI may invalidate an existing session in your web browser, and vice versa, depending on the platform's session management policies.
- **Environment Variables**: When using environment variables for authentication, ensure they are set correctly in your shell environment to avoid "Missing credentials" errors.
- **JSON Schema Changes**: While the CLI aims for stability, the JSON response schemas may evolve over time to accommodate new features or changes in the underlying platform data.
- **Error Message Clarity**: Some error messages from the server are passed through directly. If an error message is unclear, it may be a direct response from the SWMaestro platform's internal logic.
- **Pagination Limits**: The server may impose limits on the maximum number of pages or items that can be retrieved in a single session.
- **Venue Availability**: The list of venues for mentoring sessions is determined by the platform and may change based on the center's scheduling.
- **Attendee Limits**: Mentoring sessions have strict attendee limits enforced by the platform. The CLI will return an error if you attempt to apply for a full session.
- **Registration Windows**: Mentoring sessions and events have specific registration start and end dates. The CLI will not allow applications outside of these windows.
- **Content Formatting**: Content retrieved from notices or mentoring sessions is in HTML format. Agents should be prepared to handle or strip HTML tags as needed.
