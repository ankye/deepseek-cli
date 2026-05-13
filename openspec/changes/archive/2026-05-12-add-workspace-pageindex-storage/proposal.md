## Why

`/palette recall --scope workspace` currently reports a typed deferred result even though users already need recall that survives across chat sessions in the same repository. Implementing a bounded workspace PageIndex evidence catalog gives the CLI useful cross-session memory without introducing semantic vectors before the evidence layer is stable.

`/palette recall --scope workspace` 当前只返回 typed deferred，但用户已经需要同一仓库内跨 chat sessions 的回溯能力。实现有界 workspace PageIndex evidence catalog，可以在不提前引入 semantic vectors 的情况下，让 CLI 获得实用的跨 session 记忆。

## What Changes

- Add a small workspace PageIndex store module owned by the CLI host adapter.
- Persist completed chat PageIndex pages to workspace metadata after successful prompt turns.
- Load workspace PageIndex pages when resolving `/palette recall --scope workspace <query>`.
- Keep workspace recall bounded, provenance-rich, redacted, and deterministic-text ranked.
- Keep `/palette recall --scope global <query>` deferred until global storage is explicitly designed.
- Add regression tests for cross-session workspace recall, bounded persistence, and workspace storage failure behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Workspace-scoped PageIndex recall becomes available through workspace metadata storage while global recall remains deferred.
- `testing-regression`: Regression coverage is extended for workspace PageIndex persistence and recall across chat sessions.

## Impact

- `src/apps/cli/src/commands/pageindex-workspace.ts` new focused module for workspace PageIndex persistence.
- `src/apps/cli/src/commands/pageindex.ts` gains workspace page normalization/search support.
- `src/apps/cli/src/commands/chat.ts` routes workspace recall through the store.
- `src/apps/cli/test/cli.test.ts` gains deterministic workspace recall tests.
- OpenSpec specs for `minimal-chat-cli` and `testing-regression`.
