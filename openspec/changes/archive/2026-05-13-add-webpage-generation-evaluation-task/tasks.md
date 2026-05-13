## 1. Catalog And Checker

- [x] 1.1 Add a full-mode webpage-generation task to `tests/evaluation/task-catalog.json`.
- [x] 1.2 Add a local webpage artifact checker script with deterministic pass/fail output.

## 2. Tests And Docs

- [x] 2.1 Add tests proving full evaluation includes the webpage task and smoke mode excludes it.
- [x] 2.2 Add tests for webpage checker pass/fail behavior.
- [x] 2.3 Update docs with the webpage-generation evaluation check.

## 3. Validation

- [x] 3.1 Run `openspec validate add-webpage-generation-evaluation-task --strict`.
- [x] 3.2 Run focused tests, `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
