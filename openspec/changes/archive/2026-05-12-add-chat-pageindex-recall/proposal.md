## Why

Long CLI sessions must not depend on the model remembering prior turns. A deterministic PageIndex gives the CLI a local, replayable memory of prompts, turns, and summaries that users can search and navigate even when model context has moved on.

长 CLI session 不能依赖 model 自己记住之前的 turns。确定性的 PageIndex 为 CLI 提供本地、可回放的 prompts、turns 与 summaries 记忆，即使 model context 已经推进，用户也能搜索和导航。

## What Changes

- Add a chat-local PageIndex that records completed prompt turns as structured pages with page id, session id, turn id, prompt preview, assistant summary preview, status, trace id, ordering, and redaction metadata.
- Add `/palette recall <query>` to search PageIndex pages deterministically and create a navigable result list.
- Add local rendering for recall summary and page items without submitting model/runtime requests.
- Keep ZVec/semantic recall out of this first slice, but reserve metadata fields so a future vector layer can attach semantic scores to PageIndex pages.
- Add deterministic regression coverage for page creation, recall result lists, navigation, no-model behavior, and raw-content boundary preservation.

- 增加 chat 本地 PageIndex，将已完成 prompt turns 记录为 structured pages，包含 page id、session id、turn id、prompt preview、assistant summary preview、status、trace id、ordering 和 redaction metadata。
- 增加 `/palette recall <query>`，确定性搜索 PageIndex pages 并创建可导航 result list。
- 增加 recall summary 与 page items 的本地渲染，不提交 model/runtime requests。
- 第一片不实现 ZVec/semantic recall，但预留 metadata 字段，使未来 vector layer 能把 semantic scores 关联到 PageIndex pages。
- 增加确定性的 regression coverage，覆盖 page creation、recall result lists、navigation、no-model behavior 和 raw-content boundary preservation。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Adds chat-local PageIndex recording and `/palette recall <query>` controls.
- `vi-inspired-cli-composition`: Defines PageIndex recall pages as navigable result-list items with turn/page targets.
- `testing-regression`: Requires deterministic tests for local recall result lists and no-model slash behavior.
- `context-graph-projection`: Records PageIndex as the deterministic source of recall truth and reserves semantic/ZVec recall as a later layer over PageIndex, not as truth source.

## Impact

- Affected CLI host chat state and palette-state helpers under `src/apps/cli/src/commands/*`.
- Reuses existing result-list navigation, jump history, and local rendering contracts.
- Does not change runtime context projection in this slice; page references are recall/navigation targets only until a later projection change.
- Adds CLI host tests in `src/apps/cli/test/cli.test.ts`.

- 影响 `src/apps/cli/src/commands/*` 下的 CLI host chat state 与 palette-state helpers。
- 复用现有 result-list navigation、jump history 和 local rendering contracts。
- 本片不修改 runtime context projection；page references 在后续 projection 变更前只作为 recall/navigation targets。
- 在 `src/apps/cli/test/cli.test.ts` 增加 CLI host tests。
