## 1. Freshness Policy

- [x] 1.1 Add bounded PageIndex freshness state handling for `fresh`, `stale`, and `unknown`.
- [x] 1.2 Mark runtime-sourced PageIndex pages as `fresh` while keeping deterministic fallback pages `unknown`.
- [x] 1.3 Preserve restored `stale` PageIndex status through recall metadata and projection.

## 2. Tests

- [x] 2.1 Update CLI PageIndex recall, explain, and projection assertions from `known` to `fresh`.
- [x] 2.2 Add a stale-preservation regression test.

## 3. Validation

- [x] 3.1 Run focused CLI tests, typecheck, lint, boundary checks, and OpenSpec validation.
- [x] 3.2 Sync specs and archive the change.
