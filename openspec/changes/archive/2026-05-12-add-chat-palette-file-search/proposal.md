## Why

The CLI-first route needs a vi/quickfix-like way to discover files, move focus across results, and promote the focused file into active context without forcing users to type explicit paths every time. This closes the current gap between `/palette refs add-file <path>` and multi-file workflows where users expect search, selection, jump navigation, and reference projection to compose.

CLI-first 路线需要一种类似 vi/quickfix 的文件发现方式，让用户能搜索文件、在结果中移动焦点，并把当前聚焦文件提升为活动上下文，而不必每次手输路径。这会补齐 `/palette refs add-file <path>` 与多文件工作流之间的缺口，使搜索、选择、跳转导航和引用投影能够组合起来。

## What Changes

- Add a chat-local `/palette files <pattern>` control that searches workspace files through the injected platform abstraction and creates a navigable result list.
- Make file result-list items first-class typed file targets so `/palette next|previous|first|last`, jump history, and `/palette refs add current` operate on them consistently.
- Ensure `/palette files` and related navigation/reference slash commands remain local and do not submit runtime/model requests or read file content before the next prompt turn.
- Preserve the existing runtime-owned context projection path: selected files are materialized only when a normal prompt turn carries active reference metadata.
- Add deterministic CLI regression coverage for file search, navigation, add-current references, prompt projection, and raw-content boundary behavior.

- 增加 chat 本地 `/palette files <pattern>` 控制，通过注入的 platform abstraction 搜索 workspace files，并创建可导航 result list。
- 将文件 result-list item 建模为一等 typed file target，使 `/palette next|previous|first|last`、jump history 和 `/palette refs add current` 能一致作用于它们。
- 确保 `/palette files` 以及相关导航/引用 slash commands 都保持本地化，不提交 runtime/model request，也不在下一条 prompt turn 前读取文件内容。
- 保留现有 runtime-owned context projection 路径：只有普通 prompt turn 携带 active reference metadata 后，才 materialize 选中文件。
- 增加确定性的 CLI regression coverage，覆盖文件搜索、导航、add-current 引用、prompt projection 和 raw-content 边界。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Adds the chat-local file search control and its no-model/no-runtime behavior.
- `vi-inspired-cli-composition`: Defines file search results as quickfix-style result-list items that can become file reference items.
- `testing-regression`: Requires deterministic tests for file result-list selection and prompt-time projection boundaries.

## Impact

- Affected CLI host code under `src/apps/cli/src/commands/*` and chat command routing.
- Reuses existing platform abstraction `findFiles` and runtime reference projection contracts; no new external dependency is expected.
- Adds or updates CLI host tests in `src/apps/cli/test/cli.test.ts`.
- No breaking change to run mode, JSONL output, runtime APIs, or provider behavior is intended.

- 影响 `src/apps/cli/src/commands/*` 与 chat command routing。
- 复用现有 platform abstraction `findFiles` 与 runtime reference projection contracts；预计不引入新的外部依赖。
- 在 `src/apps/cli/test/cli.test.ts` 增加或更新 CLI host tests。
- 不计划破坏 run mode、JSONL output、runtime APIs 或 provider behavior。
