# Memory

## 2025-11-26 Biome Migration

- **Context:** User requested migration from ESLint to Biome for linting/formatting.
- **Goal:** Replace ESLint/Prettier with Biome.
- **Current State:** Project uses Biome.
- **Outcome:**
  - Replaced ESLint with Biome.
  - Configured `biome.json` to match previous rules.
  - Fixed linting issues (template literals, unused vars).
  - Scripts `lint` and `lint:fix` updated to use `biome check`.
