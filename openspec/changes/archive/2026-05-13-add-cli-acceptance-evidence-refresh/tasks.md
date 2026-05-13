## 1. Contracts And Command Parsing

- [x] 1.1 Add additive DTOs for acceptance evidence refresh plans, steps, and summaries.
- [x] 1.2 Add `refresh` to diagnostics command parsing, help, and input flags.

## 2. Refresh Implementation

- [x] 2.1 Implement allowlisted default and full refresh plans.
- [x] 2.2 Execute plan steps through platform process execution with `shell: false`.
- [x] 2.3 Write per-step output evidence to `tests/acceptance/latest/*.txt`.
- [x] 2.4 Render text, JSON, and JSONL refresh summaries without raw secrets or terminal controls.
- [x] 2.5 Reject extra positional command input without executing anything.

## 3. Documentation And Evidence Index

- [x] 3.1 Update CLI README and publishing/acceptance docs with `diagnostics refresh`.
- [x] 3.2 Update acceptance index generation to mention refresh before verify.

## 4. Tests And Validation

- [x] 4.1 Add focused CLI tests for dry-run/default/full/invalid refresh behavior.
- [x] 4.2 Add e2e or contract tests proving output files and summary parity.
- [x] 4.3 Run `openspec validate add-cli-acceptance-evidence-refresh --strict`.
- [x] 4.4 Run focused tests, `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
