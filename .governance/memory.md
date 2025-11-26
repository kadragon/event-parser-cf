# Memory

## 2025-11-26 Biome Migration

- **Context:** User requested migration from ESLint to Biome for linting/formatting.
- **Goal:** Replace ESLint/Prettier with Biome.
- **Outcome:** Replaced ESLint with Biome, configured `biome.json`, fixed linting
  issues, and updated scripts.

## 2025-11-26 CI Setup

- **Context:** User requested GitHub Actions CI for Lint, Test, and Build checking.
- **Action:** Created `.github/workflows/ci.yml`.
- **Pipeline:**
  1. Lint (Biome)
  2. Type Check (`tsc`)
  3. Test (Vitest)
  4. Build (`wrangler build`)
