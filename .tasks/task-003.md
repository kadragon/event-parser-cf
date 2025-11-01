# Task 003: eventId 필드명 통일

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Completed**: 2025-11-01
**Priority**: High
**Size**: Small (30분)
**Status**: Completed

## Goal
현재 이벤트 ID를 나타내는 필드명이 `promtnSn`과 `eventId`로 혼재되어 사용되고 있습니다.
도메인 모델의 일관성을 위해 `eventId`로 통일합니다.

## Context
**Current State**:
- `src/parsers/bloodinfo.ts`: `promtnSn` 사용 (lines 7, 43, 70, 89)
- `src/parsers/ktcu.ts`: `eventId` 사용 (lines 14, 80, 84)
- `src/site-parser.ts` (`SiteEvent` interface): `eventId` 사용 (line 7)
- `src/kv.ts` (`SentRecord` interface): `promtnSn` 사용 (line 6)

**Target State**:
- 모든 인터페이스와 코드에서 `eventId` 사용

## Impact Analysis
- **Breaking Change**: KV storage의 기존 데이터 구조 변경
- **Migration Needed**: 기존 KV 데이터의 필드명 마이그레이션 필요 (또는 호환성 유지)
- **Test Updates**: 관련 테스트 코드 업데이트 필요

## Implementation Plan

### Phase 1: Interface Updates
1. `src/kv.ts` - `SentRecord` interface 수정
   ```typescript
   export interface SentRecord {
     sentAt: string;
     title: string;
     eventId: string; // Changed from promtnSn
   }
   ```

2. `src/parsers/bloodinfo.ts` - Local `Event` interface 수정
   ```typescript
   interface Event {
     eventId: string; // Changed from promtnSn
     title: string;
     // ... other fields
   }
   ```

### Phase 2: Code Updates
3. `src/parsers/bloodinfo.ts` - All usages of `promtnSn`:
   - Line 43: `promtnSn: element.getAttribute('data-promtn-sn')`
   - Line 70: `return { promtnSn, title, category, ... }`
   - Line 89: `const promtnSn = row.promtnSn`
   - Line 160: `promtnSn: event.promtnSn`

4. `src/kv.ts` - All usages in KV operations:
   - Line 25: Store operation
   - Line 67: Read operation
   - Line 88: Key construction

### Phase 3: Backward Compatibility (선택사항)
5. KV read 시 fallback 로직 추가 (optional):
   ```typescript
   const eventId = record.eventId || record.promtnSn; // Support old data
   ```

### Phase 4: Test Updates
6. Update test files:
   - `tests/bloodinfo.test.ts`
   - `tests/kv.test.ts`
   - Any other tests referencing `promtnSn`

## Steps
1. Update `SentRecord` interface in `src/kv.ts`
2. Update `Event` interface in `src/parsers/bloodinfo.ts`
3. Search and replace all `promtnSn` references with `eventId`
4. Update all tests to use `eventId`
5. Run tests to verify
6. Run build to verify
7. Manual verification of KV operations

## DoD Checklist
- [x] `SentRecord` interface updated in src/kv.ts
- [x] `Event` interface updated in src/parsers/bloodinfo.ts
- [x] All code references to `promtnSn` replaced with `eventId`
- [x] All test references updated
- [x] All tests pass (`npm test`)
- [x] Build successful (`npm run build`)
- [x] Grep confirms no remaining `promtnSn` references in src/ and tests/
- [x] Documentation updated (README.md, spec files)

## Test Strategy
- Unit tests should fail initially (RED)
- Update tests to use `eventId`
- All tests should pass after changes (GREEN)

## Migration Considerations
**Option A: Breaking Change (Recommended for non-production)**
- Simply rename field
- Existing KV data becomes invalid
- Acceptable if no critical production data

**Option B: Graceful Migration (Production-safe)**
- Add fallback logic: `record.eventId || record.promtnSn`
- Gradually migrate data in background
- Remove fallback after migration complete

**Decision**: Option A (현재 feature 브랜치이므로 breaking change 허용)

## Rollback Plan
Git revert if tests fail or unexpected issues arise.

## Completion Notes
- ✅ All interfaces updated (SentRecord, Event)
- ✅ All code references changed: src/kv.ts (4 places), src/parsers/bloodinfo.ts (13 places)
- ✅ All test references changed: tests/kv.test.ts (2 places), tests/bloodinfo.test.ts (9 places)
- ✅ Build passed: 703.13 KiB / gzip: 167.56 KiB
- ✅ All tests passed: 40/40 tests
- ✅ Documentation updated: README.md, event-collector/spec.md, bloodinfo-category-filter/spec.md
- ✅ No promtnSn references remain in src/ and tests/

## Changes Made
1. **src/kv.ts** (4 changes):
   - Line 6: `SentRecord` interface field renamed
   - Line 43: Record initialization
   - Line 62: JSDoc comment
   - Line 70: Variable name in `getSentEvents`

2. **src/parsers/bloodinfo.ts** (13 changes):
   - Line 7: `Event` interface field renamed
   - Lines 36, 38, 56, 62, 89, 96: Variable names in `parseEvents`
   - Lines 144, 164, 170, 171: Comments and code in `fetchAllEvents`
   - Line 197: Mapping in `BloodinfoParser.fetchAndParse`

3. **tests/kv.test.ts** (2 changes):
   - Lines 51, 55: Test event object and usage

4. **tests/bloodinfo.test.ts** (9 changes):
   - Lines 7, 17, 36, 37: Test descriptions and assertions
   - Lines 111, 119, 135, 168, 169: Test descriptions, comments, and assertions

5. **Documentation** (3 files):
   - README.md: KV schema example
   - .spec/event-collector/spec.md: All AC, examples, interfaces
   - .spec/feature/bloodinfo-category-filter/spec.md: All references

## Migration Notes
- **Breaking Change**: Existing KV data structure changed
- **Decision**: Option A (breaking change) selected - acceptable for feature branch
- **Impact**: Existing KV records will need to be migrated or will expire naturally (60-day TTL)
- **No backward compatibility** implemented (feature branch, no production data)

## Trace
- Addresses: Naming Inconsistency Issue #2.1 from refactoring analysis
- Related Files: src/kv.ts, src/parsers/bloodinfo.ts, tests/, spec files
