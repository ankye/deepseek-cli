## ADDED Requirements

### Requirement: Plugin TUI Actions Show Owner Route Readiness / 插件 TUI Action 展示 Owner Route 就绪状态
The professional TUI SHALL surface owner route readiness for plugin command actions in shelves, keymaps, palettes, and inspectors.

Professional TUI 必须在 shelves、keymaps、palettes 与 inspectors 中展示 plugin command actions 的 owner route readiness。

#### Scenario: TUI can explain a deferred route / TUI 可解释 Deferred Route
- **WHEN** a plugin keymap or palette entry points at a deferred route
- **THEN** the TUI explains the route is recognized but not directly dispatchable and offers the current fallback guidance
- **中文** 当 plugin keymap 或 palette entry 指向 deferred route 时，TUI 必须解释该 route 已识别但不可直接 dispatch，并提供当前 fallback guidance。

#### Scenario: TUI can dispatch implemented routes / TUI 可调度已实现 Route
- **WHEN** a plugin keymap or palette entry points at an implemented route
- **THEN** the TUI has enough metadata to request host dispatch without direct host access from the plugin
- **中文** 当 plugin keymap 或 palette entry 指向 implemented route 时，TUI 必须拥有足够 metadata 来请求 host dispatch，而无需插件获得 direct host access。
