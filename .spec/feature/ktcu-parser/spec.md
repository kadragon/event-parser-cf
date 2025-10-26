# KTCU (한국교직원공제회) 이벤트 파서

Intent: 한국교직원공제회 사이트에서 진행 중인 이벤트만 수집하는 기능

Scope:
- In: HTML 파싱, 이벤트 추출, 날짜 형식 변환, 종료된 이벤트 필터링
- Out: 이벤트 ID 생성 로직, API 통신, 데이터베이스 저장

Dependencies:
- `cheerio` (HTML 파싱)
- `SiteParser` 인터페이스
- `KV Store` (중복 제거)

## Behaviour (GWT)

### AC-1: 이벤트 HTML 파싱
- GIVEN: KTCU 사이트 HTML
- WHEN: `parseKtcuEvents()` 함수 호출
- THEN: `<div class="box-event">` 요소에서 이벤트 추출, 배열 반환

### AC-2: 제목 추출 (HTML 태그 제거)
- GIVEN: `<strong class="tit">The-K행복서비스<br>2025년도 <문화라운지></strong>`
- WHEN: 텍스트 추출
- THEN: 공백 정규화 후 "The-K행복서비스 2025년도 <문화라운지>" 반환

### AC-3: 날짜 파싱 (YYYY.MM.DD 형식 변환)
- GIVEN: `2025-09-29(월) ~ 2025-10-12(일)`
- WHEN: 날짜 범위 파싱
- THEN: startDate="2025.09.29", endDate="2025.10.12" (점(.) 구분자, 한글 요일 제거)

### AC-4: 이벤트 ID 추출
- GIVEN: `onclick="fn_viewEvent('DkKzELPvvuiCuPiW7hnkiHd0ljob7Bba')"`
- WHEN: 이벤트 요소 파싱
- THEN: eventId="DkKzELPvvuiCuPiW7hnkiHd0ljob7Bba"

### AC-5: 종료된 이벤트 필터링
- GIVEN: 모든 이벤트 (종료됨 표시 또는 현재 날짜 기준)
- WHEN: `parseKtcuEvents()` 호출 후 필터링
- THEN: 현재 날짜보다 endDate가 이후인 이벤트만 반환

### AC-6: URL 생성
- GIVEN: eventId="DkKzELPvvuiCuPiW7hnkiHd0ljob7Bba"
- WHEN: sourceUrl 생성
- THEN: `https://www.ktcu.or.kr/PPW-WFA-100101#DkKzELPvvuiCuPiW7hnkiHd0ljob7Bba` (또는 적절한 상세 URL)

### AC-7: fetch & parse 통합
- GIVEN: KTCU 사이트 URL
- WHEN: `fetchAndParseKtcuEvents()` 호출
- THEN: HTTP 요청 후 파싱, KtcuEvent[] 반환

### AC-8: SiteParser 인터페이스 구현
- GIVEN: KtcuParser 인스턴스
- WHEN: `fetchAndParse()` 호출
- THEN: SiteEvent[] 배열 반환 (siteId, siteName 포함)

## Examples (Tabular)

| Case | Input HTML | Expected eventId | Expected Title | StartDate | EndDate | Status |
|------|-----------|------------------|-----------------|-----------|---------|--------|
| 정상 | `onclick="fn_viewEvent('DkKz...')` | DkKz... | The-K행복서비스 2025년도 <문화라운지> | 2025.09.29 | 2025.10.12 | 종료 |
| HTML 태그 제거 | `<strong>제목<br>계속</strong>` | - | 제목 계속 | - | - | OK |
| 날짜 변환 | `2025-09-29(월) ~ 2025-10-12(일)` | - | - | 2025.09.29 | 2025.10.12 | OK |

## API (Summary)

### `parseKtcuEvents(html: string): KtcuEvent[]`
- Input: 원본 HTML 문자열
- Output: 파싱된 이벤트 배열 (진행 중만)
- Errors: HTML 파싱 실패 시 Error throw

### `fetchAndParseKtcuEvents(): Promise<KtcuEvent[]>`
- Input: 없음 (URL 내부)
- Output: Promise<KtcuEvent[]>
- Errors: fetch 실패, 4xx/5xx 응답 시 Error throw

### `KtcuParser.fetchAndParse(): Promise<SiteEvent[]>`
- 상위 두 함수의 조합
- SiteEvent 형식으로 변환

## Data & State

### KtcuEvent 데이터 구조
```typescript
interface KtcuEvent {
  eventId: string;     // 고유 ID (aplySn)
  title: string;       // 이벤트 제목 (HTML 태그 제거, 공백 정규화)
  startDate: string;   // YYYY.MM.DD 형식
  endDate: string;     // YYYY.MM.DD 형식
  sourceUrl: string;   // 이벤트 접근 URL
}
```

### 필터링 기준
- endDate >= 현재 날짜 (자정 기준)
- "종료" 플래그가 없거나 날짜 기반 필터링

### 상태 변화
- HTML 파싱 → 이벤트 추출 → 날짜 변환 → 필터링 → SiteEvent 변환

## Tracing
- Spec-ID: SPEC-KTCU-PARSER-001
- Trace-To:
  - TEST-KTCU-001: AC-1 (파싱)
  - TEST-KTCU-002: AC-2 (제목 추출)
  - TEST-KTCU-003: AC-3 (날짜 파싱)
  - TEST-KTCU-004: AC-4 (ID 추출)
  - TEST-KTCU-005: AC-5 (필터링)
  - TEST-KTCU-006: AC-7 (통합)
  - TEST-KTCU-007: AC-8 (인터페이스)
