## ADDED Requirements

### Requirement: Production TUI Mode Status Is Explicit / Production TUI Mode 状态显式化

The production TUI framework SHALL expose explicit mode/status records for prompt, normal, command, approval, selection, result-list, and degraded interaction.

Production TUI framework 必须为 prompt、normal、command、approval、selection、result-list 与 degraded interaction 暴露显式 mode/status records。

#### Scenario: Startup reports mode status / 启动报告 Mode 状态

- **WHEN** interactive chat starts
- **THEN** TUI startup status includes the active interaction mode, composition mode, input strategy, renderer profile, viewport profile, and degradation reasons when any
- **中文** 当 interactive chat 启动时，TUI startup status 必须包含 active interaction mode、composition mode、input strategy、renderer profile、viewport profile 与任何 degradation reasons。

#### Scenario: Degraded mode is diagnosable / 降级模式可诊断

- **WHEN** terminal capability disables interactive viewport or key handling
- **THEN** the framework exposes a degraded mode diagnostic explaining the reason while keeping structured command/runtime behavior available
- **中文** 当 terminal capability 禁用 interactive viewport 或 key handling 时，framework 必须暴露 degraded mode diagnostic 说明原因，同时保持 structured command/runtime behavior 可用。

### Requirement: TUI Diagnostics Matrix Covers Framework Readiness / TUI 诊断矩阵覆盖框架就绪度

The CLI SHALL expose TUI readiness through deterministic status/help output and tests before release.

CLI 必须在 release 前通过确定性的 status/help output 与 tests 暴露 TUI readiness。

#### Scenario: Help includes framework readiness / Help 包含 Framework 就绪度

- **WHEN** a user runs `/help` in interactive chat
- **THEN** help output includes the TUI framework name, vi-inspired keymap profile, viewport profile, plugin contribution policy, and structured fallback policy
- **中文** 当用户在 interactive chat 中运行 `/help` 时，help output 必须包含 TUI framework name、vi-inspired keymap profile、viewport profile、plugin contribution policy 与 structured fallback policy。
