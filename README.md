# Bloodinfo Event Parser - Cloudflare Workers

혈액정보 웹사이트의 새로운 이벤트를 자동으로 수집하여 Telegram으로 매일 통지하는 Cloudflare Workers 애플리케이션입니다.

## 기능

- ✅ **매일 자동 수집**: KST 기준 매일 00:00에 bloodinfo.net에서 이벤트 수집
- ✅ **중복 제거**: `promtnSn` 기반으로 이미 전송한 이벤트는 제외
- ✅ **배치 알림**: 새로운 이벤트를 하나의 Telegram 메시지로 전송
- ✅ **오류 알림**: 파싱 실패 시 에러 메시지를 Telegram으로 전송
- ✅ **자동 정리**: 60일 이후 전송 기록 자동 삭제

## 사용 기술

- **Runtime**: Cloudflare Workers
- **언어**: TypeScript
- **HTML 파싱**: cheerio
- **상태 저장**: Cloudflare KV Store
- **알림**: Telegram Bot API
- **테스팅**: Vitest (14 tests, all passing ✅)

## 프로젝트 구조

```
bloodinfo-event-parser-cf/
├── .spec/
│   └── event-collector/
│       └── spec.md                 # 사양 문서 (GWT 기반)
├── src/
│   ├── index.ts                    # 메인 Worker 진입점
│   ├── parser.ts                   # HTML 파싱 로직
│   ├── kv.ts                       # KV Store 연동
│   └── telegram.ts                 # Telegram API 통합
├── tests/
│   ├── parser.test.ts              # 파서 테스트
│   ├── kv.test.ts                  # KV Store 테스트
│   └── telegram.test.ts            # Telegram API 테스트
├── wrangler.toml                   # Cloudflare Workers 설정
├── package.json                    # NPM 설정
├── tsconfig.json                   # TypeScript 설정
└── README.md                       # 이 파일

```

## 설치 및 배포

### 1. 로컬 설정

```bash
npm install
```

### 2. 환경 변수 설정

```bash
# Telegram Bot Token 설정
wrangler secret put TELEGRAM_BOT_TOKEN --env production

# Telegram Chat ID 설정
wrangler secret put TELEGRAM_CHAT_ID --env production
```

### 3. KV Store 설정

```bash
# 새로운 KV Store 생성
wrangler kv:namespace create "EVENTS_KV" --env production

# 프리뷰용 KV Store 생성
wrangler kv:namespace create "EVENTS_KV" --preview --env production
```

생성된 ID를 `wrangler.toml`의 `kv_namespaces` 섹션에서 업데이트하세요:

```toml
[[kv_namespaces]]
binding = "EVENTS_KV"
id = "YOUR_KV_ID"
preview_id = "YOUR_PREVIEW_KV_ID"
```

### 4. 테스트 실행

```bash
npm test
```

### 5. 배포

```bash
# 프로덕션 배포
wrangler deploy --env production
```

## 크론 트리거

Worker는 `wrangler.toml`에 정의된 크론 스케줄에 따라 자동 실행됩니다:

```toml
[[triggers.crons]]
cron = "0 15 * * *"  # 매일 15:00 UTC (KST 기준 다음날 00:00)
```

## 작동 방식

```
1. 매일 00:00 KST 크론 트리거 실행
   ↓
2. 3개 카테고리(mi=1301,1302,1303)에서 이벤트 수집
   ↓
3. KV Store에서 이미 전송한 이벤트 확인
   ↓
4. 새로운 이벤트만 필터링
   ↓
5. Telegram으로 배치 메시지 발송
   ↓
6. 전송한 이벤트를 KV Store에 저장 (TTL: 60일)
```

### 오류 처리

- HTML 파싱 실패: Telegram 에러 메시지 발송
- API 호출 실패: 로그 기록 및 재시도 로직
- KV Store 오류: 폴백으로 모든 이벤트 전송 (중복 위험)

## Telegram 메시지 형식

```
🩸 혈액정보 새 이벤트 안내

📌 이벤트 1: [제목]
   기간: YYYY.MM.DD ~ YYYY.MM.DD
   링크: https://www.bloodinfo.net/...?mi=1301

📌 이벤트 2: [제목]
   기간: YYYY.MM.DD ~ YYYY.MM.DD
   링크: https://www.bloodinfo.net/...?mi=1302

🔗 상세보기:
- https://www.bloodinfo.net/...?mi=1301
- https://www.bloodinfo.net/...?mi=1302
- https://www.bloodinfo.net/...?mi=1303
```

## API 명세

### Event 데이터 모델

```typescript
interface Event {
  promtnSn: string;      // 이벤트 고유 ID (data-id)
  title: string;         // 이벤트 제목
  startDate: string;     // 시작일 (YYYY.MM.DD)
  endDate: string;       // 종료일 (YYYY.MM.DD)
  sourceUrl: string;     // 출처 (mi=XXXX)
}
```

### KV Store 스키마

```
Key: sent:{promtnSn}
Value: {
  "sentAt": "2025-10-26T00:00:00Z",
  "title": "이벤트 제목",
  "promtnSn": "12345"
}
TTL: 60일 (5,184,000초)
```

## 테스트

총 14개의 테스트가 다음 시나리오를 커버합니다:

- ✅ AC-1: 이벤트 수집 및 파싱
- ✅ AC-2: 중복 제거 (KV Store 확인)
- ✅ AC-3: 배치 Telegram 메시지 전송
- ✅ AC-4: 오류 알림 전송
- ✅ AC-5: 새 이벤트 없을 때 침묵 (테스트 커버되지 않음 - 수동 검증)

```bash
npm test          # 테스트 실행
npm test:watch    # Watch 모드
```

## Spec-Driven Development (SDD)

이 프로젝트는 Spec-Driven Development 원칙을 따릅니다:

- `.spec/` 디렉토리에 모든 사양 문서 보관
- Test-Driven Development (TDD) 방식으로 구현
- 모든 코드는 spec ID로 추적 가능
- 변경 사항은 .spec 문서 업데이트로 시작

자세한 내용: `.spec/event-collector/spec.md`

## 문제 해결

### "KV namespace not found" 오류

`wrangler.toml`에서 KV namespace ID를 확인하세요:

```bash
wrangler kv:namespace list
```

### Telegram 메시지가 전송되지 않음

- Bot Token과 Chat ID가 올바른지 확인
- Telegram Bot이 활성화되어 있는지 확인
- Worker 로그 확인:

```bash
wrangler tail --env production
```

### 중복 이벤트가 계속 전송됨

KV Store가 제대로 설정되어 있는지 확인:

```bash
wrangler kv:key list --namespace-id YOUR_KV_ID --env production
```

## 라이선스

MIT

## 기여

개선 사항이나 버그 리포트는 Issue를 통해 알려주세요.

---

**마지막 업데이트**: 2025-10-26
**상태**: Production Ready ✅
