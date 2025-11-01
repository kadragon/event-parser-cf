# Refactoring Backlog

Created: 2025-11-01
Status: Active

## Overview
리팩토링 분석을 통해 식별된 개선 사항들을 단계적으로 진행합니다.
각 작업은 작은 단위로 분리되어 있으며, 우선순위에 따라 순차적으로 처리됩니다.

## Priority: High

### TASK-001: 문서의 오래된 파일 참조 수정 ✅
- **Size**: Small (15분)
- **Impact**: Documentation accuracy
- **Files**: README.md, .agents/architecture.md, .spec files
- **Issue**: `parser.ts` → `parsers/bloodinfo.ts` 경로 변경이 문서에 반영 안됨
- **Status**: Completed (2025-11-01)
- **Result**: 4 files updated, build & tests passed

### TASK-002: fetchWithTimeout 유틸리티 추출 ✅
- **Size**: Small (20분)
- **Impact**: Code duplication removal
- **Files**: src/telegram.ts, src/parsers/ktcu.ts
- **Issue**: 동일한 함수가 두 파일에 중복 정의됨
- **Status**: Completed (2025-11-01)
- **Result**: Created src/utils/fetch.ts, removed duplicates, tests passed

### TASK-003: eventId 필드명 통일 ✅
- **Size**: Small (30분)
- **Impact**: Naming consistency
- **Files**: src/kv.ts, src/parsers/bloodinfo.ts, tests
- **Issue**: `promtnSn` vs `eventId` 혼재 사용
- **Status**: Completed (2025-11-01)
- **Result**: 30+ references updated, all tests passed, documentation updated

## Priority: Medium

### TASK-004: 테스트 타입 안전성 개선
- **Size**: Small (15분)
- **Impact**: Code quality, ESLint compliance
- **Files**: tests/kv.test.ts
- **Issue**: 6개의 `any` 타입 사용으로 ESLint 경고 발생
- **Status**: Pending

### TASK-005: HTML sanitization 유틸리티 생성
- **Size**: Small (25분)
- **Impact**: Code reusability
- **Files**: src/telegram.ts, src/parsers/ktcu.ts
- **Issue**: XSS 필터링 로직이 분산되어 있음
- **Status**: Pending

### TASK-006: 설정 중앙화
- **Size**: Medium (45분)
- **Impact**: Configuration management
- **Files**: Create src/config.ts, update all config consumers
- **Issue**: 설정이 여러 파일에 분산되어 관리 어려움
- **Status**: Pending

## Priority: Low

### TASK-007: 파서 등록 자동화 개선
- **Size**: Small (20분)
- **Impact**: Maintainability
- **Files**: src/index.ts, src/parsers/index.ts
- **Issue**: 파서 추가 시 index.ts 수정 필요
- **Status**: Pending

### TASK-008: Utils 디렉토리 구조 정리
- **Size**: Small (15분)
- **Impact**: Module organization
- **Files**: src/utils/
- **Issue**: 유틸리티 함수들이 분산되어 있음
- **Status**: Pending

## Future Considerations

### Split Parser Files by Concern (Optional)
- **Size**: Large (4-6시간)
- **Impact**: Separation of concerns
- **Note**: 현재 구조로도 충분히 관리 가능. 추후 파서가 더 복잡해질 경우 고려

### Add Integration Tests
- **Size**: Medium (2-3시간)
- **Impact**: Test coverage
- **Note**: 현재 unit test 커버리지 양호. 필요성 발생 시 추가

## Metrics
- Total Tasks: 8
- High Priority: 3
- Medium Priority: 3
- Low Priority: 2
- Estimated Total Time: ~3-4 hours
