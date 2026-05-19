## 1. Owner Route Registry

- [x] 1.1 Add CLI built-in plugin owner route descriptor types and deterministic route registry.
- [x] 1.2 Map every context, checks, repo, and git built-in plugin commandId to implemented or deferred routes.
- [x] 1.3 Add route readiness projection for plugin command and TUI contribution metadata.

## 2. Dispatch

- [x] 2.1 Dispatch implemented repo, git, checks, and context command IDs through existing owner adapters.
- [x] 2.2 Preserve deferred behavior for repo recall and project-index with explicit diagnostics.
- [x] 2.3 Ensure dispatch never reads plugin-private handler/callback/execute metadata.

## 3. Diagnostics And Tests

- [x] 3.1 Add contract tests that every built-in plugin command contribution has route readiness.
- [x] 3.2 Add dispatch tests for repo, git, checks, and context implemented routes.
- [x] 3.3 Add TUI/extension projection tests for implemented and deferred route readiness.
- [x] 3.4 Run OpenSpec strict validation, typecheck, lint, boundary checks, focused tests, and full regression tests.
