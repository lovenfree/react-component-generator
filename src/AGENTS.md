# Frontend AGENTS.md — React 컴포넌트 & TypeScript

## Module Context

Frontend는 React 19 + TypeScript + Vite 기반. 사용자 입력을 받아 Bun 서버의 `/api/generate` 엔드포인트를 호출하고, 생성된 코드를 react-live로 렌더링하는 책임.

## Tech Stack & Constraints

- **React:** v19 (Global scope in react-live only)
- **TypeScript:** Strict mode 강제
- **Styling:** CSS-in-JS (inline styles) + App.css (레이아웃만)
- **HTTP Client:** Fetch API (axios/async library 금지)
- **Build Tool:** Vite (rollup 기반)

## Implementation Patterns

### Component File Structure

```
src/components/
  ComponentCard.tsx     — 생성 컴포넌트 + 코드 뷰
  LivePreview.tsx       — react-live 렌더링
  PromptInput.tsx       — 프롬프트 입력 폼
  CodeView.tsx          — 코드 표시
```

### Hook Pattern

모든 상태는 `useComponentGenerator` hook에 집중.

```typescript
const { components, isLoading, error, generate } = useComponentGenerator();
```

### API Call Pattern

```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, provider, apiKey }),
});
```

## Testing Strategy

현재 테스트 스위트 없음. 추가 시:
- 단위 테스트: `src/**/*.test.ts(x)` (Vitest 권장)
- 통합 테스트: API 호출 및 렌더링 플로우

## Local Golden Rules

- **DO:** useComponentGenerator에서 에러 처리 후 UI에 표시.
- **DO:** TypeScript strict 모드에서 타입 정의 완성.
- **DO:** Fetch 에러 시 사용자 친화 메시지 (한국어).
- **DON'T:** 외부 라이브러리로 HTTP 요청 (Fetch 고정).
- **DON'T:** inline style에서 동적 값 계산. 변수로 미리 계산 후 적용.
- **DON'T:** react-live 내부에서 외부 라이브러리 import. render() 직전까지만 사용 가능.
