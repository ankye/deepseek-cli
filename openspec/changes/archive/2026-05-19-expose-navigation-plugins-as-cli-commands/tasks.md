## 1. OpenSpec

- [x] 1.1 Validate proposal, design, and delta specs.

## 2. CLI Command Surface

- [x] 2.1 Extend CLI option types with file and jump actions/inputs.
- [x] 2.2 Extend CLI parser and help output for `deepseek file ...` and `deepseek jump ...`.
- [x] 2.3 Add file manager CLI runner that reuses the host adapter and renderers.
- [x] 2.4 Add jump navigator CLI runner that reuses the host adapter and renderers.
- [x] 2.5 Wire both runners into the top-level CLI entry dispatch.

## 3. Tests

- [x] 3.1 Add parser/help contract coverage for file and jump commands.
- [x] 3.2 Add CLI runner coverage for file text/JSON/JSONL output.
- [x] 3.3 Add CLI runner coverage for jump text/JSON/JSONL output and deferred symbol diagnostics.
- [x] 3.4 Ensure missing-query commands return typed local diagnostics rather than model execution.

## 4. Verification

- [x] 4.1 Run OpenSpec strict validation, typecheck, focused tests, lint, boundary checks, and regression tests as appropriate.
