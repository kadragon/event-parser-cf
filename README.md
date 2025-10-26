# Multi-Site Event Parser - Cloudflare Workers

다양한 웹사이트의 새로운 이벤트를 자동으로 수집하여 Telegram으로 매일 통지하는 Cloudflare Workers 애플리케이션입니다.

현재 지원: **혈액정보 (bloodinfo.net)**
확장 가능: **KTCU 및 기타 사이트** (플러그인 구조)

## 기능

- ✅ **멀티사이트 지원**: 플러그인 아키텍처로 여러 사이트 이벤트 수집
- ✅ **매일 자동 수집**: KST 기준 매일 12:00에 모든 등록된 사이트에서 이벤트 수집
- ✅ **중복 제거**: 사이트별 이벤트 ID로 기반으로 이미 전송한 이벤트는 제외
- ✅ **배치 알림**: 새로운 이벤트를 사이트별로 그룹화하여 하나의 Telegram 메시지로 전송
- ✅ **오류 알림**: 파싱/수집 실패 시 에러 메시지를 Telegram으로 전송
- ✅ **자동 정리**: 60일 이후 전송 기록 자동 삭제
- ✅ **사전 커밋 검증**: TypeScript 타입 체크로 오류 방지

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
├── .githooks/
│   └── pre-commit                  # 사전 커밋 검증 (TypeScript 타입 체크)
├── src/
│   ├── types/
│   │   └── site-parser.ts          # SiteParser 인터페이스 정의
│   ├── parsers/
│   │   ├── index.ts                # 파서 레지스트리
│   │   ├── ktcu.ts                 # KTCU 파서 (예제)
│   │   └── [새사이트].ts           # 추가 파서들
│   ├── index.ts                    # 메인 Worker 진입점 (파서 오케스트레이션)
│   ├── parser.ts                   # Bloodinfo 파서 (+ BloodinfoParser 클래스)
│   ├── kv.ts                       # KV Store 관리 (사이트별 키)
│   └── telegram.ts                 # Telegram API 통합 (멀티사이트 메시지)
├── wrangler.toml                   # Cloudflare Workers 설정
├── tsconfig.json                   # TypeScript 설정
├── package.json                    # NPM 설정
├── ARCHITECTURE.md                 # 아키텍처 설명서
├── DEVELOPMENT.md                  # 개발 가이드 및 pre-commit hook 설명
└── README.md                       # 이 파일
```


## 빠른 시작

### 1. 클론 및 설치

```bash
git clone <repo>
cd bloodinfo-event-parser-cf
npm install
```

### 2. Pre-commit Hook 자동 설정

```bash
# Git이 .githooks 디렉토리를 hooks로 사용하도록 설정
git config core.hooksPath .githooks
```

이제 커밋할 때마다 TypeScript 타입 체크가 자동으로 실행됩니다!

### 4. Telegram Bot Token 설정

```bash
# Telegram Bot Token 설정
wrangler secret put TELEGRAM_BOT_TOKEN

# Telegram Chat ID 설정
wrangler secret put TELEGRAM_CHAT_ID
```

### 5. KV Store 설정 (이미 설정됨)

`wrangler.toml`에 KV Store ID가 이미 설정되어 있습니다:

```toml
[[kv_namespaces]]
binding = "EVENTS_KV"  # 모든 사이트 이벤트를 통합 관리
id = "462fb1ac6a2c4ed5b53fa0006d2d61b9"
```

### 6. 개발 및 배포

```bash
# 로컬 개발 서버 (http://localhost:8787)
npm run dev

# 타입 체크
npx tsc --noEmit

# 테스트 실행
npm test

# Dry-run 확인
wrangler deploy --dry-run

# 실제 배포
wrangler deploy
```

## 크론 트리거

Worker는 `wrangler.toml`에 정의된 크론 스케줄에 따라 자동 실행됩니다:

```toml
[[triggers.crons]]
cron = "0 3 * * *"  # 매일 03:00 UTC (KST 기준 12:00)
```

## 작동 방식

```
1. 매일 12:00 KST 크론 트리거 실행
   ↓
2. 등록된 모든 사이트 파서에서 이벤트 수집
   - BloodinfoParser (bloodinfo.net)
   - KtcuParser (추가 예정)
   - [새로운 파서들...]
   ↓
3. KV Store에서 이미 전송한 이벤트 확인 (sent:{siteId}:{eventId})
   ↓
4. 새로운 이벤트만 필터링
   ↓
5. 사이트별로 그룹화한 Telegram 배치 메시지 발송
   ↓
6. 전송한 이벤트를 KV Store에 저장 (TTL: 60일)
```

### 오류 처리

- HTML 파싱 실패: Telegram 에러 메시지 발송
- API 호출 실패: 로그 기록 및 재시도 로직
- KV Store 오류: 폴백으로 모든 이벤트 전송 (중복 위험)

## Telegram 메시지 형식 (멀티사이트)

```
🩸 새로운 이벤트 안내

📍 혈액정보
1. 이벤트 제목 1
   📅 2025.01.01 ~ 2025.01.31
   🔗 https://www.bloodinfo.net/...?mi=1301

2. 이벤트 제목 2
   📅 2025.01.15 ~ 2025.02.15
   🔗 https://www.bloodinfo.net/...?mi=1302

📍 농협은행
1. 이벤트 제목 3
   📅 2025.01.20 ~ 2025.02.20
   🔗 https://www.ktcu.or.kr/...
```

각 사이트의 이벤트가 자동으로 그룹화되어 표시됩니다.

## API 명세

### SiteEvent 데이터 모델

```typescript
interface SiteEvent {
  siteId: string;        // 사이트 고유 ID (e.g., 'bloodinfo', 'ktcu')
  siteName: string;      // 사이트 표시 이름 (한글)
  eventId: string;       // 사이트 내 이벤트 고유 ID
  title: string;         // 이벤트 제목
  startDate: string;     // 시작일 (YYYY.MM.DD)
  endDate: string;       // 종료일 (YYYY.MM.DD)
  sourceUrl: string;     // 이벤트 접근 URL
}
```

### SiteParser 인터페이스

```typescript
interface SiteParser {
  siteId: string;                        // 사이트 고유 ID
  siteName: string;                      // 사이트 표시 이름
  fetchAndParse(): Promise<SiteEvent[]>; // 이벤트 수집 및 파싱
}
```

### KV Store 스키마 (멀티사이트)

```
Key: sent:{siteId}:{eventId}
Value: {
  "sentAt": "2025-10-26T00:00:00Z",
  "title": "이벤트 제목",
  "promtnSn": "eventId"
}
TTL: 60일 (5,184,000초)

예시:
- sent:bloodinfo:12345
- sent:ktcu:ABC-XYZ-001
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

## 새로운 사이트 파서 추가

새로운 사이트를 추가하려면:

### 1. 파서 파일 생성
`src/parsers/newsite.ts`:

```typescript
import type { SiteParser, SiteEvent } from '../types/site-parser';

export class NewSiteParser implements SiteParser {
  siteId = 'newsite';
  siteName = '새로운사이트명';

  async fetchAndParse(): Promise<SiteEvent[]> {
    // 1. 사이트에서 데이터 fetch
    // 2. 데이터 파싱
    // 3. SiteEvent[] 반환
  }
}
```

### 2. 레지스트리 등록
`src/index.ts`의 `siteParserRegistry`에 추가:

```typescript
import { NewSiteParser } from './parsers/newsite';

const siteParserRegistry: SiteParser[] = [
  new BloodinfoParser(),
  new KtcuParser(),
  new NewSiteParser(),  // 추가!
];
```

자세한 내용은 [ARCHITECTURE.md](ARCHITECTURE.md) 참조

## 개발 가이드

### Pre-commit Hook

```bash
git commit  # TypeScript 타입 체크 자동 실행
```

- 실패 시 오류 메시지 확인 후 수정
- `git commit --no-verify`로 건너뛸 수 있음 (권장하지 않음)

자세한 내용은 [DEVELOPMENT.md](DEVELOPMENT.md) 참조

## Spec-Driven Development (SDD)

이 프로젝트는 Spec-Driven Development 원칙을 따릅니다:

- 아키텍처 설계는 [ARCHITECTURE.md](ARCHITECTURE.md)에 기록
- Test-Driven Development (TDD) 방식으로 구현
- 모든 코드는 추적 가능한 구조로 작성
- 변경 사항은 커밋 메시지와 문서로 추적

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
wrangler tail
```

### 중복 이벤트가 계속 전송됨

KV Store가 제대로 설정되어 있는지 확인:

```bash
wrangler kv:key list --namespace-id 462fb1ac6a2c4ed5b53fa0006d2d61b9
```

## 라이선스

MIT

## 기여

개선 사항이나 버그 리포트는 Issue를 통해 알려주세요.

---

**마지막 업데이트**: 2025-10-26
**상태**: Production Ready ✅
