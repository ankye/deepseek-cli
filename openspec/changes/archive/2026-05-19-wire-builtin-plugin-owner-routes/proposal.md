## Why

Built-in plugins currently declare commands, keymaps, palettes, and render hints, but the execution readiness lives in separate CLI adapters and is not checked as a complete contract. This leaves the product feeling metadata-first instead of plugin-driven.

内置插件目前已经声明 commands、keymaps、palettes 与 render hints，但执行就绪状态散落在 CLI adapter 中，没有形成完整契约。这会让产品体验像 metadata 拼装，而不是插件驱动的完整闭环。

## What Changes

- Add a host-owned owner route registry for built-in plugin command IDs.
- 为内置插件 commandId 增加 host-owned owner route registry。
- Verify every built-in plugin command contribution maps to an implemented, deferred, or explicitly unsupported owner route.
- 校验每个 built-in plugin command contribution 都映射到 implemented、deferred 或显式 unsupported 的 owner route。
- Route implemented built-in plugin commands through existing command adapters rather than plugin-private handlers.
- 已实现命令通过现有 command adapters 执行，而不是 plugin-private handlers。
- Project route readiness into extension/plugin contribution diagnostics and tests.
- 将 route readiness 投影到 extension/plugin contribution diagnostics 与测试中。
- Keep TUI keymaps and palette entries metadata-only until the host dispatches them through these owner routes.
- TUI keymaps 与 palette entries 继续保持 metadata-only，直到 host 通过 owner routes 调度。

## Capabilities

### New Capabilities
- `builtin-plugin-owner-routes`: Covers built-in plugin command owner routing, readiness projection, dispatch, and full regression coverage.

### Modified Capabilities
- `first-party-dev-plugins`: Built-in plugin pack validation must include command route readiness.
- `command-system`: Plugin command dispatch must be owner-routed and non-private.
- `professional-vi-tui-experience`: TUI plugin actions must expose whether their owner route is executable, deferred, or blocked.

## Impact

- Affected code: `src/apps/cli/src/plugins/*`, `src/apps/cli/src/commands/*`, `src/plugins/builtin`, `src/packages/first-party-dev-plugins`, tests under `tests/contracts` and `tests/matrix`.
- Affected product surfaces: `deepseek extension plugin contributions`, `deepseek repo`, `deepseek git`, `deepseek checks`, `deepseek context`, and TUI plugin shelves/keymaps.
- No new runtime dependency. Execution remains with CLI host adapters and owner subsystems.
