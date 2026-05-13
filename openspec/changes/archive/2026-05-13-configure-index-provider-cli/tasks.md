## 1. OpenSpec And Contracts

- [x] 1.1 Validate the CLI index-provider command requirements.
- [x] 1.2 Keep provider intent behavior aligned with existing manifest contracts.

## 2. CLI Command Surface

- [x] 2.1 Extend CLI types, parser, usage, and entry routing for `index-provider status|set`.
- [x] 2.2 Implement a thin CLI command handler that reads/writes `indexProviders` through `PersistentConfigService`.

## 3. Rendering And Safety

- [x] 3.1 Render text, JSON, and JSONL output with requested/effective status and diagnostics.
- [x] 3.2 Reject unknown provider ids or unsupported statuses before config writes.

## 4. Tests And Validation

- [x] 4.1 Add CLI tests for status, set downgrade preview, and invalid provider rejection.
- [x] 4.2 Run focused tests, typecheck, lint, boundary checks, and OpenSpec validation.
