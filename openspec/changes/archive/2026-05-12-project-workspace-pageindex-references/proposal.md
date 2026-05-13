## Why

Workspace PageIndex recall can now find prior chat evidence across sessions, but selected recall results must also survive the `/palette refs add current` path and enter the next model request with explicit scope provenance. Without this, long-running CLI sessions still risk treating recalled facts as unsupported memory rather than bounded evidence.

Workspace PageIndex 已能跨 session 找回历史 chat 证据，但选中的 recall 结果还必须经过 `/palette refs add current` 并带着明确 scope provenance 进入下一次模型请求。否则长会话仍可能把回溯内容当成无来源记忆，而不是有界证据。

## What Changes

- Preserve PageIndex-shaped `turn` result targets when chat adds focused recall results to the active reference set.
- Materialize workspace-scoped PageIndex recall references as bounded runtime-owned summary context before model dispatch.
- Include PageIndex recall `scope` in model-visible summary provenance, projection provenance, and replay fingerprints.
- Add CLI regression coverage for cross-session workspace recall reference projection.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: Workspace-scoped PageIndex recall references must be addable to active refs and projected on the next prompt without mutating prompt text.
- `context-graph-projection`: PageIndex `turn` reference projection must preserve explicit recall scope provenance.

## Impact

- Affected code: `src/apps/cli/src/commands/palette-state.ts`, `src/packages/runtime/src/context-projection.ts`, `src/apps/cli/test/cli.test.ts`.
- Affected specs: `minimal-chat-cli`, `context-graph-projection`.
- No new external dependencies, no global PageIndex storage, no ZVec/embedding provider integration in this slice.
