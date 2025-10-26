# Development Guide

## Pre-commit Hook

이 프로젝트는 자동으로 TypeScript 타입 체크를 수행하는 pre-commit hook을 포함하고 있습니다.

### 설정 확인

Pre-commit hook이 이미 설정되어 있습니다:

```bash
.git/hooks/pre-commit
```

### 동작 방식

커밋을 시도할 때마다 다음이 자동으로 실행됩니다:

1. **TypeScript 타입 체크** (`npx tsc --noEmit`)
   - 모든 staged TypeScript 파일의 타입 에러 확인
   - 에러가 있으면 커밋 차단

2. **ESLint** (선택사항)
   - `.eslintrc` 파일이 있으면 자동 실행
   - 현재는 설정되지 않음

### 예시

**✅ 성공 케이스**
```bash
$ git commit -m "feat: add new feature"

🔍 Running pre-commit checks...
📝 Staged TypeScript files:
  src/new-feature.ts

⚙️  Running TypeScript type checking...
✓ TypeScript type checking passed

✅ All pre-commit checks passed!
[main abc1234] feat: add new feature
```

**❌ 실패 케이스**
```bash
$ git commit -m "feat: add buggy feature"

🔍 Running pre-commit checks...
📝 Staged TypeScript files:
  src/buggy-feature.ts

⚙️  Running TypeScript type checking...
src/buggy-feature.ts(5,10): error TS2322: Type 'number' is not assignable to type 'string'.
❌ TypeScript type checking failed
Please fix the type errors and try again.
```

타입 에러를 수정하고 다시 커밋하면 됩니다.

### Hook 비활성화 (권장하지 않음)

특수한 경우 hook을 무시하고 강제로 커밋할 수 있습니다:

```bash
git commit --no-verify -m "commit message"
```

하지만 이는 코드 품질을 해칠 수 있으므로 권장하지 않습니다.

### Hook 재설치

hook 파일이 손상되었을 경우:

```bash
chmod +x .git/hooks/pre-commit
```

## Local Development

### 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit
```

### 새 파서 추가

1. `src/parsers/새사이트.ts` 생성
2. `SiteParser` 인터페이스 구현
3. `src/index.ts`의 `siteParserRegistry`에 등록

자세한 내용은 [ARCHITECTURE.md](ARCHITECTURE.md) 참조

## 커밋 컨벤션

```
<type>: <subject>

<body>

Trace: <SPEC-ID>, <TEST-ID>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가
- `docs`: 문서 수정
- `chore`: 빌드, 의존성 등

### Subject
- 영문 또는 한글 가능
- 현재형 사용 (added ❌ → add ✅)
- 50자 이내

### Body
- 상세한 변경 사항 (선택사항)
- 72자 이내로 줄바꿈

## Testing

### 타입 체크
```bash
npx tsc --noEmit
```

### 로컬 워커 테스트
```bash
npm run dev
```

방문: http://localhost:8787

## 배포

### Staging
```bash
# 현재 상태 확인
wrangler deploy --dry-run
```

### Production
```bash
# 실제 배포
wrangler deploy
```

## 문제 해결

### Pre-commit hook이 실행되지 않음
```bash
chmod +x .git/hooks/pre-commit
```

### Hook이 느림
- 큰 파일이나 많은 의존성이 있을 때 시간이 걸릴 수 있습니다.
- 필요시 `--no-verify` 옵션으로 건너뛸 수 있습니다.

### TypeScript 에러가 계속 나옴
```bash
# TypeScript 캐시 초기화
rm -rf dist/
npx tsc --noEmit
```
