# opensoma

[![npm](https://img.shields.io/npm/v/opensoma)](https://www.npmjs.com/package/opensoma)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

소프트웨어 마에스트로(SWMaestro) Web, CLI & SDK.

멘토링, 회의실 예약, 공지사항 등 SWMaestro 기능을 웹, 터미널, 코드에서 모두 사용할 수 있습니다. AI 에이전트가 SWMaestro 플랫폼과 상호작용할 수 있도록 설계되었습니다.

**문서**: [opensoma.dev/docs](https://opensoma.dev/docs)

> [!TIP]
> Webex도 자동화하고 싶으신가요? [agent-messenger](https://github.com/agent-messenger/agent-messenger)를 사용해 보세요.

## Quick Start

```bash
npm install -g opensoma
```

```bash
opensoma auth extract       # 브라우저에서 세션 추출
opensoma dashboard show     # 대시보드 조회
opensoma mentoring list     # 멘토링 목록
```

## Agent Skills

AI 에이전트가 CLI를 효과적으로 사용할 수 있도록 [Agent Skills](https://agentskills.io/)을 포함하고 있습니다.

### SkillPad

[![Available on SkillPad](https://badge.skillpad.dev/opensoma/dark.svg)](https://skillpad.dev/install/opensoma/opensoma/opensoma)

### Skills CLI

```bash
npx skills add opensoma/opensoma
```

### Claude Code

```bash
claude plugin marketplace add opensoma/opensoma
claude plugin install opensoma
```

### OpenCode

`opencode.jsonc`에 추가:

```jsonc
{
  "plugins": [
    "opensoma"
  ]
}
```

## 개발

```bash
bun install        # 의존성 설치
bun test           # 테스트
bun run typecheck  # 타입 체크
bun run lint       # 린트
bun run format     # 포맷
```

## 라이선스

MIT
