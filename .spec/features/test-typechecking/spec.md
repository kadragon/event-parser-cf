# 테스트 파일 TypeScript 타입 체킹

**Intent**: 테스트 파일도 TypeScript 엄격 검사에 포함하여 fixture 타입 오류 조기 감지

**Scope**:
- In: `tsconfig.json` 설정, 테스트 파일 포함
- Out: 테스트 로직, 실제 소스 코드는 유지

**Dependencies**:
- 기존 `tsconfig.json` 수정 또는 `tsconfig.test.json` 생성
- Vitest 설정은 유지

---

## Behaviour (GWT)

- **AC-1**: 테스트 파일이 TypeScript 타입 체킹에 포함된다
  - GIVEN `tsc --noEmit` 실행
  - WHEN 테스트 파일 포함
  - THEN 테스트의 타입 오류 감지

- **AC-2**: 테스트 fixture의 누락된 필드를 감지한다
  - GIVEN `SiteEvent` 타입에 `siteId` 필수 필드
  - WHEN 테스트에서 `siteId` 없이 객체 생성
  - THEN TypeScript 에러 발생

- **AC-3**: 기존 테스트는 여전히 실행된다
  - GIVEN 모든 테스트 파일이 유효한 타입
  - WHEN `npm test` 실행
  - THEN 테스트 정상 실행

---

## Examples (Tabular)

| Scenario | Before | After |
|----------|--------|-------|
| Missing field in fixture | No error (runtime) | TypeScript error (compile-time) |
| tsc validation | Tests ignored | Tests checked |
| npm test | Still works | Still works |

---

## API (Summary)

**Changes to tsconfig**:
- Remove `"exclude": ["node_modules", "tests"]` from `tsconfig.json`
- OR create `tsconfig.test.json` extending base config with tests included

**Recommended approach**: Separate `tsconfig.test.json`
- Extends base tsconfig
- Includes both `src` and `tests`
- Used for type checking only

---

## Data & State

- No code changes required (if fixtures are already correct)
- Only configuration changes

---

## Implementation Notes

1. **Option A**: Modify tsconfig.json
   - Change: `"exclude": ["node_modules", "tests"]` → `"exclude": ["node_modules"]`
   - Simple but tests now in main build config

2. **Option B**: Create tsconfig.test.json (recommended)
   ```json
   {
     "extends": "./tsconfig.json",
     "include": ["src/**/*", "tests/**/*"],
     "exclude": ["node_modules"]
   }
   ```
   - Add `"tsc --noEmit -p tsconfig.test.json"` to type-check script

3. **Verification**:
   ```bash
   tsc --noEmit -p tsconfig.test.json
   ```

---

## Tracing

**Spec-ID**: SPEC-TEST-TYPECHECKING-001
**Task-ID**: TASK-005
**Related Issue**: CodeQL Low finding (test fixtures missing required fields)
**Files Modified**: `tsconfig.json`, `tsconfig.test.json` (new), `tests/telegram.test.ts` (fixture fixes if needed)
**Implementation Files**: Configuration files
