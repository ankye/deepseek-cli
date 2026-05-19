## Why

Repo Navigator proved that built-in plugins can feel native in the TUI, palette, and execution workbench. The next product step is to add first-party file management and jump navigation plugins so everyday development workflows are available as polished built-ins rather than future placeholders.

Repo Navigator 已经证明 built-in plugins 可以原生进入 TUI、palette 与 execution workbench。下一步产品推进是加入 first-party file management 与 jump navigation plugins，让日常开发工作流成为打磨过的内置能力，而不是未来占位。

## What Changes

- Add `@deepseek/plugin-file-manager` as a built-in read-only file workflow plugin with list, preview, and reference commands.
- 增加 `@deepseek/plugin-file-manager`，作为内置只读文件工作流插件，提供 list、preview 与 reference commands。
- Add `@deepseek/plugin-jump-navigator` as a built-in navigation plugin with file jump, text jump, and deferred symbol jump commands.
- 增加 `@deepseek/plugin-jump-navigator`，作为内置跳转导航插件，提供 file jump、text jump 与 deferred symbol jump commands。
- Wire both plugins through existing owner route readiness and host-owned dispatch.
- 将两个插件接入现有 owner route readiness 与 host-owned dispatch。
- Project both plugins into TUI, palette, extension inspection, plugin shelf, and visible reasoning surfaces.
- 将两个插件投影到 TUI、palette、extension inspection、plugin shelf 与 visible reasoning surfaces。
- Keep all contributions declarative and handler-free.
- 所有 contributions 保持声明式且不包含 handler。

## Capabilities

### New Capabilities
- `builtin-navigation-plugins`: Covers file-manager and jump-navigator built-in plugin behavior, route readiness, result lists, and deferred symbol navigation.

### Modified Capabilities
- `first-party-dev-plugins`: The built-in development plugin pack now includes file-manager and jump-navigator plugins.
- `builtin-plugin-owner-routes`: Owner route coverage now includes file manager and jump navigator command routes.
- `interactive-plugin-workbench`: Plugin execution records now support file manager and jump navigator result-list attachment.

## Impact

- Affected code: `src/plugins/builtin/src/plugins/*`, `src/plugins/builtin/src/registry.ts`, `src/apps/cli/src/plugins/builtin-owner-routes.ts`, new CLI host adapters, and focused plugin tests.
- Affected product surfaces: command palette, chat TUI plugin shelf, plugin execution activity, extension contribution inspection, visible reasoning, and release readiness metadata.
- No new runtime dependency. All execution remains host-owned through existing platform abstractions.
