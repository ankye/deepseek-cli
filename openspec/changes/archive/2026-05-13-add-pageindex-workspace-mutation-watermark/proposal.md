## Why

The current PageIndex stale policy can prove later edits only inside the active chat session. Workspace-scoped recall across sessions still preserves `fresh` because it lacks a durable workspace mutation watermark, which can make old recall evidence look safer than it is after later edits.

当前 PageIndex stale policy 只能在 active chat session 内证明后续 edits。跨 session 的 workspace-scoped recall 仍会保留 `fresh`，因为它缺少持久化的 workspace mutation watermark；后续编辑之后，旧 recall evidence 可能看起来比实际更可靠。

## What Changes

- Record a lightweight workspace checkpoint watermark in PageIndex evidence metadata when pages are snapshotted/persisted.
- Persist workspace PageIndex pages with the watermark so later sessions can compare against the current workspace mutation count.
- During workspace recall, downgrade `fresh` pages to `stale` when current workspace mutation watermark is greater than the page watermark.
- Keep the policy conservative: the watermark is workspace-level, not path-level, and does not claim semantic invalidation precision.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: Workspace PageIndex recall SHALL use durable workspace mutation watermarks to avoid preserving stale cross-session evidence as `fresh`.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, `src/apps/cli/src/commands/pageindex-workspace.ts`, `src/apps/cli/src/commands/chat.ts`, and CLI tests.
- Affected specs: `minimal-chat-cli`.
- No new dependency, vector database, embedding provider, or platform contract change.
