## 1. Staleness Policy

- [x] 1.1 Add a pure PageIndex stale adjustment helper that accepts pages, chat turn order, and workspace checkpoint-like mutation evidence.
- [x] 1.2 Preserve existing `fresh`, `stale`, and `unknown` normalization semantics while downgrading only proven earlier `fresh` pages.

## 2. CLI Integration

- [x] 2.1 Apply the stale adjustment before session and workspace PageIndex recall in chat.
- [x] 2.2 Ensure recall explain and reference projection inherit the adjusted freshness metadata.

## 3. Tests

- [x] 3.1 Add pure PageIndex regression tests for later same-session edits, unknown freshness, and cross-session/no-order preservation.
- [x] 3.2 Add a chat integration test where a later core file write makes an earlier recall result stale.

## 4. Validation

- [x] 4.1 Run focused CLI tests and OpenSpec change validation.
- [x] 4.2 Run typecheck, lint, boundary checks, and broader test validation as needed.
