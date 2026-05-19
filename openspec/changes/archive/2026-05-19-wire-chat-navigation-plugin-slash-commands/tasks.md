## 1. OpenSpec

- [x] 1.1 Validate proposal, design, and delta specs.

## 2. Chat Slash Execution

- [x] 2.1 Add `/file` slash parsing and local execution through the file-manager adapter.
- [x] 2.2 Add `/jump` slash parsing and local execution through the jump-navigator adapter.
- [x] 2.3 Preserve text, JSON, and JSONL renderer parity with chat command envelopes.

## 3. TUI Projection

- [x] 3.1 Add a shared palette-state helper that attaches plugin result lists as active result lists.
- [x] 3.2 Update TUI local command mode selection so file/jump results enter result-list mode.

## 4. Tests

- [x] 4.1 Add chat tests for `/file` local execution, JSONL records, active result projection, and no model dispatch.
- [x] 4.2 Add chat tests for `/jump` local execution, deferred symbol diagnostics, active result projection, and no model dispatch.

## 5. Verification

- [x] 5.1 Run OpenSpec strict validation, typecheck, focused tests, lint, boundary checks, and regression tests as appropriate.
