## ADDED Requirements

### Requirement: Navigation plugins ship in first-party pack
The first-party development plugin pack SHALL include `@deepseek/plugin-file-manager` and `@deepseek/plugin-jump-navigator` as built-in plugins with stable manifests, permissions, command contributions, TUI contributions, and visible reasoning contributions.

First-party development plugin pack 必须包含 `@deepseek/plugin-file-manager` 与 `@deepseek/plugin-jump-navigator`，作为具备稳定 manifests、permissions、command contributions、TUI contributions 与 visible reasoning contributions 的 built-in plugins。

#### Scenario: Plugin pack lists navigation plugins
- **WHEN** the first-party plugin pack is listed, validated, snapshotted, or projected
- **THEN** the file manager and jump navigator plugins appear in deterministic plugin id order with no executable metadata
- **中文** 当 first-party plugin pack 被 list、validate、snapshot 或 project 时，file manager 与 jump navigator plugins 必须按确定性 plugin id 顺序出现，且不包含 executable metadata。

#### Scenario: Navigation plugin directories are owned
- **WHEN** the built-in plugin source tree is inspected
- **THEN** each navigation plugin has its own manifest, commands, TUI, and reasoning contribution files
- **中文** 当 built-in plugin source tree 被检查时，每个 navigation plugin 必须拥有自己的 manifest、commands、TUI 与 reasoning contribution files。
