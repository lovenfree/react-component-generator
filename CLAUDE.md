# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**React 컴포넌트 생성기**: AI 프롬프트를 입력하면 React 컴포넌트를 즉시 생성하고 실시간으로 미리보고 코드를 확인할 수 있는 애플리케이션.

## Architecture

### Overall Flow

```
User Input (Prompt) 
  ↓
Frontend (React/TypeScript) 
  ↓
Bun API Server (localhost:3002)
  ↓
AI Provider (Anthropic Claude / Google Gemini)
  ↓
Generated Code
  ↓
react-live Runtime Preview
```

### Frontend Architecture

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Components**:
  - `PromptInput`: 프롬프트 입력 폼
  - `ComponentCard`: 생성된 컴포넌트 카드 (미리보기 + 코드 표시)
  - `LivePreview`: react-live 기반 실시간 렌더링
  - `CodeView`: 생성된 코드 표시

- **State Management**: `useComponentGenerator` hook (useState 기반)
  - `components[]`: 생성된 컴포넌트 리스트
  - `isLoading`, `error`: 상태/에러 관리

### Backend (API Server)

**File**: `server/index.ts` (Bun HTTP server)

**Key Functions**:
- `callAnthropic()`: Anthropic API 호출 (모델: `claude-haiku-4-5-20251001`)
- `callGoogle()`: Google Gemini API 호출 (모델: `gemini-2.5-flash`)
- `stripCodeFences()`: 응답에서 코드 블록 마크다운 제거
- `ensureRenderCall()`: 생성 코드에 `render()` 호출 추가

**System Prompt** (lines 1-43): 
- 컴포넌트는 inline styles만 사용 (CSS imports 불가)
- No TypeScript: plain JavaScript만 사용
- `render(<ComponentName />)` 호출로 마무리
- 반응형, 모던 디자인 강조

**API Endpoints**:
- `GET /api/config`: 환경변수 설정 상태 (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)
- `POST /api/generate`: 컴포넌트 생성 (요청: `{ prompt, apiKey?, provider }`)

**CORS**: 모든 엔드포인트는 CORS 헤더 포함

### Environment & Configuration

- **Vite Config**: `vite.config.ts` - Vite proxy 설정 (`/api` → `http://localhost:3002`)
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- **ESLint**: `eslint.config.js`

## Common Development Commands

```bash
# Install dependencies
bun install

# Run dev server (Vite + Bun API concurrently)
bun run dev

# Run API server only (with watch mode)
bun run server

# Build for production
bun run build

# Lint
bun run lint

# Preview production build
bun run preview
```

## Configuration

### Environment Variables

Create `.env` file (copy from `.env.example`):
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

If `.env` is not set:
- API keys can be entered directly in the UI
- Server will validate at request time

### Vite & Dev Server

- Frontend runs at `http://localhost:5173` (Vite default)
- API server runs at `http://localhost:3002`
- Vite proxy automatically forwards `/api/*` to the backend

## Key Implementation Details

### Component Generation Flow

1. User submits prompt in `PromptInput`
2. `useComponentGenerator.generate()` calls `POST /api/generate`
3. Server routes to `callAnthropic()` or `callGoogle()` based on provider
4. AI returns raw code (may include markdown fences)
5. `stripCodeFences()` cleans up the response
6. `ensureRenderCall()` ensures `render()` call exists
7. Code returned to frontend
8. `LivePreview` wraps code in `<LiveProvider>` for runtime execution
9. Result displayed in `ComponentCard`

### Types

```typescript
type Provider = 'anthropic' | 'google';

interface GeneratedComponent {
  id: string;              // timestamp-based unique ID
  prompt: string;          // original user prompt
  code: string;            // generated JavaScript code
  createdAt: Date;         // creation timestamp
}
```

### AI Model Selection

- **Default Provider**: Google (set in `App.tsx` initial state)
- **Model IDs**:
  - Anthropic: `claude-haiku-4-5-20251001`
  - Google: `gemini-2.5-flash`
- Both models receive the same `SYSTEM_PROMPT` for consistency

### Error Handling

- API errors (4xx, 5xx) include user-friendly Korean messages
- Rate limit (429) and overload (503) errors have specific messages
- Client-side validation: missing API key, missing prompt

## Design & Styling

- **Styling**: CSS-in-JS (inline styles in generated components) + `src/App.css` for layout
- **Colors & Theme**: Modern gradients, shadows; prefer professional color palettes
- **Responsive**: Vite + React 19 standard responsive patterns
- **No external UI libraries**: Built with semantic HTML and CSS

## Notes for Future Development

- **Prompt Engineering**: System prompt is in `server/index.ts` (lines 1-43) — if component quality changes, check this first
- **API Rate Limiting**: Google Gemini has stricter rate limits than Anthropic; errors are caught and reported
- **Code Generation Constraints**: No external imports allowed (React must be global in react-live scope)
- **Testing**: No test suite currently; consider adding when CI/CD is required
