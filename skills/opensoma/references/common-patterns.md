# Common Patterns

## Daily Schedule Check

To get a comprehensive view of your daily activities, combine dashboard, mentoring, and room availability checks. This pattern is essential for staying on top of your SWMaestro commitments.

```bash
# 1. Check dashboard for current status
# This provides a summary of your profile, upcoming mentoring, and room reservations
opensoma dashboard show --pretty

# 2. List open mentoring sessions
# This lists sessions currently open for registration, allowing you to find new opportunities
opensoma mentoring list --status open --pretty

# 3. Check room availability for today
# This shows which meeting rooms are available for the current date
opensoma room list --date $(date +%Y-%m-%d) --pretty
```

## Creating a Mentoring Session with Room

When creating a mentoring session that requires a physical space, follow this workflow to ensure the room is secured first. This prevents the situation where a session is created but no room is available.

```bash
# 1. Check room availability for the target date
# This lists all rooms and their availability for the specified date
opensoma room list --date 2026-04-15 --pretty

# 2. Reserve the room (e.g., Room A1, ID 17)
# This reserves the specified 30-minute slots for the room
opensoma room reserve --room 17 --date 2026-04-15 --slots "14:00,14:30,15:00,15:30" --title "TypeScript 기초"

# 3. Create the mentoring session using the reserved venue
# This creates the mentoring session with the specified details and venue
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

## Listing My Mentoring Sessions

When the user asks "show my lectures", "list my mentoring", "내 멘토링", or any variation of viewing sessions they created, use `--status my`. This filters to only the sessions authored by the current user.

```bash
# List mentoring sessions I created
opensoma mentoring list --status my --pretty

# Combine with type filter to see only my lectures
opensoma mentoring list --status my --type lecture --pretty
```

## Checking a Specific Mentoring Session

To find and inspect a specific mentoring session, first list the sessions to find the ID, then retrieve the details. This is the standard way to get full information about a session.

```bash
# 1. List sessions to find the target ID
# This lists sessions with optional filters to narrow down the search
opensoma mentoring list --pretty

# 2. Get full details for the specific session ID
# This retrieves the full content, venue, and attendee counts for the session
opensoma mentoring get 9572 --pretty
```

## Finding Available Rooms

For a specific date, you can find rooms with open morning or afternoon slots by listing all rooms and filtering the output. This is useful for planning team meetings or study sessions.

```bash
# List all rooms for a specific date
# This provides a comprehensive view of room availability for the entire day
opensoma room list --date 2026-04-10 --pretty
```

## Viewing Team and Member Info

Access your team and personal profile information. This is useful for verifying your status and seeing who else is on your team.

```bash
# Show team members and status
# This lists the members of your assigned team and their current status
opensoma team show --pretty

# Show your profile details
# This displays your email, phone number, organization, and other profile details
opensoma member show --pretty
```

## Checking Notices

Stay updated with the latest official announcements from the SWMaestro center. This is important for keeping track of program updates and requirements.

```bash
# List recent notices
# This lists all notices with pagination support
opensoma notice list --pretty

# Read a specific notice by ID
# This retrieves the full content of the specified notice
opensoma notice get 36387 --pretty
```

## Error Handling Patterns

When a command fails, follow these patterns to resolve the issue. These steps will help you quickly recover from common operational problems.

- **Authentication Failure**: If you receive a "Not logged in" or "Session expired" error, re-authenticate immediately. This is the most common cause of command failure.
  ```bash
  opensoma auth login --username <email> --password <password>
  # OR
  opensoma auth extract
  ```
- **Empty Results**: If a list is empty, verify your authentication status with `auth status`. If valid, the list may simply have no items matching your criteria. This is common for mentoring sessions or events that haven't started yet.
- **Session Expired Mid-Workflow**: If a multi-step workflow fails halfway, re-authenticate and restart the process. Check the status of any write operations (like room reservations) before retrying to avoid duplicate actions.
- **CSRF Token Issues**: If you encounter CSRF token errors, it often means your session is invalid. Re-authenticating will usually resolve this.
- **Network Timeouts**: If a command hangs or times out, wait a few moments and try again. The SWMaestro servers can occasionally be slow.

## Best Practices

- **Verify Auth**: Always check `auth status` before starting a multi-step workflow to ensure your session is valid. This saves time and prevents partial failures.
- **Output Mode**: Use `--pretty` for human inspection and debugging. Omit the flag for programmatic use to save context space and improve processing speed.
- **Memory Usage**: Store discovered IDs (rooms, mentoring sessions, notices) in `MEMORY.md` to avoid redundant lookups. This makes your interactions more efficient.
- **Immediate Reservation**: For room reservations, check availability immediately before reserving. Slots can be taken quickly by other users, especially during peak times.
- **Start with Dashboard**: Use `dashboard show` as the starting point for any task to get an overview of your current state and any pending actions.
- **Check Role Restrictions**: Be aware of your role (Mentor or Mentee) and the operations available to you. The CLI will return an error if you attempt an unauthorized action.
- **Use Environment Variables**: For security, use `OPENSOMA_USERNAME` and `OPENSOMA_PASSWORD` environment variables for authentication instead of passing them as flags.

## Anti-Patterns

- **Caching Room Availability**: Do not cache room availability for long periods. It changes constantly as other users make reservations. Always get fresh data before making a booking.
- **Assuming Persistent Sessions**: Do not assume sessions will last forever. They expire based on server-side policies. Be prepared to re-authenticate at any time.
- **Hardcoding Room IDs**: Avoid hardcoding room IDs in your logic. Use `room list` to discover them dynamically, as IDs can occasionally change or new rooms may be added.
- **Direct Scraping**: Never attempt to scrape swmaestro.ai directly. Always use the opensoma CLI to interact with the platform. The CLI handles the complex session and parsing logic for you.
- **Ignoring Errors**: Do not ignore error responses from the CLI. They provide valuable information about why a command failed and how to fix it.
- **Excessive Polling**: Avoid excessive polling of the SWMaestro servers. This can lead to rate limiting or temporary bans. Use the CLI responsibly.
- **Storing Sensitive Data**: Never store passwords or session cookies in your memory file or other insecure locations. Use the CLI's built-in credential management.
- **Skipping Auth Status**: Do not skip checking your authentication status before starting a complex task. It's better to find out early if you need to log in.
- **Mixing Roles**: Do not attempt to perform actions that are not allowed for your role. Mentors should not try to apply for sessions, and Mentees should not try to create them.
- **Ignoring Pagination**: When listing items, do not assume all results are on the first page. Check the pagination object and use the `--page` flag if necessary.
- **Manual HTML Parsing**: Do not try to parse the HTML output of the CLI yourself. The CLI already provides structured JSON for this purpose.
- **Hardcoding Dates**: Avoid hardcoding dates in your scripts. Use dynamic date generation (e.g., `$(date +%Y-%m-%d)`) to ensure your commands are always relevant.
- **Neglecting Memory**: Do not ignore the `MEMORY.md` file. It is a valuable tool for maintaining context across different sessions and tasks.
- **Overwriting Memory**: Be careful not to overwrite important information in `MEMORY.md`. Always read the file first and append or update as needed.
- **Sharing Credentials**: Never share your `credentials.json` file or its contents with anyone. It contains sensitive session information that could be used to access your account.
- **Committing Secrets**: Do not commit your `credentials.json` or any other files containing secrets to a public repository. Use `.gitignore` to prevent this.
- **Using Outdated CLI**: Do not use an outdated version of the opensoma CLI. The SWMaestro platform changes frequently, and the CLI is updated to keep pace.
- **Ignoring Troubleshooting**: If you encounter a problem, refer to the troubleshooting section in `SKILL.md` before seeking external help.
- **Assuming Success**: Do not assume a command succeeded without checking the output and exit code. The CLI provides clear error messages when something goes wrong.
- **Neglecting Pretty Print**: While compact JSON is better for agents, don't forget to use `--pretty` when you need to inspect the output yourself.
- **Ignoring Venue Names**: When creating a mentoring session, ensure the venue name matches one of the recognized rooms to avoid confusion.
- **Skipping Registration Windows**: Be mindful of registration start and end dates. Applying outside of these windows will result in an error.
- **Ignoring Attendee Limits**: Do not try to apply for a session that is already full. Check the attendee counts in the session details first.
- **Manual CSRF Handling**: Do not attempt to handle CSRF tokens manually. The CLI manages them automatically for every request.
- **Direct HTTP Calls**: As a final reminder, never make direct HTTP calls to swmaestro.ai. Always use the opensoma CLI.
