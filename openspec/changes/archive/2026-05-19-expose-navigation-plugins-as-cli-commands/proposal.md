## Why

The file manager and jump navigator plugins now execute through built-in owner routes, but their fallback guidance already points users at `deepseek file ...` and `deepseek jump ...` commands. Shipping those scriptable CLI entry points closes the product loop between plugin metadata, TUI execution, help text, JSON output, and everyday terminal use.

File manager 与 jump navigator plugins 已经能通过 built-in owner routes 执行，但 fallback guidance 已经指向 `deepseek file ...` 与 `deepseek jump ...` 命令。交付这些可脚本化 CLI 入口，可以打通 plugin metadata、TUI execution、help text、JSON output 与日常终端使用之间的产品闭环。

## What Changes

- Add `deepseek file list|preview|refs <query>` as a read-only CLI entry for the file-manager plugin adapter.
- 增加 `deepseek file list|preview|refs <query>`，作为 file-manager plugin adapter 的只读 CLI 入口。
- Add `deepseek jump file|text|symbol <query>` as a CLI entry for jump-navigator, keeping symbol jump explicitly deferred.
- 增加 `deepseek jump file|text|symbol <query>`，作为 jump-navigator 的 CLI 入口，并保持 symbol jump 明确 deferred。
- Extend CLI parsing, option typing, help projection, and command dispatch without adding plugin-private handlers.
- 扩展 CLI parsing、option typing、help projection 与 command dispatch，但不增加 plugin-private handlers。
- Add text/JSON/JSONL contract tests for file and jump commands, including no-query diagnostics and deferred symbol output.
- 增加 file 与 jump commands 的 text/JSON/JSONL 契约测试，覆盖缺失 query diagnostics 与 deferred symbol output。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `builtin-navigation-plugins`: Navigation plugins are promoted from owner-route-only execution to first-class scriptable CLI commands.
- `command-system`: CLI command parsing, help, and dispatch now include file and jump plugin commands as structured local commands.

## Impact

- Affected code: `src/apps/cli/src/types.ts`, `src/apps/cli/src/commands/parse.ts`, `src/apps/cli/src/entry/run-cli.ts`, file/jump command adapters, CLI contract tests, and OpenSpec specs.
- Affected product surfaces: terminal help, text output, JSON/JSONL output, local plugin workflow invocation, and fallback command correctness.
- No new dependencies. Execution continues through host-owned adapters and platform abstractions.
