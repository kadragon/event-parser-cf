# Task 002: fetchWithTimeout 유틸리티 추출

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Completed**: 2025-11-01
**Priority**: High
**Size**: Small (20분)
**Status**: Completed

## Goal
`fetchWithTimeout` 함수가 `src/telegram.ts`와 `src/parsers/ktcu.ts`에 중복 정의되어 있습니다.
이를 공통 유틸리티로 추출하여 코드 중복을 제거합니다.

## Context
- **Duplication Location 1**: `src/telegram.ts` lines 32-45
- **Duplication Location 2**: `src/parsers/ktcu.ts` lines 40-49
- 두 구현은 거의 동일하나 미묘한 차이 존재

## Implementation Plan

### 1. Create New Utility Module
**File**: `src/utils/fetch.ts`

```typescript
/**
 * Fetch with timeout using AbortController
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise<Response>
 * @throws {Error} If request times out or fails
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 2. Update Imports
- `src/telegram.ts`: Remove local implementation, import from utils
- `src/parsers/ktcu.ts`: Remove local implementation, import from utils

### 3. Update Utils Index
- Add export to `src/utils/index.ts` (create if not exists)

## Steps
1. Create `src/utils/fetch.ts` with unified implementation
2. Update `src/telegram.ts`:
   - Remove lines 32-45
   - Add import: `import { fetchWithTimeout } from './utils/fetch';`
3. Update `src/parsers/ktcu.ts`:
   - Remove lines 40-49
   - Add import: `import { fetchWithTimeout } from '../utils/fetch';`
4. Run tests to verify no regression
5. Run build to verify no type errors

## DoD Checklist
- [x] `src/utils/fetch.ts` created with proper TypeScript types
- [x] JSDoc documentation added
- [x] `src/telegram.ts` updated to use new utility
- [x] `src/parsers/ktcu.ts` updated to use new utility
- [x] All existing tests pass (`npm test`)
- [x] Build successful (`npm run build`)
- [x] No ESLint errors
- [x] Grep confirms no remaining duplicate implementations

## Test Strategy
- Existing tests in `tests/telegram.test.ts` and `tests/ktcu.test.ts` should pass without modification
- No new tests required (behavior unchanged, just refactored)

## Rollback Plan
If tests fail, revert changes and investigate discrepancies between implementations.

## Completion Notes
- ✅ `src/utils/fetch.ts` created with comprehensive JSDoc
- ✅ `src/telegram.ts` updated: removed lines 23-45, added import
- ✅ `src/parsers/ktcu.ts` updated: removed lines 32-49, added import, updated call site
- ✅ Build passed: 703.15 KiB / gzip: 167.59 KiB
- ✅ All tests passed: 40/40 tests
- ✅ No duplicate implementations: only 1 file has fetchWithTimeout definition

## Changes Made
1. **Created `src/utils/fetch.ts`**:
   - Unified implementation with `options: RequestInit` parameter
   - Comprehensive JSDoc with @example
   - Uses AbortController for timeout handling

2. **Updated `src/telegram.ts`**:
   - Added import: `import { fetchWithTimeout } from './utils/fetch';`
   - Removed local implementation (lines 23-45)
   - No changes to call sites (already used correct signature)

3. **Updated `src/parsers/ktcu.ts`**:
   - Added import: `import { fetchWithTimeout } from '../utils/fetch';`
   - Removed local implementation (lines 32-49)
   - Updated call site: `fetchWithTimeout(url, {}, timeout)` (added empty options)

## Trace
- Addresses: Code Duplication Issue #1.1 from refactoring analysis
- Related Files: src/telegram.ts, src/parsers/ktcu.ts
- New File: src/utils/fetch.ts
