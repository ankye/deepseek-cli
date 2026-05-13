## 1. PageIndex Watermark Policy

- [x] 1.1 Add helpers to stamp workspace checkpoint watermarks onto PageIndex pages.
- [x] 1.2 Add helpers to adjust workspace PageIndex freshness from current workspace checkpoint watermark.
- [x] 1.3 Preserve existing session-turn-order stale behavior without coupling PageIndex to workspace-state implementations.

## 2. CLI Workspace Integration

- [x] 2.1 Persist workspace PageIndex pages with current checkpoint watermarks.
- [x] 2.2 Apply current workspace watermark freshness adjustment before workspace recall.
- [x] 2.3 Keep legacy workspace pages without watermark compatible by rendering `unknown` when checkpoint evidence exists.

## 3. Tests

- [x] 3.1 Add pure PageIndex tests for watermark fresh, stale, and unknown behavior.
- [x] 3.2 Add a cross-session workspace recall test where a later workspace edit marks prior workspace recall stale.
- [x] 3.3 Add persistence assertions that workspace PageIndex records include the checkpoint watermark.

## 4. Validation

- [x] 4.1 Run focused CLI tests and OpenSpec change validation.
- [x] 4.2 Run typecheck, lint, boundary checks, and full tests as needed.
