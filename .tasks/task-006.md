# Task 006: 설정 중앙화

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Priority**: Medium
**Size**: Medium (45분)
**Status**: Completed
**Completed**: 2025-11-01

## Goal
현재 애플리케이션 설정이 여러 파일에 분산되어 있어 관리가 어렵습니다.
중앙화된 설정 파일을 만들어 유지보수성을 개선합니다.

## Context
**Current State - Configuration Scattered**:
1. **KTCU Config**: `src/parsers/ktcu.ts` lines 24-30
   - SITE_URL, FETCH_TIMEOUT_MS, etc.
2. **Telegram Config**: `src/telegram.ts` lines 9-13
   - MAX_MESSAGE_LENGTH, FETCH_TIMEOUT_MS, API_BASE_URL
3. **KV Config**: `src/kv.ts` line 85
   - READ_CONCURRENCY
4. **Bloodinfo Config**: Embedded in `src/parsers/bloodinfo.ts`
   - BASE_URL, PAGE_URLS, etc.

**Issues**:
- Hard to find all configuration values
- No single source of truth
- Difficult to change environment-specific settings
- Some values duplicated (e.g., FETCH_TIMEOUT_MS)

## Implementation Plan

### 1. Create Central Configuration Module
**File**: `src/config.ts`

```typescript
/**
 * Central configuration for event-parser-cf
 *
 * All application-wide settings should be defined here.
 * Environment-specific overrides can be applied through ENV variables.
 */

export const CONFIG = {
  /**
   * Bloodinfo parser configuration
   */
  bloodinfo: {
    baseUrl: 'https://www.bloodinfo.net',
    pageUrls: [
      '/knrcbs/portal/donor/event/eventList.do?page=1&srchDivCd=1',
      '/knrcbs/portal/donor/event/eventList.do?page=1&srchDivCd=2',
    ],
    fetchTimeoutMs: 10000,
    excludedCategories: [1302], // 혈액수급 관련 이벤트 제외
  },

  /**
   * KTCU parser configuration
   */
  ktcu: {
    siteUrl: 'https://www.ktcu.or.kr/PPW-WFA-100101',
    fetchTimeoutMs: 10000,
    selectors: {
      eventList: '#kosta-container > div.list-table > div > table > tbody',
      // ... other selectors
    },
  },

  /**
   * Telegram bot configuration
   */
  telegram: {
    apiBaseUrl: 'https://api.telegram.org',
    fetchTimeoutMs: 15000,
    maxMessageLength: 4096,
    messageSuffix: '\n\n\ud83d\udc89 헌혈 이벤트 알림봇',
  },

  /**
   * KV storage configuration
   */
  kv: {
    readConcurrency: 5,
    ttlDays: 60,
    keyPrefix: 'sent:',
  },

  /**
   * General application settings
   */
  app: {
    userAgent: 'Mozilla/5.0 (compatible; EventParserBot/1.0)',
  },
} as const;

/**
 * Type-safe configuration access
 */
export type AppConfig = typeof CONFIG;
```

### 2. Update Parser Files

**File**: `src/parsers/bloodinfo.ts`
- Remove local constants (BASE_URL, PAGE_URLS, etc.)
- Import: `import { CONFIG } from '../config';`
- Replace: `BASE_URL` → `CONFIG.bloodinfo.baseUrl`

**File**: `src/parsers/ktcu.ts`
- Remove local constants (SITE_URL, FETCH_TIMEOUT_MS, etc.)
- Import: `import { CONFIG } from '../config';`
- Replace constants with CONFIG references

### 3. Update Service Files

**File**: `src/telegram.ts`
- Remove local constants
- Import and use CONFIG.telegram

**File**: `src/kv.ts`
- Remove local constants
- Import and use CONFIG.kv

### 4. Update User-Agent Usage
**File**: `src/utils/user-agent.ts`
- Consider moving to config or keeping as is (decision needed)

## Steps
1. Create `src/config.ts` with all centralized configuration
2. Update `src/parsers/bloodinfo.ts`:
   - Remove BASE_URL, PAGE_URLS constants
   - Import CONFIG
   - Update all references
3. Update `src/parsers/ktcu.ts`:
   - Remove SITE_URL, FETCH_TIMEOUT_MS constants
   - Import CONFIG
   - Update all references
4. Update `src/telegram.ts`:
   - Remove MAX_MESSAGE_LENGTH, API_BASE_URL, etc.
   - Import CONFIG
   - Update all references
5. Update `src/kv.ts`:
   - Remove READ_CONCURRENCY constant
   - Import CONFIG
   - Update all references
6. Run tests to verify no regression
7. Run build to verify no type errors
8. Grep to verify no hardcoded URLs/timeouts remain

## DoD Checklist
- [x] `src/config.ts` created with comprehensive documentation
- [x] All parser files updated to use CONFIG
- [x] All service files updated to use CONFIG
- [x] No hardcoded configuration values remain in source files
- [x] All tests pass (`npm test`)
- [x] Build successful (`npm run build`)
- [x] Configuration is strongly typed (readonly)
- [x] JSDoc comments explain each configuration section

## Test Strategy
- All existing tests should pass without modification
- Tests can import CONFIG if they need to verify specific values
- Consider adding config validation tests:
  ```typescript
  describe('CONFIG', () => {
    it('should have valid URLs', () => {
      expect(CONFIG.bloodinfo.baseUrl).toMatch(/^https?:\/\//);
    });
  });
  ```

## Migration Path
1. Create config.ts first (new file)
2. Update one module at a time
3. Test after each module update
4. Ensure no breaking changes

## Future Enhancements
- Add environment variable overrides
- Add config validation at startup
- Consider using Zod for schema validation

## Rollback Plan
If tests fail or unexpected issues arise, revert changes module by module.

## Trace
- Addresses: Separation of Concerns Issue #3.2 from refactoring analysis
- Related Files: src/parsers/*, src/telegram.ts, src/kv.ts
