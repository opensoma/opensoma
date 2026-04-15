# opensoma

소프트웨어 마에스트로(SWMaestro) 마이페이지 CLI & SDK. 멘토링, 회의실 예약, 공지사항, 행사 등 마이페이지 기능을 커맨드라인과 프로그래밍 방식으로 사용할 수 있습니다.

AI 에이전트가 SWMaestro 플랫폼과 상호작용할 수 있도록 설계되었습니다. 모든 출력은 JSON 형식입니다.

> [!TIP]
> Webex도 자동화하고 싶으신가요? [agent-messenger](https://github.com/agent-messenger/agent-messenger)를 사용해 보세요.

## 목차

- [설치](#설치)
- [에이전트 스킬](#에이전트-스킬)
  - [SkillPad](#skillpad)
  - [Skills CLI](#skills-cli)
  - [Claude Code 플러그인](#claude-code-플러그인)
  - [OpenCode 플러그인](#opencode-플러그인)
- [인증](#인증)
  - [브라우저 세션 추출](#브라우저-세션-추출)
  - [아이디/비밀번호 로그인](#아이디비밀번호-로그인)
  - [인증 상태 확인](#인증-상태-확인)
  - [로그아웃](#로그아웃)
- [CLI 명령어](#cli-명령어)
  - [대시보드](#대시보드)
  - [멘토링](#멘토링)
  - [회의실](#회의실)
  - [공지사항](#공지사항)
  - [팀](#팀)
  - [회원 정보](#회원-정보)
  - [행사](#행사)
- [SDK](#sdk)
- [회의실 코드](#회의실-코드)
- [개발](#개발)
- [라이선스](#라이선스)

## 설치

```bash
npm -g install opensoma
```

## 에이전트 스킬

AI 에이전트가 CLI를 효과적으로 사용할 수 있도록 [Agent Skills](https://agentskills.io/)을 포함하고 있습니다.

### SkillPad

Agent Skills용 GUI 앱입니다. 자세한 내용은 [skillpad.dev](https://skillpad.dev/)를 참고하세요.

[![Available on SkillPad](https://badge.skillpad.dev/opensoma/dark.svg)](https://skillpad.dev/install/opensoma/opensoma/opensoma)

### Skills CLI

Agent Skills용 CLI 도구입니다. 자세한 내용은 [skills.sh](https://skills.sh/)를 참고하세요.

```bash
npx skills add opensoma/opensoma
```

### Claude Code 플러그인

```bash
claude plugin marketplace add opensoma/opensoma
claude plugin install opensoma
```

또는 Claude Code 내에서:

```
/plugin marketplace add opensoma/opensoma
/plugin install opensoma
```

### OpenCode 플러그인

`opencode.jsonc`에 추가:

```jsonc
{
  "plugins": [
    "opensoma"
  ]
}
```

## 인증

### 브라우저 세션 추출

Chromium 계열 브라우저(Chrome, Edge, Brave, Arc, Vivaldi)에서 swmaestro.ai에 로그인된 세션을 자동으로 추출합니다.

```bash
opensoma auth extract
```

### 아이디/비밀번호 로그인

```bash
opensoma auth login --username <아이디> --password <비밀번호>
```

환경변수로도 전달 가능합니다:

```bash
export OPENSOMA_USERNAME=<아이디>
export OPENSOMA_PASSWORD=<비밀번호>
opensoma auth login
```

### 인증 상태 확인

```bash
opensoma auth status
```

### 로그아웃

```bash
opensoma auth logout
```

가능하면 SWMaestro 서버 세션 로그아웃도 함께 시도한 뒤, 로컬 인증 정보를 삭제합니다.

인증 정보는 `~/.config/opensoma/credentials.json`에 저장되며, 파일 권한은 `0600`으로 설정됩니다.

## CLI 명령어

모든 명령어에 `--pretty` 옵션을 추가하면 JSON 출력을 보기 좋게 포맷합니다.

### 대시보드

```bash
opensoma dashboard show
```

### 멘토링

```bash
# 목록 조회
opensoma mentoring list
opensoma mentoring list --status open --type public --page 2

# 검색
opensoma mentoring list --search "OpenCode"
opensoma mentoring list --search "author:@me"
opensoma mentoring list --search "author:@me" --status open --type lecture

# 상세 조회
opensoma mentoring get <id>

# 멘토링 생성
opensoma mentoring create \
  --title "멘토링 제목" \
  --type public \
  --date 2025-01-15 \
  --start 14:00 \
  --end 16:00 \
  --venue "스페이스 A1"

# 멘토링 삭제
opensoma mentoring delete <id>

# 멘토링 신청
opensoma mentoring apply <id>

# 신청 취소
opensoma mentoring cancel --apply-sn <신청번호> --qustnr-sn <멘토링번호>

# 신청 내역 조회
opensoma mentoring history
```

### 회의실

```bash
# 회의실 목록
opensoma room list
opensoma room list --date 2025-01-15 --room A1

# 예약 가능 시간 조회
opensoma room available <roomId> --date 2025-01-15

# 회의실 예약
opensoma room reserve \
  --room A1 \
  --date 2025-01-15 \
  --slots "14:00,14:30,15:00" \
  --title "팀 회의"
```

### 공지사항

```bash
opensoma notice list
opensoma notice get <id>
```

### 팀

```bash
opensoma team show
```

### 회원 정보

```bash
opensoma member show
```

### 행사

```bash
# 행사 목록
opensoma event list

# 행사 상세
opensoma event get <id>

# 행사 신청
opensoma event apply <id>
```

## SDK

TypeScript/JavaScript에서 프로그래밍 방식으로 사용할 수 있습니다.

```typescript
import { SomaClient } from 'opensoma'

const client = new SomaClient({
  username: process.env.OPENSOMA_USERNAME,
  password: process.env.OPENSOMA_PASSWORD,
})
await client.login()

// 대시보드
const dashboard = await client.dashboard.get()

// 멘토링 목록
const { items, pagination } = await client.mentoring.list({ status: 'open' })

// 멘토링 상세
const detail = await client.mentoring.get(123)

// 멘토링 생성
await client.mentoring.create({
  title: '멘토링 제목',
  type: 'public',
  date: '2025-01-15',
  startTime: '14:00',
  endTime: '16:00',
  venue: '스페이스 A1',
})

// 회의실 목록
const rooms = await client.room.list({ date: '2025-01-15' })

// 회의실 예약
await client.room.reserve({
  roomId: 17,
  date: '2025-01-15',
  slots: ['14:00', '14:30'],
  title: '팀 회의',
})

// 공지사항
const notices = await client.notice.list()
const notice = await client.notice.get(456)

// 팀 정보
const team = await client.team.show()

// 회원 정보
const member = await client.member.show()

// 행사
const events = await client.event.list()
await client.event.apply(789)
```

세션 쿠키로 직접 인증할 수도 있습니다:

```typescript
const client = new SomaClient({
  sessionCookie: '<세션쿠키>',
  csrfToken: '<CSRF토큰>',
})
```

## 회의실 코드

| 코드 | 회의실 |
|------|--------|
| A1 | 스페이스 A1 |
| A2 | 스페이스 A2 |
| A3 | 스페이스 A3 |
| A4 | 스페이스 A4 |
| A5 | 스페이스 A5 |
| A6 | 스페이스 A6 |
| A7 | 스페이스 A7 |
| A8 | 스페이스 A8 |

## 개발

```bash
# 의존성 설치
bun install

# 테스트
bun test

# 타입 체크
bun run typecheck

# 린트
bun run lint

# 포맷
bun run format
```

## 라이선스

MIT
