## 1. Reference Mutation State

- [x] 1.1 Add palette-state helpers for reference remove, clear, and replace-current with deterministic focus updates and typed local results.
- [x] 1.2 Update chat palette slash routing for `/palette refs remove`, `/palette refs clear`, and `/palette refs replace current`.
- [x] 1.3 Ensure clear produces no `referenceContext` on the next prompt unless new references are added.

## 2. Regression Coverage

- [x] 2.1 Add CLI host tests for remove, clear, reference counts, local/no-model behavior, and missing-target failures.
- [x] 2.2 Add CLI host tests for replace-current followed by prompt projection with exactly one active replacement reference and unchanged user prompt.

## 3. Validation

- [x] 3.1 Run focused CLI tests for the changed behavior.
- [x] 3.2 Run typecheck, lint, boundary checks, OpenSpec validation, and forbidden tracked reference path checks.
