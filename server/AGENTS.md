# Backend AGENTS.md — Bun API Server & AI Integration

## Module Context

Bun HTTP 서버는 두 AI 프로바이더(Anthropic Claude, Google Gemini)의 프록시 역할. System Prompt를 적용하여 일관된 컴포넌트 품질 보장. 생성 코드 후처리(마크다운 제거, render() 호출 추가)를 담당.

## Tech Stack & Constraints

- **Runtime:** Bun (Node.js 대체)
- **HTTP Server:** Bun's native server (Express 대체)
- **AI Client Libraries:** Anthropic SDK / Google Generative AI SDK (최신 버전)
- **Language:** Plain JavaScript (TypeScript 미지원)
- **Port:** localhost:3002 (고정, Vite proxy 설정 필수)

## Implementation Patterns

### System Prompt Structure

Server/index.ts 라인 1-43:

```
1. 컴포넌트는 inline styles만 사용
2. Plain JavaScript (TypeScript 금지)
3. render(<ComponentName />) 호출로 마무리
4. 반응형 & 모던 디자인 강조
```

System Prompt 수정 시 CLAUDE.md의 "System Prompt" 섹션도 함께 업데이트.

### API Response Pattern

모든 응답은 다음 구조:

```javascript
{
  code: "const Component = () => { ... render(<Component />) }",
  error: null,
  provider: "anthropic" | "google"
}
```

CORS 헤더 필수:

```javascript
response.headers.set('Access-Control-Allow-Origin', '*');
response.headers.set('Content-Type', 'application/json');
```

### AI Provider Routing

- `callAnthropic()` — claude-haiku-4-5-20251001
- `callGoogle()` — gemini-2.5-flash

요청 body: `{ prompt, provider, apiKey? }`
— apiKey 없으면 env 변수 사용

## Testing Strategy

현재 테스트 없음. 추가 시:

```bash
bun test --watch
```

테스트 대상:
- stripCodeFences() 함수 (마크다운 제거)
- ensureRenderCall() 함수 (render() 호출 추가)
- AI API 호출 (mock)
- 에러 처리 (4xx, 5xx, rate limit)

## Local Golden Rules

- **DO:** System Prompt는 간결하게 유지. 변수화 가능한 부분은 코드로 처리.
- **DO:** stripCodeFences()로 항상 마크다운 제거. AI 응답 포맷이 일관성 없을 수 있음.
- **DO:** ensureRenderCall()로 render() 호출 보증. react-live는 이것 없으면 렌더링 불가.
- **DO:** Rate limit / 서버 에러 시 재시도 로직 추가 (Anthropic / Google 정책 참고).
- **DON'T:** API 키를 로그에 출력. env 변수 사용 시 검증 후 숨길 것.
- **DON'T:** 생성 코드 내 require/import 허용. Plain JS + react-live scope 제약.
- **DON'T:** 동기 블로킹. Bun의 비동기 특성 활용.
