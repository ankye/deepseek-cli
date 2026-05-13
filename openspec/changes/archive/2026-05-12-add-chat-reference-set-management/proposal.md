## Why

The CLI can now add file and search-result references, but long chat sessions need equally fast controls to remove, clear, and replace references. Without reference-set management, context accumulates silently and users lose the vi-like ability to keep the active working set precise.

CLI 现在已经能添加文件与搜索结果引用，但长 chat session 同样需要快速 remove、clear、replace 控制。缺少 reference-set management 时，上下文会静默累积，用户也会失去 vi-like 的精确 active working set 控制能力。

## What Changes

- Add chat-local `/palette refs remove <selector|current>` to remove a selected reference item without touching runtime or model state.
- Add chat-local `/palette refs clear` to clear the active reference set locally.
- Add chat-local `/palette refs replace current` to replace the active reference set with the currently focused result-list item.
- Preserve structured reference metadata, focus semantics, and prompt boundaries: reference mutations remain local until the next non-slash prompt.
- Add deterministic CLI regression coverage for remove, clear, replace, failure cases, no-model behavior, and prompt-time projection after replacement.

- 增加 chat 本地 `/palette refs remove <selector|current>`，移除选中的 reference item，且不触及 runtime 或 model state。
- 增加 chat 本地 `/palette refs clear`，本地清空 active reference set。
- 增加 chat 本地 `/palette refs replace current`，用当前聚焦 result-list item 替换 active reference set。
- 保持 structured reference metadata、focus semantics 与 prompt boundaries：reference mutations 在下一条非 slash prompt 前保持本地化。
- 增加确定性的 CLI regression coverage，覆盖 remove、clear、replace、failure cases、no-model behavior 和 replacement 后的 prompt-time projection。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Adds local chat controls for removing, clearing, and replacing active palette references.
- `vi-inspired-cli-composition`: Extends reference-set behavior with removal, clearing, and replace-current semantics over typed targets.
- `testing-regression`: Requires deterministic tests for reference-set mutation controls and prompt-boundary preservation.

## Impact

- Affected CLI host state helpers and chat slash routing under `src/apps/cli/src/commands/*`.
- Reuses existing `CliReferenceSet`, `CliReferenceItem`, result-list focus, and runtime reference projection contracts.
- Adds CLI host tests in `src/apps/cli/test/cli.test.ts`.
- No runtime contract, provider, or cross-app dependency change is intended.

- 影响 `src/apps/cli/src/commands/*` 下的 CLI host state helpers 与 chat slash routing。
- 复用现有 `CliReferenceSet`、`CliReferenceItem`、result-list focus 和 runtime reference projection contracts。
- 在 `src/apps/cli/test/cli.test.ts` 增加 CLI host tests。
- 不计划修改 runtime contract、provider 或 cross-app dependency。
