# Task 005: HTML Sanitization 유틸리티 생성

**Linked Spec**: Refactoring Backlog
**Created**: 2025-11-01
**Priority**: Medium
**Size**: Small (25분)
**Status**: Completed
**Completed**: 2025-11-01

## Goal
HTML sanitization 로직이 `src/telegram.ts`와 `src/parsers/ktcu.ts`에 분산되어 있습니다.
보안 관련 코드를 중앙화하고 재사용 가능한 유틸리티로 추출합니다.

## Context
**Current State**:
- `src/telegram.ts`: Uses `filterXSS` from `xss` library (lines 4, 72, 77-80, 190)
  - Complex security logic for nested tag injection prevention (lines 88-115)
- `src/parsers/ktcu.ts`: Uses `xss` library with custom options (lines 10, 64-68)
- Different sanitization strategies in different modules

**Security Background**:
- Code in telegram.ts addresses CodeQL security findings
- Implements defense against nested HTML tag injection
- Critical security code that should be centralized for consistency

## Implementation Plan

### 1. Create Security Utility Module
**File**: `src/utils/sanitize.ts`

```typescript
import { filterXSS } from 'xss';

/**
 * Strict XSS filter options - removes ALL HTML tags
 */
const STRICT_XSS_OPTIONS = {
  whiteList: {},
  stripIgnoreTag: true,
  allowCommentTag: false,
} as const;

/**
 * Sanitize HTML by removing all tags (strict mode)
 * @param html - HTML string to sanitize
 * @returns Sanitized string with all HTML removed
 */
export function sanitizeHtml(html: string): string {
  return filterXSS(html, STRICT_XSS_OPTIONS);
}

/**
 * Strip HTML tags for plain text output
 * Implements defense against nested tag injection attacks
 *
 * Security: Addresses CodeQL findings for XSS prevention
 * - Decodes HTML entities first (except &amp;)
 * - Iteratively removes tags to prevent nested tag attacks
 * - Decodes &amp; last to prevent double-unescaping
 *
 * @param html - HTML string to convert to plain text
 * @returns Plain text with all HTML tags removed safely
 */
export function stripHtmlForPlainText(html: string): string {
  // Step 1: Decode entities first (except &amp;)
  let plain = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  // Step 2: Remove ALL HTML tags iteratively
  // This prevents nested tag injection attacks like <script<script>>
  let previous;
  do {
    previous = plain;
    plain = plain.replace(/<[^>]+>/g, '');
  } while (plain !== previous);

  // Step 3: Decode &amp; LAST to prevent double-unescaping vulnerability
  return plain.replace(/&amp;/g, '&');
}

/**
 * Sanitize text that may contain user input
 * @param text - Text to sanitize
 * @returns Sanitized text safe for display
 */
export function sanitizeText(text: string): string {
  return filterXSS(text, {
    whiteList: {},
    stripIgnoreTag: true,
  });
}
```

### 2. Update Telegram Module
**File**: `src/telegram.ts`
- Remove local sanitization logic (lines 88-115)
- Import and use `stripHtmlForPlainText`
- Update XSS_FILTER_OPTIONS usage to use `sanitizeHtml`

### 3. Update KTCU Parser
**File**: `src/parsers/ktcu.ts`
- Remove local XSS_FILTER_OPTIONS (lines 10, 64-68)
- Import and use `sanitizeHtml` or `sanitizeText`

## Steps
1. Create `src/utils/sanitize.ts` with unified sanitization functions
2. Update `src/telegram.ts`:
   - Add import: `import { stripHtmlForPlainText, sanitizeText } from './utils/sanitize';`
   - Replace local stripHtmlForPlainText implementation (lines 88-115) with imported version
   - Update filterXSS calls to use new utility functions
3. Update `src/parsers/ktcu.ts`:
   - Add import: `import { sanitizeHtml } from '../utils/sanitize';`
   - Remove XSS_FILTER_OPTIONS constant
   - Replace xss() calls with sanitizeHtml()
4. Run tests to verify security behavior unchanged
5. Run build to verify no type errors

## DoD Checklist
- [x] `src/utils/sanitize.ts` created with comprehensive JSDoc
- [x] Security comments preserved explaining CodeQL findings
- [x] `src/telegram.ts` updated to use new utilities
- [x] `src/parsers/ktcu.ts` updated to use new utilities
- [x] All tests pass (`npm test`)
- [x] Build successful (`npm run build`)
- [x] No ESLint errors
- [x] Security behavior verified (no XSS vulnerabilities introduced)

## Test Strategy
- Existing tests should pass without modification
- Consider adding unit tests for sanitize.ts:
  ```typescript
  describe('sanitize utils', () => {
    it('should prevent nested tag injection', () => {
      const malicious = '<script<script>>alert("xss")</script>';
      expect(stripHtmlForPlainText(malicious)).not.toContain('<script');
    });
  });
  ```

## Security Considerations
- **Critical**: Do not change the security logic, only extract it
- Preserve all comments explaining CodeQL findings
- Test with known XSS attack vectors
- Ensure entity decoding order is preserved (security-critical)

## Rollback Plan
If any security tests fail or unexpected behavior occurs, immediately revert changes and reassess.

## Trace
- Addresses: Missing Abstraction Issue #4.2 from refactoring analysis
- Security-Critical: YES
- Related Files: src/telegram.ts, src/parsers/ktcu.ts
- CodeQL: Addresses previous security findings
