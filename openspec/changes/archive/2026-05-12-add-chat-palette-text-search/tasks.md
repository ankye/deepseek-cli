## 1. Chat Text Search Result List

- [x] 1.1 Add a palette-state helper that converts platform text matches into a deterministic `CliResultList` with typed file targets, line metadata, bounded preview, and workspace-relative paths.
- [x] 1.2 Update chat palette slash routing to handle `/palette grep <text>` locally through injected platform dependencies and render deterministic local records.
- [x] 1.3 Ensure `/palette refs add current` preserves text-match line provenance while creating a `kind=file` reference item for runtime projection.

## 2. Regression Coverage

- [x] 2.1 Add CLI host tests for `/palette grep`, navigation, no-model behavior, bounded local records, and raw full-content absence before prompt submission.
- [x] 2.2 Add CLI host tests proving a focused text result can be added with `/palette refs add current` and projected into the next model request without mutating the user prompt.

## 3. Validation

- [x] 3.1 Run focused CLI tests for the changed behavior.
- [x] 3.2 Run typecheck, lint, boundary checks, OpenSpec validation, and forbidden tracked reference path checks.
