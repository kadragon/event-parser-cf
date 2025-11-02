# KTCU 중복 이벤트 발송 방지 개선

Intent: eventId가 변경되는 경우에도 같은 이벤트의 중복 발송을 방지

Scope:
- In: KTCU 파서에서 title 해시를 eventId로 사용
- Out: kv.ts의 복잡한 복합 키 로직 (간단한 단일 키 접근 유지)

Dependencies:
- `parsers/ktcu.ts` (eventId를 title 해시로 변경)
- `crypto` (제목 해시 생성)

## Behaviour (GWT)

### AC-1: KTCU 파서가 title 해시를 eventId로 생성
- GIVEN: KTCU 이벤트 파싱
- WHEN: `parseKtcuEvents(html)` 호출
- THEN: eventId가 title의 SHA-256 해시 (16자)로 설정됨

### AC-2: 같은 제목의 이벤트는 같은 eventId 생성
- GIVEN: 같은 제목의 이벤트를 두 번 파싱
- WHEN: `parseKtcuEvents(html1)`, `parseKtcuEvents(html2)` 호출
- THEN: 두 이벤트의 eventId가 동일

### AC-3: 중복 체크는 기존 로직 사용
- GIVEN: 같은 제목의 이벤트가 이미 발송됨 (eventId = title 해시)
- WHEN: `isEventSent(kv, 'ktcu', titleHash)` 호출
- THEN: true 반환 (기존 단일 키 로직으로 동작)

## Examples (Tabular)

| Case | Original EventId | Title | Generated EventId (hash) | Already Sent? | Expected Result |
|------|------------------|-------|--------------------------|---------------|-----------------|
| 새 이벤트 | abc123 | "영화예매권 증정" | hash("영화예매권 증정") | No | false (발송) |
| 같은 제목, eventId 변경됨 | xyz789 | "영화예매권 증정" | hash("영화예매권 증정") | Yes (same hash) | true (차단) |
| 다른 제목 | xyz789 | "공연티켓 증정" | hash("공연티켓 증정") | No | false (발송) |

## API (Summary)

### `parseKtcuEvents(html)`
- Input: HTML string
- Output: KtcuEvent[] (with eventId = title hash)
- Behavior: 원래 onclick의 eventId는 무시하고, title 해시를 eventId로 사용

### `generateTitleHash(title)` (internal)
- Input: Event title
- Output: SHA-256 hash (16자)
- Behavior: 정규화된 제목의 해시 생성

## Data & State

### KV Keys
- 변경 없음: `sent:{siteId}:{eventId}` (단, KTCU의 eventId는 title 해시)

### 제목 해시 생성
- 알고리즘: SHA-256
- 입력: 정규화된 제목 (trim, 소문자 변환)
- 출력: Hex string (첫 16자 사용)
- 위치: `parsers/ktcu.ts` (KTCU 파서 내부)

## Tracing
- Spec-ID: SPEC-KTCU-DUP-FIX-001
- Trace-To:
  - TEST-KTCU-DUP-001: AC-1 (eventId 체크)
  - TEST-KTCU-DUP-002: AC-2 (제목 체크)
  - TEST-KTCU-DUP-003: AC-3 (복합 키 생성)
