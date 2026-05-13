## 1. Contracts And Evidence Model

- [x] 1.1 Add additive release evidence DTO fields for build artifact status, acceptance evidence file status, and package surface file scope.
- [x] 1.2 Keep platform contracts implementation-free and JSON-serializable.

## 2. CLI Release Diagnostics

- [x] 2.1 Inspect local build output and declared acceptance evidence paths in `collectReleaseReadinessEvidence`.
- [x] 2.2 Derive package surface safety from CLI package metadata and fail on unexpected package paths.
- [x] 2.3 Make release readiness status derive from concrete evidence gates.
- [x] 2.4 Render the new evidence in text, JSON, and JSONL without terminal controls or raw secrets.

## 3. Documentation

- [x] 3.1 Update CLI and publishing docs to describe release evidence gates and how to fix failed checks.
- [x] 3.2 Update acceptance index coverage if release evidence gate names change.

## 4. Tests And Validation

- [x] 4.1 Add focused CLI/contract tests for missing evidence warning, build artifact failure, package surface checks, and output parity.
- [x] 4.2 Run `openspec validate harden-cli-release-evidence-gates --strict`.
- [x] 4.3 Run focused tests for CLI diagnostics and local readiness.
- [x] 4.4 Run `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
