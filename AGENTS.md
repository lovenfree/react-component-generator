# AGENTS.md — React 컴포넌트 생성기 거버넌스  관제탑 역할 프로젝트의 코드 컨벤션 등 작성

## Operational Commands

모든 작업은 Bun을 통해 실행됩니다 (npm/yarn/pnpm 금지).

```bash
# 개발 서버 실행 (Vite + Bun API 동시 실행)
bun run dev

# API 서버만 실행 (watch 모드)
bun run server

# 프로덕션 빌드
bun run build

# 린트
bun run lint

# 프로덕션 빌드 미리보기
bun run preview

# 의존성 설치
bun install
```

## Golden Rules

### Immutable Constraints

- **API Keys:** 환경변수 또는 UI 입력으로만 전달. 코드에 하드코딩 절대 금지.
- **Framework Integrity:** React는 react-live 글로벌 스코프에서만 존재. 생성 코드는 외부 라이브러리 import 불가.
- **Model Selection:** Anthropic (claude-haiku-4-5-20251001) / Google Gemini (gemini-2.5-flash) — 다른 모델 추가 시 CLAUDE.md 업데이트 필수.
- **Inline Styles Only:** 생성 컴포넌트는 CSS import 불가. 모든 스타일을 inline으로 작성.
- **TypeScript:** Frontend는 TypeScript 강제. Backend는 Plain JS 허용 (Bun native).

### Do's & Don'ts

- **DO:** System Prompt (server/index.ts 라인 1-43)를 먼저 확인하고 수정. 컴포넌트 품질 문제 시 여기부터 시작.
- **DO:** render() 호출 확보. ensureRenderCall() 로직 확인 후 수정.
- **DO:** CORS 헤더 포함 (모든 응답에 필수).
- **DON'T:** 외부 라이브러리 import를 생성 코드에 추가. 린트 에러 발생.
- **DON'T:** TypeScript 타입을 생성 코드에 사용. Plain JS만 가능.
- **DON'T:** 동시성 문제 무시. 병렬 요청 시 상태 관리 검증.

## Project Context

AI 프롬프트 입력으로 React 컴포넌트를 실시간으로 생성하고 미리보는 도구. 두 AI 프로바이더 간 전환 가능.

**Tech Stack:** React 19 / TypeScript / Vite (Frontend) + Bun HTTP Server + Anthropic Claude API / Google Gemini API.

## Standards & References

### Commit Message Format (Conventional Commits — 한국어)

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`.
Scopes: `frontend`, `backend`, `api`, `prompt`, `ui`, `config`.

### Maintenance Policy

규칙과 코드 간 괴리 발생 시, 업데이트 제안을 하세요. AGENTS.md는 살아있는 문서입니다.

## Generator-Evaluator 패턴

코드를 생성하거나 수정한 후, 다음 조건 중 하나라도 해당하면 Evaluator 서브에이전트를 호출한다.

**호출 조건 (AND 아닌 OR)**:
- 보안에 민감한 코드 수정 (API 키 처리, 입력값 처리, CORS 등)
- 비즈니스 로직이 포함된 함수 신규 작성 또는 수정
- AI 프로바이더 API 연동 코드 변경
- 비동기 처리 로직 추가 또는 변경

**호출 방법** — Agent 도구로 Evaluator를 서브에이전트로 실행한다:

```
Agent({
  subagent_type: "evaluator",
  description: "Evaluator 코드 리뷰",
  prompt: "다음 파일을 검증하라:\n- src/hooks/useComponentGenerator.ts\n- server/index.ts"
})
```

에이전트 정의: `.claude/agents/evaluator.md`

**주의**: Evaluator는 리포트만 출력한다. 수정은 메인 에이전트가 사용자 확인 후 직접 수행한다.

## Context Map (Action-Based Routing)

- **[Frontend 컴포넌트 수정](./src/AGENTS.md)** — React 컴포넌트, hooks, 타입스크립트 작업.
- **[Backend API 수정](./server/AGENTS.md)** — 서버 로직, AI API 프록시, System Prompt 튜닝.
