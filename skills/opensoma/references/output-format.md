# Output Format

## JSON (Default)
All commands output compact JSON by default. Use the `--pretty` flag for indented, human-readable output. This compact format is optimized for AI agents to minimize token consumption and maximize context window efficiency.

## Response Schemas

### notice list
```json
{"items":[{"id":36387,"title":"[센터] 연수센터 이용 규칙","author":"AI·SW마에스트로","createdAt":"2026.04.07 15:14:20"}],"pagination":{"total":11,"currentPage":1,"totalPages":2}}
```

### notice get
```json
{"id":36387,"title":"[센터] 연수센터 이용 규칙","author":"AI·SW마에스트로","createdAt":"2026.04.07","content":"<p>HTML content...</p>"}
```

### mentoring list
```json
{"items":[{"id":9482,"title":"초기 제품 개발 준비","type":"자유 멘토링","registrationPeriod":{"start":"2026-04-08","end":"2026-04-23"},"sessionDate":"2026-04-30","sessionTime":{"start":"19:00","end":"22:00"},"attendees":{"current":3,"max":4},"approved":true,"status":"접수중","author":"김태성","createdAt":"2026-04-08"}],"pagination":{"total":586,"currentPage":1,"totalPages":50}}
```

### mentoring get
```json
{"id":9482,"title":"초기 제품 개발 준비","type":"자유 멘토링","registrationPeriod":{"start":"2026-04-08","end":"2026-04-23"},"sessionDate":"2026-04-30","sessionTime":{"start":"19:00","end":"22:00"},"attendees":{"current":0,"max":4},"approved":true,"status":"접수중","author":"김태성","createdAt":"2026-04-08","content":"<p>HTML content...</p>","venue":"스페이스 A5"}
```

### room list
```json
[{"itemId":17,"name":"스페이스 A1","capacity":4,"availablePeriod":{"start":"2026-04-06","end":"2026-04-30"},"description":"스페이스 A1 회의실 : 4인","timeSlots":[{"time":"09:00","available":true},{"time":"09:30","available":true},{"time":"10:00","available":false}]}]
```

### room available
```json
[{"time":"09:00","available":true},{"time":"09:30","available":true},{"time":"12:00","available":false}]
```

### dashboard show
`team` is optional — omitted when user has no team assigned.
```json
{"name":"전수열","role":"멘토","organization":"Indent","position":"","team":{"name":"김앤강","members":"김철수, 강영희","mentor":"전수열"},"mentoringSessions":[{"title":"게임 개발 AI 활용법","url":"/sw/mypage/mentoLec/view.do?qustnrSn=9582&menuNo=200046","status":"접수중"}],"roomReservations":[{"title":"OpenCode 하네스 만들어보기 (전수열)","url":"/sw/mypage/itemRent/view.do?rentId=17905&menuNo=200059","status":"예약완료"}]}
```

### member show
```json
{"email":"devxoul@gmail.com","name":"전수열","gender":"남자","birthDate":"1995-01-14","phone":"01020609858","organization":"Indent","position":""}
```

### team show
```json
{"teams":[{"name":"김앤강","memberCount":0,"joinStatus":"참여"}],"currentTeams":0,"maxTeams":100}
```

### auth status
```json
{"authenticated":true,"valid":true,"username":null,"loggedInAt":"2026-04-09T16:07:56.247Z"}
```

### auth extract
```json
{"ok":true,"extracted":true,"valid":true}
```

### event list
```json
{"items":[],"pagination":{"total":0,"currentPage":1,"totalPages":1}}
```

### mentoring history
```json
{"items":[],"pagination":{"total":0,"currentPage":1,"totalPages":1}}
```

### Error Responses
All errors are written to stderr as JSON objects. This allows agents to distinguish between successful data retrieval and operational failures.

Example of an authentication error:
```json
{"error":"Not logged in. Run: opensoma auth login"}
```

Example of a session expiration error:
```json
{"error":"Session expired. Please log in again."}
```

Example of a missing parameter error:
```json
{"error":"Provide --username and --password or set OPENSOMA_USERNAME and OPENSOMA_PASSWORD"}
```

Example of a CSRF token error:
```json
{"error":"CSRF token not found. This may indicate a session issue or a change in the platform's structure."}
```

Example of a browser extraction error:
```json
{"error":"No SWMaestro session found in any browser. Ensure you are logged in at swmaestro.ai."}
```

Example of a room reservation error:
```json
{"error":"The selected room slots are no longer available. Please check availability and try again."}
```

Example of a mentoring application error:
```json
{"error":"You have already applied for this mentoring session or the session is full."}
```

Example of a notice retrieval error:
```json
{"error":"Notice not found. The ID may be invalid or the notice may have been removed."}
```

Example of a team information error:
```json
{"error":"Team information not found. Ensure you are assigned to a team."}
```

Example of a member profile error:
```json
{"error":"Member profile not found. Ensure your session is valid."}
```

Example of an event retrieval error:
```json
{"error":"Event not found. The ID may be invalid or the event may have ended."}
```
