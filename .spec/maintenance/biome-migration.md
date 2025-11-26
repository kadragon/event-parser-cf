spec_id: SPEC-biome-migration-1
title: "Migrate to Biome"
given_when_then:
  - given: "A TypeScript project using ESLint"
    when: "Migrating to Biome"
    then: "ESLint is removed, Biome is installed and configured, and linting/formatting works"
acceptance_tests:
  - id: TEST-biome-config
    desc: "biome.json exists and reflects previous ESLint rules"
  - id: TEST-lint-script
    desc: "'npm run lint' runs biome check"
  - id: TEST-clean-eslint
    desc: "ESLint dependencies and config files are removed"
dependencies:
  - governance: "standard"
linked_tasks:
  - TASK-007
