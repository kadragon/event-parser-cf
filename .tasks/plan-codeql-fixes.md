# CodeQL 보안 및 성능 이슈 해결 계획

**Created**: 2025-10-27
**Sprint**: CodeQL Findings Remediation
**Status**: Planning

---

## 개요

CodeQL 분석에서 발견된 보안(High), 성능(Medium), 테스트(Low) 이슈 5가지를 우선순위별로 해결

---

## 작업 목록

### PHASE 1: Critical (보안)

#### TASK-001: HTML 이스케이핑 취약점 수정
**Linked Spec**: SPEC-telegram-escaping-001
**Priority**: High
**Affected Files**: `src/telegram.ts:62-68`, `src/telegram.ts:137-152`

**Description**:
- `buildEventMessage()`와 `sendErrorNotification()`에서 사용자 제어 데이터가 HTML에 직접 주입됨
- 타겟 사이트나 에러에서 `<`, `>`, `&` 포함 시 마크업 깨짐 또는 악성 링크 주입 가능

**DoD Checklist**:
- [ ] 테스트 작성 (XSS 페이로드 포함)
- [ ] `xss` 라이브러리 또는 MarkdownV2로 이스케이핑 구현
- [ ] 기존 telegram 테스트 통과
- [ ] 수정 사항 `.spec` 기록

---

### PHASE 2: High (운영 모니터링)

#### TASK-002: 파서 실패 무시 문제 해결
**Linked Spec**: SPEC-parser-error-aggregation-001
**Priority**: Medium
**Affected Files**: `src/index.ts:69-94`

**Description**:
- 모든 파서 실패 시 조용히 `allEvents = []`로 진행
- 사이트 장애를 감지하지 못하고 "No new events" 로그만 남음
- 운영자 알림 필요

**DoD Checklist**:
- [ ] 파서별 에러 수집 로직 추가
- [ ] 모든 파서 실패 시 에러 요약 생성
- [ ] 에러 요약을 Telegram으로 전송 (또는 별도 로깅)
- [ ] 통합 테스트 작성
- [ ] `.spec` 기록

---

### PHASE 3: Performance & Reliability

#### TASK-003: KV 쓰기 순차 처리 문제 해결
**Linked Spec**: SPEC-kv-write-batching-001
**Priority**: Medium
**Affected Files**: `src/index.ts:87-89`

**Description**:
- Telegram 발송 후 `markEventAsSent()` 순차 실행
- 한 번의 KV 쓰기 실패 시 전체 run 실패 → 이벤트 중복 알림
- `Promise.allSettled()` + 개별 실패 로깅으로 개선

**DoD Checklist**:
- [ ] `Promise.allSettled()` 적용
- [ ] 개별 KV 실패 로깅 추가
- [ ] 부분 실패 시나리오 테스트
- [ ] `.spec` 기록

---

#### TASK-004: KV 조회 병렬화
**Linked Spec**: SPEC-kv-parallel-reads-001
**Priority**: Medium
**Affected Files**: `src/kv.ts:88-95`

**Description**:
- `filterNewEvents()`에서 이벤트마다 개별 KV 요청
- 수십 개 이벤트 = 수십 번의 왕복 → 성능 저하
- 병렬 처리(동시 실행 제한 포함) 또는 배치 API 활용

**DoD Checklist**:
- [ ] 병렬 조회 로직 구현 (동시 실행 제한: e.g., 5-10개)
- [ ] 성능 테스트 추가 (이벤트 100개 기준)
- [ ] Worker 런타임 개선 확인
- [ ] `.spec` 기록

---

### PHASE 4: Testing

#### TASK-005: 테스트 타입 체크 개선
**Linked Spec**: SPEC-test-typechecking-001
**Priority**: Low
**Affected Files**: `tests/telegram.test.ts:109`, `tsconfig.json`

**Description**:
- 테스트가 tsconfig 범위 밖 → fixture 타입 검증 누락
- "handles API errors" 테스트에서 `SiteEvent` 필드 누락

**DoD Checklist**:
- [ ] `tsconfig.test.json` 생성 또는 기존 tsconfig 수정
- [ ] 테스트 fixture 타입 정의 정확화
- [ ] `tsc --noEmit` 통과 확인
- [ ] 테스트 재실행

---

## 실행 순서

1. **TASK-001** (보안, 블로킹 이슈)
2. **TASK-002** (운영 모니터링)
3. **TASK-003** + **TASK-004** (병렬 진행 가능)
4. **TASK-005** (검증)

---

## 추적 정보

**Spec Directory**: `.spec/features/codeql-remediation/`
**Test Files**: `tests/telegram.test.ts`, `tests/index.test.ts`, `tests/kv.test.ts`
**Commit Convention**: `fix: [TASK-NNN] <title>` + `Trace: TASK-NNN`

---

## 예상 소요 시간

- TASK-001: 1-2h
- TASK-002: 1-2h
- TASK-003: 1h
- TASK-004: 1-1.5h
- TASK-005: 0.5h

**Total**: ~5-7h

