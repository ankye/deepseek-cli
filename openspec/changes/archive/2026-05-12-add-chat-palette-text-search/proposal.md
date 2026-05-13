## Why

After file discovery, the next CLI-first usability gap is finding relevant lines across files and moving through them like a quickfix list. Users should be able to search text locally, navigate matches, and promote the focused match into active context without exposing slash commands to the model.

文件发现之后，下一个 CLI-first 可用性缺口是跨文件查找相关行，并像 quickfix list 一样移动。用户应能在本地搜索文本、导航命中项，并把当前命中提升为活动上下文，同时不把 slash commands 暴露给 model。

## What Changes

- Add a chat-local `/palette grep <text>` control that calls the injected platform text search provider and creates a navigable result list.
- Represent text matches as result-list items with file targets plus line/search metadata, so existing navigation, jump history, and `/palette refs add current` can compose with them.
- Keep `/palette grep` local: it renders bounded metadata and match previews, does not submit model/runtime requests, and does not materialize full file content before a prompt turn.
- Preserve the existing prompt-time projection path by adding the focused match as a file reference with line metadata; fragment-level projection is deferred.
- Add deterministic CLI regression coverage for text search result lists, navigation, reference creation, no-model behavior, and prompt boundary preservation.

- 增加 chat 本地 `/palette grep <text>` 控制，调用注入的 platform text search provider 并创建可导航 result list。
- 将文本命中表示为带 file target 与 line/search metadata 的 result-list items，使现有 navigation、jump history 和 `/palette refs add current` 可以组合使用。
- 保持 `/palette grep` 本地化：只渲染有界 metadata 与 match previews，不提交 model/runtime request，也不在 prompt turn 前 materialize 完整文件内容。
- 通过将当前命中作为带 line metadata 的 file reference 加入引用集，保留现有 prompt-time projection path；片段级 projection 延后。
- 增加确定性的 CLI regression coverage，覆盖 text search result lists、navigation、reference creation、no-model behavior 和 prompt 边界。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Adds the chat-local text search control and no-model/no-runtime slash behavior.
- `vi-inspired-cli-composition`: Defines text search matches as quickfix-style result-list items that can become file references with line metadata.
- `testing-regression`: Requires deterministic tests for text search result-list navigation and prompt-time projection boundaries.

## Impact

- Affected CLI host command state and routing under `src/apps/cli/src/commands/*`.
- Reuses `PlatformRuntime.searchText`, existing result-list action resolution, and existing file-reference projection.
- Adds or updates CLI host tests in `src/apps/cli/test/cli.test.ts`.
- No breaking change to runtime contracts, provider calls, run mode, or JSONL event semantics is intended.

- 影响 `src/apps/cli/src/commands/*` 下的 CLI host command state 与 routing。
- 复用 `PlatformRuntime.searchText`、现有 result-list action resolution 与现有 file-reference projection。
- 在 `src/apps/cli/test/cli.test.ts` 增加或更新 CLI host tests。
- 不计划破坏 runtime contracts、provider calls、run mode 或 JSONL event semantics。
