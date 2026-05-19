## Why

The command bar can now surface built-in and plugin suggestions, but selecting a suggestion still does not produce a usable command. This leaves the TUI feeling browse-only instead of action-oriented, and blocks navigation plugins from becoming first-class development shortcuts.

Command bar 现在已经能展示 built-in 与 plugin suggestions，但选中 suggestion 后仍不会生成可用命令。这会让 TUI 停留在“可浏览但不可行动”的状态，也阻碍 navigation plugins 成为一等开发快捷入口。

## What Changes

- Add deterministic command bar keyboard handling for query editing, suggestion navigation, and suggestion acceptance.
- 为 command bar 增加确定性的键盘处理：query editing、suggestion navigation 与 suggestion acceptance。
- Make `Enter` accept the active suggestion and return a command preview/fill result without model dispatch.
- 让 `Enter` 接受 active suggestion，并返回 command preview/fill result，且不触发 model dispatch。
- Preserve local-only behavior: command bar acceptance SHALL update TUI state and expose the chosen command, while actual slash execution remains owned by chat command handling.
- 保持 local-only 行为：command bar acceptance 只更新 TUI state 并暴露选中的 command，真正 slash execution 仍由 chat command handling 负责。
- Add tests for query typing, up/down selection, acceptance, empty-state handling, and plugin suggestion acceptance.
- 增加 query 输入、上下选择、acceptance、空状态处理与 plugin suggestion acceptance 的测试。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chat-tui-workbench-interaction`: Command bar suggestions shall support local keyboard selection and acceptance.

## Impact

- Affected code: CLI TUI workbench state, TUI dispatch result contracts, command bar projection, renderer hints if needed, contract tests, pseudo-terminal tests if needed.
- Affected product surfaces: command bar search, slash suggestion selection, plugin action discoverability.
- No new dependencies and no model/provider behavior changes.
