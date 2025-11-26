/**
 * HTML Sanitization Utilities
 *
 * GENERATED FROM Task-005: HTML Sanitization Utility Creation
 * SECURITY-CRITICAL: Centralized XSS prevention and HTML sanitization
 *
 * This module consolidates security-related sanitization logic from:
 * - src/telegram.ts: stripHtmlForPlainText (CodeQL security findings)
 * - src/parsers/ktcu.ts: normalizeText with xss filtering
 *
 * TRACE: Addresses CodeQL incomplete multi-character sanitization findings
 */

import { filterXSS } from 'xss';

/**
 * XSS filter options - escapes all HTML tags (converts < to &lt;)
 * Used for Telegram messages where we want to prevent XSS but preserve text
 */
const ESCAPE_XSS_OPTIONS = {
  whiteList: {}, // Empty whitelist: disallow all HTML tags (escape them)
  stripLeadingAndTrailingWhitespace: false,
} as const;

/**
 * Strict XSS filter options - removes ALL HTML tags
 * Used for plain text contexts where HTML should be completely removed
 */
const STRIP_XSS_OPTIONS = {
  whiteList: {}, // Empty whitelist: allow no HTML tags
  stripIgnoreTag: true, // Remove ignored tags instead of escaping
  allowCommentTag: false, // Remove HTML comments
} as const;

/**
 * Sanitize HTML by escaping all tags (converts < to &lt;, > to &gt;)
 *
 * Uses the xss library to escape HTML tags and attributes.
 * Suitable for preventing XSS while preserving text content.
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized string with HTML tags escaped
 */
export function sanitizeHtml(html: string): string {
  return filterXSS(html, ESCAPE_XSS_OPTIONS as Parameters<typeof filterXSS>[1]);
}

/**
 * Strip HTML tags for plain text output
 * Implements defense against nested tag injection attacks
 *
 * SECURITY-CRITICAL: Addresses CodeQL findings for XSS prevention
 * - Decodes HTML entities first (except &amp;)
 * - Iteratively removes tags to prevent nested tag attacks
 * - Decodes &amp; LAST to prevent double-unescaping vulnerability
 *
 * This function is specifically designed to handle fragmented/nested HTML
 * that could bypass single-pass sanitization (e.g., <script<script>>alert("xss")</script>)
 *
 * TRACE: Extracted from src/telegram.ts lines 72-86
 * CodeQL: Incomplete multi-character sanitization
 *
 * @param html - HTML string to convert to plain text
 * @returns Plain text with all HTML tags removed safely
 */
export function stripHtmlForPlainText(html: string): string {
  // Step 1: Decode entities first (except &amp;)
  // This makes tags recognizable for removal
  let plain = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  // Step 2: Remove ALL HTML tags iteratively
  // SECURITY: Repeat tag removal to handle nested/encoded tags
  // This prevents attacks like: <script<script>>alert("xss")</script>
  // where the inner <script> is revealed after first removal
  let previous: string;
  do {
    previous = plain;
    plain = plain.replace(/<[^>]+>/g, '');
  } while (plain !== previous);

  // Step 3: Decode &amp; LAST to prevent double-unescaping vulnerability
  // IMPORTANT: This MUST be last to prevent security issues
  // If done earlier, &amp;lt;script&amp;gt; could become <script>
  return plain.replace(/&amp;/g, '&');
}

/**
 * Normalize text by removing HTML tags and cleaning whitespace
 * Safely handles fragmented HTML tags to prevent XSS injection
 *
 * TRACE: Extracted from src/parsers/ktcu.ts normalizeText function
 * SPEC: SPEC-KTCU-PARSER-001 (Security fix for CodeQL incomplete sanitization)
 *
 * @param text - Text possibly containing HTML
 * @returns Normalized text safe from XSS with cleaned whitespace
 */
export function normalizeText(text: string): string {
  // Use xss library to sanitize and REMOVE all tags (not just escape)
  const sanitized = filterXSS(text, STRIP_XSS_OPTIONS);

  // Normalize multiple spaces to single space and trim
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize text that may contain user input for safe HTML display
 *
 * This is an alias for sanitizeHtml with explicit intent for text sanitization.
 *
 * @param text - Text to sanitize
 * @returns Sanitized text safe for display in HTML context
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text);
}
