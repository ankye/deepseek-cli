## Why

Revert preview is now available, but users still need to know and type request or turn ids. Chat should expose a local turn history and a `current` target so recovery workflows can start from the selected conversation turn.

Revert preview 现在已经可用，但用户仍需要知道并手输 request 或 turn id。Chat 应该暴露本地 turn history 和 `current` target，让恢复工作流可以从选中的对话 turn 开始。

## What Changes

- Track completed chat prompt turns as a local, ordered history result list. / 将已完成的 chat prompt turns 记录为本地有序 history result list。
- Add `/history` and `/history select <turn-id|index|current|last>` local chat controls. / 增加 `/history` 和 `/history select <turn-id|index|current|last>` 本地 chat controls。
- Add `/revert preview current` to resolve the selected history turn into a dry-run revert preview target. / 增加 `/revert preview current`，将选中的 history turn 解析成 dry-run revert preview target。
- Keep history/revert controls local and never submit them to the model. / 保持 history/revert controls 本地化，绝不提交给 model。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `minimal-chat-cli`: add local history controls and current-turn revert preview. / 增加本地 history controls 与 current-turn revert preview。
- `vi-inspired-cli-composition`: expose session-history targets as selectable typed targets for revert preview. / 将 session-history targets 暴露为可选择 typed targets，用于 revert preview。
- `checkpoint-undo`: allow chat revert preview to resolve `current` to an explicit turn target before dry-run. / 允许 chat revert preview 在 dry-run 前将 `current` 解析为显式 turn target。
- `testing-regression`: cover chat history records, selection, current revert preview, empty history failure, and no model submission. / 覆盖 chat history records、selection、current revert preview、empty history failure 和不提交 model。

## Impact

- Affects `src/apps/cli/src/commands/chat.ts` and tests. / 影响 chat command 与 tests。
- Reuses existing `previewRevert` dry-run implementation. / 复用现有 `previewRevert` dry-run 实现。
- Does not persist history across process restarts or implement full transcript browsing. / 不跨进程持久化 history，也不实现完整 transcript browsing。
