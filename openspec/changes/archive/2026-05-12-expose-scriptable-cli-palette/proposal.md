## Why

The command palette and vi-style action layer now exists as typed, inert package APIs, but CLI users and tests cannot exercise it from the product surface. Exposing a scriptable CLI palette closes the first visible loop without jumping straight to a full-screen TUI.

Command palette 与 vi-style action layer 已经作为类型化、惰性的 package APIs 存在，但 CLI 用户与测试还无法从产品面调用它。先暴露可脚本化 CLI palette，可以在不直接进入 full-screen TUI 的前提下闭合第一个可见链路。

## What Changes

- Add `deepseek palette list` to emit command palette projections in `text`, `json`, or `jsonl` output modes. / 增加 `deepseek palette list`，以 `text`、`json` 或 `jsonl` 输出 command palette projection。
- Add `deepseek palette keymap [core|vi-minimal]` to inspect declarative keymap profiles and diagnostics. / 增加 `deepseek palette keymap [core|vi-minimal]`，查看声明式 keymap profile 与 diagnostics。
- Add `deepseek palette action <action> <target-id>` as a dry-run scriptable resolver over palette result-list targets. / 增加 `deepseek palette action <action> <target-id>`，对 palette result-list targets 做 dry-run 脚本化解析。
- Keep all palette commands inert: they must not execute command handlers, skills, hooks, MCP tools, plugins, workflows, model calls, or workspace mutation. / 所有 palette commands 保持惰性：不得执行 command handlers、skills、hooks、MCP tools、plugins、workflows、model calls 或 workspace mutation。
- Keep implementation in a focused CLI command module and reuse shared `@deepseek/command-system` helpers. / 实现放在聚焦 CLI command module，并复用共享 `@deepseek/command-system` helpers。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `command-palette-vi-actions`: scriptable CLI surface for palette projection, keymap inspection, and dry-run action resolution. / 为 palette projection、keymap inspection 和 dry-run action resolution 增加可脚本化 CLI 产品面。
- `minimal-chat-cli`: help/usage lists palette commands as local CLI commands without sending them to the model. / help/usage 将 palette commands 作为本地 CLI commands 列出，不发送给 model。
- `testing-regression`: cover scriptable palette output, keymap output, action resolution output, and inert/no-owner-execution behavior from the CLI host. / 覆盖 CLI host 上的 scriptable palette output、keymap output、action resolution output 和惰性/不执行 owner 行为。

## Impact

- Affects `src/apps/cli/src/commands/*`, `parse.ts`, `run-cli.ts`, and CLI usage text. / 影响 CLI command modules、解析、分发与 usage 文案。
- Adds CLI host tests for `palette list`, `palette keymap`, and `palette action`. / 增加 CLI host 测试。
- Does not add raw input, full-screen rendering, fuzzy matching UI, command execution from palette, or non-CLI host behavior. / 不增加 raw input、full-screen rendering、fuzzy matching UI、从 palette 执行命令或非 CLI host 行为。
