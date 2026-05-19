# LLM 스트리밍 기능 설계 문서

## 1. 배경 및 목표

### 현재 문제
컴포넌트 생성 시 전체 응답이 완료될 때까지 UI가 차단된다. 사용자는 스피너만 보다가 코드 전체가 한 번에 나타난다.

### 목표
LLM이 응답하는 동안 코드가 실시간으로 화면에 출력되도록 한다. 사용자는 생성 진행 상황을 즉시 확인할 수 있다.

---

## 2. 기술 설계

### 전체 흐름

```
사용자 입력
  → POST /api/generate-stream
  → Bun 서버 → AI API (stream: true)
  → SSE 청크 → 프론트엔드 ReadableStream 리더
  → streamingCode 상태 업데이트
  → 스트리밍 카드에 실시간 렌더링
  → 완료 → stripCodeFences + ensureRenderCall 후처리
  → GeneratedComponent 저장
```

### 서버: SSE 엔드포인트

**엔드포인트**: `POST /api/generate-stream`  
**응답 형식**: `text/event-stream` (Server-Sent Events)

```
data: {"chunk":"const MyComp"}\n\n
data: {"chunk":"onent = () => {"}\n\n
...
data: [DONE]\n\n
```

에러 발생 시:
```
data: {"error":"에러 메시지"}\n\n
```

**핵심 설계 결정**:
- 기존 `/api/generate` 엔드포인트는 그대로 유지 (하위 호환)
- `callAnthropicStream` / `callGoogleStream` async generator 패턴 사용
- 각 generator는 `try/finally { reader.cancel() }`로 연결 누수 방지
- `callAnthropicStream`의 catch: `SyntaxError`만 무시, 나머지는 re-throw

### Anthropic 스트리밍 파라미터

```json
{
  "model": "claude-haiku-4-5-20251001",
  "stream": true,
  "max_tokens": 4096
}
```

수신 이벤트 중 추출 대상:
```json
{ "type": "content_block_delta", "delta": { "type": "text_delta", "text": "..." } }
```

### Google 스트리밍 엔드포인트

```
POST /v1beta/models/gemini-2.5-flash:streamGenerateContent?key=...&alt=sse
```

수신 이벤트 중 추출 대상:
```json
{ "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
```

### 프론트엔드: Hook 변경

**새 상태**: `streamingCode: string | null`
- `null`: 스트리밍 비활성
- `""`: 스트리밍 시작 (아직 청크 없음)
- `"const ..."`: 누적된 코드

**SSE 파싱 패턴**:
```
buffer += decoded chunk
lines = buffer.split('\n')
buffer = lines.pop()  // 마지막 불완전 라인 보존
for line in lines → data: 접두사 확인 → JSON 파싱
```

**후처리 (스트림 완료 후)**:
1. `stripCodeFences(fullCode)` — 마크다운 펜스 제거
2. `ensureRenderCall(code)` — render() 호출 보증

> 후처리는 클라이언트에서 수행. 서버의 `/api/generate`와 위치가 다르므로 향후 일치 필요.

### 프론트엔드: UI 변경

기존 로딩 카드 → 스트리밍 카드로 교체:

```
┌─────────────────────────────────────┐
│ ● 컴포넌트를 생성하고 있습니다...    │
├─────────────────────────────────────┤
│ const MyComponent = () => {         │
│   const [count, setCount] =         │
│   React.useState(0);▋               │  ← 블링킹 커서
└─────────────────────────────────────┘
```

---

## 3. 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `server/index.ts` | `callAnthropicStream`, `callGoogleStream` 추가, `/api/generate-stream` 엔드포인트 추가 |
| `src/hooks/useComponentGenerator.ts` | `streamingCode` 상태 추가, `generate()` SSE 소비로 변경, 후처리 함수 이식 |
| `src/App.tsx` | `streamingCode` 구조분해, 스트리밍 카드 렌더링 추가 |
| `src/App.css` | `.streaming-card`, `.streaming-code-block`, `blink-cursor` 애니메이션 추가 |

---

## 4. Evaluator 리뷰 결과 및 조치

| 심각도 | 항목 | 조치 |
|--------|------|------|
| CRITICAL | reader 미해제로 연결 누수 | `try/finally { reader.cancel() }` 추가 (서버 2곳, 클라이언트 1곳) |
| CRITICAL | 에러 시 프론트 reader 미해제 | 동일 finally 블록으로 처리 |
| WARNING | `callAnthropicStream` 빈 catch {} | `catch (e) { if (!(e instanceof SyntaxError)) throw e; }`로 수정 |
| WARNING | AbortController 없음 | 미구현 — 향후 개선 항목으로 남김 |
| INFO | 후처리 위치 불일치 | 인지됨 — 향후 `/api/generate`도 클라이언트 후처리로 통일 고려 |

---

## 5. 미구현 항목 (향후 개선)

- **AbortController**: 스트리밍 중 중단 버튼 및 동시 요청 취소
- **후처리 위치 통일**: `/api/generate`와 `/api/generate-stream` 간 후처리 위치 일치
- **스트리밍 중 라이브 프리뷰**: 누적 코드가 유효한 JSX일 때 실시간 렌더링 시도
