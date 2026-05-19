# PR Template — react-component-generator

## Summary
<!-- 변경사항의 목적과 배경을 2-3문장으로 서술한다. "왜"에 집중. -->

## Changes
### feat
- 
### fix
- 
### chore / docs / style
- 

## Test Plan
- [ ] `bun run dev`로 개발 서버 정상 실행 확인 (port 3002 + 5173)
- [ ] `bun run build`로 빌드 성공 확인
- [ ] `bun run lint`로 ESLint 통과 확인

## Notes
없음
```

---

## 검증 방법

1. `/pr-create` 또는 "PR 만들어줘" 입력 시 스킬 자동 트리거 확인
2. main 브랜치에서 실행 → 경고 출력 확인
3. feature 브랜치에서 실행 → diff 분석 → 템플릿 로드 → 미리보기 출력 확인
4. `yes` 입력 시 `gh pr create` 실행 및 URL 반환 확인
5. upstream remote 있는 fork 환경에서 `--repo` 플래그 자동 추가 확인