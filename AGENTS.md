# Multi-Site Event Parser - Cloudflare Workers - AGENTS

Last Updated: 2026-01-31
Framework: TDD (Test-Driven Development)

## Project Overview

- **Context:** Migration from ESLint/Prettier to Biome for
  linting/formatting is complete.
- **Goal:** Use Biome as the single linter/formatter.
- **Outcome:** `biome.json` configured, scripts updated, and linting fixes
  applied.

## Operating Principles

- TDD first: RED -> GREEN -> REFACTOR.
- Keep changes minimal and focused.
- Maintain quality gates on every change.

## Architecture & Data Flow

- **Runtime**: Cloudflare Workers with a scheduled cron (daily, KST 00:00)
  that triggers the event collection pipeline.
- **Parsers**: Site-specific parsers (KTCU, SJAC, Life SJE) implement a
  `SiteParser` interface with `fetchAndParse()` returning `SiteEvent[]`.
  Parsers use `fetchWithTimeout()` and `cheerio` to extract event fields.
- **Aggregation**: `handleScheduled()` runs parsers via
  `Promise.allSettled()`, merges events, and collects per-parser errors.
  If all parsers fail (no events + errors), it sends a summarized Telegram
  error notification.
- **State**: Cloudflare KV is the dedupe store with keys
  `sent:${siteId}:${eventId}` and ~60 day TTL. `filterNewEvents()` reads KV in
  parallel (concurrency limit 5, order preserved). `markEventAsSent()` writes
  are batched with `Promise.allSettled()` and per-event logging.
- **Notifications**: Telegram Bot API is used for batch event notifications.
  Messages are HTML-escaped (XSS-safe) and truncated if >4096 chars; truncated
  messages are sent as plain text to avoid HTML parse errors.
- **Legacy detail**: Prior specs in `.spec/`, `.tasks/`, and `.governance/` were
  condensed here; full historical docs remain in git history before commit
  `995286f9`.

## 2026-01-31

### Decision/Learning

life.sje.go.kr uses `POST /api/homepageprogramlist` with `manage_code=150018`,
`program_major_category=3` for 공연/전시, and `program_status=1and2` for 신청중.
Response items expose `PROGRAM_STATUS` as `'1'` or `'2'` when open.

### Reason

These parameters are required to fetch only 공연/전시 접수중 programs reliably.

### Impact

Use the API response for parsing and filter on `PROGRAM_STATUS` in the parser.

## Tasks

Active/Backlog: None

## Ownership & Review

- Maintainer: see OWNERS or repository settings
