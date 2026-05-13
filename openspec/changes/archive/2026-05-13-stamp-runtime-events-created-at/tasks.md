## 1. Runtime Event Timestamp

- [x] 1.1 Add `createdAt` to the RuntimeEvent contract.
- [x] 1.2 Stamp runtime helper events and kernel-produced events with canonical timestamps.
- [x] 1.3 Persist session and bus event timestamps from `event.createdAt`.

## 2. PageIndex Integration

- [x] 2.1 Update PageIndex expectations to use runtime-sourced timestamps.
- [x] 2.2 Keep deterministic fallback behavior for legacy events.

## 3. Validation

- [x] 3.1 Run focused CLI/runtime tests, typecheck, lint, boundary checks, and OpenSpec validation.
- [x] 3.2 Sync specs and archive the change.
