## ADDED Requirements

### Requirement: TUI Keymap Dispatch Shares Palette Action Resolution / TUI Keymap Dispatch 共享 Palette Action 解析

The production TUI framework SHALL resolve keymap-triggered navigation and actions through the same typed action resolution used by chat palette slash commands.

Production TUI framework 必须通过 chat palette slash commands 使用的同一 typed action resolution 解析 keymap-triggered navigation 与 actions。

#### Scenario: Key navigation equals slash navigation / 按键导航等价 Slash 导航

- **WHEN** result-list mode maps `j` to `next` or `k` to `previous`
- **THEN** dispatching the key updates result-list focus, active target, and jump history with the same state semantics as `/palette next` or `/palette previous`
- **中文** 当 result-list mode 将 `j` 映射到 `next` 或将 `k` 映射到 `previous` 时，dispatching key 必须以与 `/palette next` 或 `/palette previous` 相同的 state semantics 更新 result-list focus、active target 与 jump history。

#### Scenario: Command key becomes local descriptor / 命令键成为本地描述符

- **WHEN** normal mode maps `:` to command entry
- **THEN** the framework returns a typed local command descriptor and does not execute model, runtime, plugin, MCP, workspace mutation, or shell commands
- **中文** 当 normal mode 将 `:` 映射到 command entry 时，framework 必须返回 typed local command descriptor，且不得执行 model、runtime、plugin、MCP、workspace mutation 或 shell commands。

### Requirement: TUI Registry Extends Palette Contributions / TUI Registry 扩展 Palette Contributions

The production TUI framework SHALL include command palette entries and render hints in its declarative contribution registry and surface their counts and conflicts in diagnostics.

Production TUI framework 必须在声明式 contribution registry 中包含 command palette entries 与 render hints，并在 diagnostics 中暴露它们的数量与冲突。

#### Scenario: Render hint is metadata-only / Render Hint 仅是元数据

- **WHEN** a plugin contributes a render hint for a command, target, or result-list kind
- **THEN** the framework stores and reports the hint as metadata without importing renderer code or bypassing terminal profile rendering rules
- **中文** 当 plugin 为 command、target 或 result-list kind 贡献 render hint 时，framework 必须将该 hint 作为 metadata 存储和报告，不得导入 renderer code 或绕过 terminal profile rendering rules。
