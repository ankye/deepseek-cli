## Why

Navigation slash commands now execute locally in chat, but users still need prior knowledge of `/file` and `/jump` to discover them. The next product step is to make these built-in plugin workflows visible in chat help and searchable in the TUI command bar.

Navigation slash commands 现在已经能在 chat 中本地执行，但用户仍需要预先知道 `/file` 与 `/jump` 才能发现它们。下一步产品体验是让这些内置插件 workflow 出现在 chat help，并能在 TUI command bar 中搜索到。

## What Changes

- Add `/file ...` and `/jump ...` guidance to chat `/help` text.
- 将 `/file ...` 与 `/jump ...` 指引加入 chat `/help` 文本。
- Add TUI command bar suggestions for file manager and jump navigator slash commands.
- 为 file manager 与 jump navigator slash commands 增加 TUI command bar suggestions。
- Keep suggestions bounded and searchable without pushing existing first-screen command guidance out of the startup list.
- 保持 suggestions 有界且可搜索，同时不把现有首屏 command guidance 挤出 startup list。
- Add deterministic tests for help and TUI suggestion discovery.
- 增加 help 与 TUI suggestion discovery 的确定性测试。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `command-system`: Chat help shall disclose navigation slash commands as local structured commands.
- `chat-tui-workbench-interaction`: TUI command bar shall surface navigation slash commands as searchable built-in suggestions.

## Impact

- Affected code: command-system interactive help renderer, TUI command bar suggestion list, CLI/chat and TUI contract tests.
- Affected product surfaces: `/help`, TUI command bar suggestions, startup/status discoverability.
- No new dependencies and no execution behavior changes.
