## 1. Chat File Result List

- [x] 1.1 Add a palette-state helper that converts platform file matches into a deterministic `CliResultList` with typed file targets and workspace-relative path metadata.
- [x] 1.2 Update chat palette slash routing to handle `/palette files <pattern>` locally through injected platform dependencies and render deterministic local records.
- [x] 1.3 Ensure `/palette refs add current` preserves a focused file result item as a `kind=file` reference item with path metadata.

## 2. Regression Coverage

- [x] 2.1 Add CLI host tests for `/palette files`, navigation, no-model behavior, and raw-content absence before prompt submission.
- [x] 2.2 Add CLI host tests proving a focused file result can be added with `/palette refs add current` and projected into the next model request without mutating the user prompt.

## 3. Validation

- [x] 3.1 Run focused CLI tests for the changed behavior.
- [x] 3.2 Run typecheck, lint, boundary checks, OpenSpec validation, and forbidden tracked reference path checks.
