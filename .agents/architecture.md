# Multi-Site Event Parser Architecture

## Overview

이 프로젝트는 **파서 인터페이스 추상화 + 플러그인식 구조**를 사용하여 여러 사이트의 이벤트를 수집하고 Telegram으로 알림을 보냅니다.

## Architecture

```
src/
├── types/
│   └── site-parser.ts              # 파서 인터페이스 정의
├── parsers/
│   ├── index.ts                    # 파서 레지스트리 (모든 파서 import/export)
│   ├── bloodinfo.ts                # Bloodinfo 파서 + BloodinfoParser 클래스
│   └── ktcu.ts                     # KTCU 파서 (예제)
├── kv.ts                           # KV Store 관리 (사이트별 키 지원)
├── telegram.ts                     # Telegram 알림 (멀티사이트 메시지 포맷)
└── index.ts                        # 메인 worker 진입점 (사이트 레지스트리 관리)
```

## Core Interfaces

### SiteParser
모든 사이트 파서가 구현해야 하는 인터페이스:

```typescript
interface SiteParser {
  siteId: string;                        // 사이트 고유 ID (e.g., 'bloodinfo', 'ktcu')
  siteName: string;                      // 사이트 표시 이름 (한글)
  fetchAndParse(): Promise<SiteEvent[]>; // 이벤트 수집 및 파싱
}
```

### SiteEvent
각 파서가 반환하는 표준화된 이벤트 형식:

```typescript
interface SiteEvent {
  siteId: string;        // 사이트 ID
  siteName: string;      // 사이트 명
  eventId: string;       // 사이트 내 이벤트 고유 ID
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;     // 이벤트 접근 URL
}
```

## Data Flow

```
[매일 12:00 KST]
        ↓
[index.ts - handleScheduled 실행]
        ↓
[Step 1: 모든 등록된 파서에서 이벤트 수집]
  - BloodinfoParser.fetchAndParse()
  - KtcuParser.fetchAndParse()
  - ... (더 많은 파서)
        ↓
[Step 2: KV Store에서 이미 전송한 이벤트 확인]
  - filterNewEvents() 사용
  - 키 포맷: sent:{siteId}:{eventId}
        ↓
[Step 3: 새로운 이벤트만 Telegram으로 발송]
  - sendEventNotification()
  - 사이트별로 그룹화된 메시지 포맷
        ↓
[Step 4: KV Store에 전송 기록 저장]
  - markEventAsSent()로 각 이벤트 기록
  - 60일 TTL 적용
```

## KV Store Keys

모든 기록은 하나의 KV Store(`EVENTS_KV`)에 사이트별로 구분:

```
Key Format: sent:{siteId}:{eventId}

예시:
- sent:bloodinfo:12345
- sent:ktcu:ABC-XYZ-001
```

## New Site Parser 추가 방법

### 1. 새로운 파서 파일 생성
`src/parsers/newsite.ts`:

```typescript
import type { SiteParser, SiteEvent } from '../types/site-parser';

export class NewSiteParser implements SiteParser {
  siteId = 'newsite';
  siteName = '새로운사이트명';

  async fetchAndParse(): Promise<SiteEvent[]> {
    // 1. 사이트에서 HTML 또는 JSON 데이터 fetch
    // 2. 데이터 파싱
    // 3. SiteEvent 배열 반환
    return events;
  }
}
```

### 2. 파서 레지스트리에 추가
`src/index.ts`의 `siteParserRegistry` 배열에 추가:

```typescript
import { KtcuParser } from './parsers/ktcu';
import { NewSiteParser } from './parsers/newsite';

const siteParserRegistry: SiteParser[] = [
  new BloodinfoParser(),
  new KtcuParser(),
  new NewSiteParser(),  // 추가!
];
```

또는 `src/parsers/index.ts`에서 import/export:

```typescript
export { NewSiteParser } from './newsite';
```

## 주요 기능

### 자동 에러 처리
- 한 파서가 실패해도 다른 파서는 계속 실행
- 실패한 파서는 로그에 기록하고 다음 실행에 재시도

### 중복 방지
- KV Store를 사용하여 60일 동안 전송한 이벤트 기록
- 같은 이벤트를 여러 번 보내지 않음

### 멀티사이트 메시지 포맷
Telegram 메시지는 사이트별로 자동 그룹화:

```
🩸 새로운 이벤트 안내

📍 혈액정보
1. 이벤트 제목 1
   📅 2025.01.01 ~ 2025.01.31
   🔗 https://...

📍 농협은행
1. 이벤트 제목 2
   📅 2025.01.15 ~ 2025.02.15
   🔗 https://...
```

## 배포

### 초기 배포
```bash
npm install
wrangler deploy
```

### 새로운 파서 추가 후
```bash
# 로컬 테스트
npm run dev

# 타입 체크
npx tsc --noEmit

# 배포
wrangler deploy
```

## 환경 변수

`wrangler.toml` 및 Cloudflare Workers 환경 설정:

```bash
# 토큰 설정
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID

# KV Store는 자동으로 binding됨 (EVENTS_KV)
```

## 기술 스택

- **Runtime**: Cloudflare Workers (TypeScript)
- **HTML Parser**: Cheerio
- **Scheduling**: Cloudflare Cron Triggers
- **Persistence**: Cloudflare KV Store
- **Notification**: Telegram Bot API

## 장점

✅ **확장성**: 새로운 사이트 추가 시 기존 코드 수정 최소화
✅ **독립성**: 각 파서는 독립적으로 개발/테스트 가능
✅ **재사용성**: `SiteParser` 인터페이스로 표준화
✅ **신뢰성**: 한 사이트 실패가 다른 사이트에 영향 없음
✅ **중앙화**: 모든 이벤트가 하나의 채팅방에서 관리됨
