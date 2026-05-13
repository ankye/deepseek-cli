## Why

PageIndex recall can now say `fresh`, `stale`, or `unknown`, but newly recorded pages remain `fresh` even after later workspace edits in the same chat session. The CLI needs a conservative first stale signal so recalled context does not look current after the workspace has changed.

PageIndex recall 现在已经能表达 `fresh`、`stale` 与 `unknown`，但同一 chat session 中后续发生 workspace edits 后，较早记录的 pages 仍会保持 `fresh`。CLI 需要第一版保守 stale signal，避免工作区已变化后 recalled context 仍看起来像当前事实。

## What Changes

- Mark session-scoped PageIndex pages as `stale` during recall when same-session workspace checkpoint evidence exists from a later chat turn.
- Apply the same conservative downgrade to current-session workspace recall pages when local history can prove a later same-session edit.
- Preserve `fresh` and `unknown` when no reliable later-edit ordering exists.
- Keep this slice session/workspace-level and turn-order based; it does not add path-level invalidation, file snapshot comparison, embeddings, zvec, or semantic freshness scoring.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: PageIndex recall freshness SHALL downgrade earlier same-session evidence to `stale` after later workspace edits can be proven from workspace checkpoints.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, `src/apps/cli/src/commands/chat.ts`, CLI PageIndex tests.
- Affected specs: `minimal-chat-cli`.
- No new external dependency and no change to vector storage, PageIndex persistence format, or workspace checkpoint contracts.
