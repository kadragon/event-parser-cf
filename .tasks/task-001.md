# Task 001: 문서의 오래된 파일 참조 수정

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Completed**: 2025-11-01
**Priority**: High
**Size**: Small (15분)
**Status**: Completed

## Goal
최근 리팩토링(commit 790618c)으로 `parser.ts` → `parsers/bloodinfo.ts`로 이동했으나,
문서들이 여전히 구 경로를 참조하고 있어 이를 수정합니다.

## Context
- Commit 790618c: "refactor: Organize parser structure into parsers directory"
- 코드는 이미 정리되었으나 문서 업데이트가 누락됨

## Files to Update
1. `/Users/kadragon/Dev/event-parser-cf/README.md` line 41
2. `/Users/kadragon/Dev/event-parser-cf/.agents/architecture.md` line 16
3. `/Users/kadragon/Dev/event-parser-cf/.spec/event-collector/spec.md` line 167
4. `/Users/kadragon/Dev/event-parser-cf/.spec/feature/bloodinfo-category-filter/spec.md` lines 9, 46

## Changes Required
Replace all occurrences:
- `src/parser.ts` → `src/parsers/bloodinfo.ts`
- `parser.ts` → `parsers/bloodinfo.ts`

## Steps
1. Read each file to confirm exact location and context
2. Update each reference using Edit tool
3. Verify all references are updated
4. Update this task status to completed

## DoD Checklist
- [x] README.md 참조 수정 완료
- [x] .agents/architecture.md 참조 수정 완료
- [x] .spec/event-collector/spec.md 참조 수정 완료
- [x] .spec/feature/bloodinfo-category-filter/spec.md 참조 수정 완료
- [x] All files build successfully
- [x] Grep search confirms no remaining `parser.ts` references in docs

## Completion Notes
- ✅ All 4 documentation files successfully updated
- ✅ Build passed: 703.42 KiB / gzip: 167.60 KiB
- ✅ All tests passed: 40/40 tests
- ✅ No remaining `parser.ts` references in documentation
- No test changes required (documentation only)
- No code changes required
- Low risk, high value change

## Changes Made
1. **README.md:41** - Updated project structure tree
   - `├── parser.ts` → `├── bloodinfo.ts` (moved into parsers/ directory)
2. **architecture.md:16** - Updated architecture diagram
   - `├── parser.ts` → `├── bloodinfo.ts` (moved into parsers/ directory)
3. **event-collector/spec.md:167** - Updated implementation files list
   - `src/parser.ts` → `src/parsers/bloodinfo.ts`
4. **bloodinfo-category-filter/spec.md:9,46** - Updated trace references (2 locations)
   - `src/parser.ts` → `src/parsers/bloodinfo.ts`
