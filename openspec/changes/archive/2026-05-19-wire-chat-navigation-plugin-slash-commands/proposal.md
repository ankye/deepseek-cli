## Why

File manager and jump navigator are now real built-in plugins with owner routes and top-level CLI commands, but chat users still need to switch out of the interactive loop to use them directly. Wiring `/file` and `/jump` closes the product gap between chat, TUI command entry, plugin adapters, and scriptable CLI workflows.

File manager 与 jump navigator 现在已经是具备 owner routes 与顶层 CLI commands 的真实内置插件，但 chat 用户仍需要离开交互循环才能直接使用它们。接入 `/file` 与 `/jump` 可以打通 chat、TUI command entry、plugin adapters 与可脚本化 CLI workflows 之间的产品闭环。

## What Changes

- Add `/file list|preview|refs <query>` chat slash commands that execute locally through the file-manager adapter.
- 增加 `/file list|preview|refs <query>` chat slash commands，并通过 file-manager adapter 本地执行。
- Add `/jump file|text|symbol <query>` chat slash commands that execute locally through the jump-navigator adapter, preserving deferred symbol diagnostics.
- 增加 `/jump file|text|symbol <query>` chat slash commands，并通过 jump-navigator adapter 本地执行，同时保留 symbol deferred diagnostics。
- Project navigation slash results into chat JSONL records and the TUI result-list mode where results exist.
- 将 navigation slash results 投影到 chat JSONL records，并在有结果列表时投影到 TUI result-list mode。
- Cover chat-local execution with deterministic tests that verify no model dispatch occurs.
- 增加确定性测试覆盖 chat-local execution，并验证不会触发模型分发。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `builtin-navigation-plugins`: Navigation plugins gain first-class chat slash entry points that reuse existing adapters.
- `command-system`: Chat slash command dispatch includes file and jump plugin workflows as structured local commands.
- `chat-tui-workbench-interaction`: Local navigation slash results project into the active TUI composition/result-list flow.

## Impact

- Affected code: `src/apps/cli/src/commands/chat.ts`, palette/chat state helpers, TUI mode selection, and CLI tests.
- Affected product surfaces: chat slash commands, text output, JSON/JSONL output, TUI result-list mode, and local no-model command behavior.
- No new dependencies; execution remains host-owned and read-only through platform abstractions.
