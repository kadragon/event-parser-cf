task_id: TASK-008
spec_id: SPEC-ci-workflow-1
status: completed
title: "Setup GitHub Actions CI"
context: "Create a CI pipeline to enforce quality standards (Lint, Test, Build) on every push."
subtasks:
  - id: create-workflow
    title: "Create .github/workflows/ci.yml"
    status: completed
  - id: verify-scripts
    title: "Verify package.json scripts usage"
    status: completed
