spec_id: SPEC-ci-workflow-1
title: "GitHub Actions CI Workflow"
given_when_then:
  - given: "A GitHub repository"
    when: "Code is pushed or a PR is opened"
    then: "CI workflow runs to verify code quality"
acceptance_tests:
  - id: TEST-ci-file-exists
    desc: ".github/workflows/ci.yml exists"
  - id: TEST-ci-steps
    desc: "Workflow includes Lint, Type Check, Test, and Build steps"
dependencies:
  - governance: "standard"
linked_tasks:
  - TASK-008
