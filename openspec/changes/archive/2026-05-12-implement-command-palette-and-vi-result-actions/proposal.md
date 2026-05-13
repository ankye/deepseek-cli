## Why

The composition layer now normalizes commands, skills, hooks, MCP, plugins, extensions, renderer hints, and workflows into inert records, but CLI users still lack a unified way to discover those records and act on result-list targets without string parsing. This is the right next step before a heavier TUI because it turns vi-inspired navigation into typed actions over structured targets.

Composition layer 已经把 commands、skills、hooks、MCP、plugins、extensions、renderer hints 和 workflows 归一为惰性 records，但 CLI 用户仍缺少统一发现这些 records 并对 result-list targets 执行动作的方式，且不应依赖字符串解析。现在先做这一层，能在重型 TUI 前把 vi 启发式导航落成 typed actions over structured targets。

## What Changes

- Add a CLI command palette capability that projects command composition records into stable palette entries and searchable result lists. / 增加 CLI command palette 能力，将 command composition records 投影为稳定 palette entries 和可搜索 result lists。
- Add deterministic action resolution for result-list targets, including `open`, `inspect`, `copy`, `explain`, `next`, `previous`, `first`, `last`, and `add-to-reference-set`. / 增加 result-list targets 的确定性 action resolution，覆盖 `open`、`inspect`、`copy`、`explain`、`next`、`previous`、`first`、`last` 和 `add-to-reference-set`。
- Add a minimal vi profile that maps familiar navigation keys onto existing modes/actions/targets without implementing full Vim emulation. / 增加最小 vi profile，将熟悉的导航按键映射到现有 modes/actions/targets，不实现完整 Vim 模拟。
- Extend CLI composition contracts with palette projection records, action resolution results, keymap diagnostics, and jump/reference updates. / 扩展 CLI composition contracts，增加 palette projection records、action resolution results、keymap diagnostics 和 jump/reference updates。
- Add package/contract tests proving palette projection is inert, conflicts are deterministic, result-list actions update focus/reference/jump state, and host-only records do not become model commands. / 增加 package/contract tests，证明 palette projection 惰性、冲突确定、result-list actions 会更新 focus/reference/jump state，且 host-only records 不会成为 model commands。

## Capabilities

### New Capabilities

- `command-palette-vi-actions`: command palette projection, vi-profile keymaps, result-list action resolution, jump/reference updates, and deterministic regression coverage. / command palette projection、vi-profile keymaps、result-list action resolution、jump/reference updates 和确定性回归覆盖。

### Modified Capabilities

- `vi-inspired-cli-composition`: add concrete palette/action resolution behavior over the existing composition model. / 在已有 composition model 上增加具体 palette/action resolution 行为。
- `command-skill-hook-composition`: require command composition records to feed palette/result-list projections without executing owners. / 要求 command composition records 输入 palette/result-list projections，且不执行 owner。
- `command-system`: expose palette projection helpers derived from composition records. / 暴露基于 composition records 的 palette projection helpers。
- `testing-regression`: cover palette projection, keymap conflicts, result-list action resolution, jump/reference updates, and no-owner-execution behavior. / 覆盖 palette projection、keymap conflicts、result-list action resolution、jump/reference updates 和不执行 owner 的行为。

## Impact

- Affects `@deepseek/platform-contracts` CLI composition DTOs and public exports. / 影响 `@deepseek/platform-contracts` CLI composition DTOs 与公共导出。
- Affects `@deepseek/command-system` with focused palette/action helper modules; `index.ts` remains export-only. / 影响 `@deepseek/command-system`，新增聚焦的 palette/action helper modules；`index.ts` 保持只做导出。
- May update `src/apps/cli/README.md` to document visible palette/action behavior only if a CLI command is exposed in this pack. / 若本包暴露 CLI 命令，才更新 `src/apps/cli/README.md` 记录可见 palette/action 行为。
- Does not implement a full-screen TUI, macros, registers, visual mode, command execution from palette, marketplace, or host promotion. / 本包不实现 full-screen TUI、macros、registers、visual mode、从 palette 执行命令、marketplace 或 host promotion。
