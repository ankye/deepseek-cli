## Why

PageIndex recall now flows from session/workspace storage into runtime projection, but the recalled evidence still lacks explicit quality signals such as when it was recorded and why it matched. Adding bounded evidence quality metadata helps the CLI reduce unsupported memory and makes old or weak recall candidates visible before they influence the model.

PageIndex 回溯现在已能从 session/workspace storage 进入 runtime projection，但回溯证据仍缺少明确质量信号，例如记录时间与命中原因。增加有界 evidence quality metadata 可以减少无来源记忆，并让旧的或弱命中的 recall candidate 在影响模型前可见。

## What Changes

- Add deterministic `createdAt` metadata to PageIndex pages, snapshots, workspace records, recall result targets, and projected summaries.
- Add recall match-quality metadata, including matched fields and deterministic ranking reason, to recall result targets.
- Include freshness and match-quality lines in runtime-owned PageIndex summary projection.
- Add regression tests proving recall output and model-projected context expose evidence quality without leaking full hidden transcript content.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: PageIndex recall result metadata must include bounded evidence quality fields.
- `context-graph-projection`: PageIndex summary projection must preserve evidence quality in model-visible context and provenance.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, `src/packages/runtime/src/context-projection.ts`, `src/apps/cli/test/cli.test.ts`.
- Affected specs: `minimal-chat-cli`, `context-graph-projection`.
- No external dependencies, no semantic/vector ranking implementation, and no full transcript hydration.
