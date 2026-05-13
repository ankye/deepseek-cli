## 1. Contracts And Summary Model

- [x] 1.1 Add an additive JSON-serializable release verification summary DTO.
- [x] 1.2 Keep platform contracts implementation-free and host-agnostic.

## 2. CLI Diagnostics Verify Command

- [x] 2.1 Add `verify` to diagnostics command parsing, help, and command contracts.
- [x] 2.2 Derive verify summary from `collectReleaseReadinessEvidence`.
- [x] 2.3 Render verify output in text, JSON, and JSONL with release evidence parity.
- [x] 2.4 Ensure verify is read-only and does not execute publish, network, model, provider, or full test commands.

## 3. Documentation

- [x] 3.1 Update CLI README and publishing docs with the pre-publish verify command.
- [x] 3.2 Update acceptance evidence index generation if the new gate should be recorded.

## 4. Tests And Validation

- [x] 4.1 Add focused CLI tests for verify ready/blocked/warn output and JSONL records.
- [x] 4.2 Add or update contract/e2e tests for command parsing and release evidence parity.
- [x] 4.3 Run `openspec validate add-cli-release-verify-command --strict`.
- [x] 4.4 Run focused tests, `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
