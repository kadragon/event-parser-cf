# Task 004: 테스트 타입 안전성 개선

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Priority**: Medium
**Size**: Small (15분)
**Status**: Completed
**Completed**: 2025-11-01

## Goal
`tests/kv.test.ts`에서 `any` 타입 사용으로 발생하는 6개의 ESLint 경고를 제거합니다.
타입이 지정된 mock helper를 생성하여 타입 안전성을 개선합니다.

## Context
**Current Issues**:
- File: `tests/kv.test.ts`
- ESLint Rule: `@typescript-eslint/no-explicit-any`
- Affected Lines: 13, 22, 31, 41, 67 (6 warnings total)
- Issue: KVNamespace mock에 `any` 타입 사용

## Implementation Plan

### 1. Create Mock Helper
**File**: `tests/mocks/kv.ts` (new file)

```typescript
import { vi } from 'vitest';

/**
 * Creates a properly typed mock KVNamespace for testing
 */
export function createMockKV(): KVNamespace {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

/**
 * Creates a mock KV with predefined responses
 */
export function createMockKVWithData(data: Record<string, string>): KVNamespace {
  return {
    get: vi.fn((key: string) => Promise.resolve(data[key] || null)),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}
```

### 2. Update Test File
**File**: `tests/kv.test.ts`

Replace all instances:
```typescript
// Before
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
} as any;

// After
import { createMockKV } from './mocks/kv';
const mockKV = createMockKV();
```

## Steps
1. Create `tests/mocks/` directory if not exists
2. Create `tests/mocks/kv.ts` with typed mock helpers
3. Update `tests/kv.test.ts`:
   - Add import for `createMockKV`
   - Replace all `as any` with `createMockKV()`
   - Remove explicit `any` type annotations
4. Run ESLint to verify warnings are gone
5. Run tests to verify no regression
6. Run build to verify no type errors

## DoD Checklist
- [x] `tests/mocks/` directory created
- [x] `tests/mocks/kv.ts` created with proper types
- [x] All `any` types removed from `tests/kv.test.ts`
- [x] All tests pass (`npm test`)
- [x] ESLint warnings reduced from 6 to 0 in kv.test.ts
- [x] Build successful (`npm run build`)
- [x] Type checking passes (verified via build)

## Test Strategy
- All existing tests must pass without modification to test logic
- Only mock creation method changes, not test assertions
- Verify with: `npm test tests/kv.test.ts`

## Additional Benefits
- Reusable mock helper for future KV-related tests
- Better IDE autocomplete for mock methods
- Catches type errors at compile time

## Rollback Plan
If tests fail, revert changes. The mock helper approach should be 100% compatible with current tests.

## Trace
- Addresses: Type Safety Issue #5.1 from refactoring analysis
- Related Files: tests/kv.test.ts
- ESLint Rule: @typescript-eslint/no-explicit-any
