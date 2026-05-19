## ADDED Requirements

### Requirement: Plugin Commands Dispatch Through Owner Routes / 插件命令通过 Owner Route 调度
The command system and CLI host SHALL dispatch built-in plugin commands through declared owner routes rather than plugin-private execution callbacks.

command system 与 CLI host 必须通过声明的 owner routes 调度 built-in plugin commands，而不是通过 plugin-private execution callbacks。

#### Scenario: Owner route dispatch is explicit / Owner Route 调度显式
- **WHEN** a built-in plugin commandId is executed from CLI, palette, or TUI
- **THEN** the host resolves a route descriptor containing owner subsystem, status, dispatch availability, permissions, side effects, and diagnostics before execution
- **中文** 当 built-in plugin commandId 从 CLI、palette 或 TUI 执行时，host 必须先解析 route descriptor，包含 owner subsystem、status、dispatch availability、permissions、side effects 与 diagnostics。

#### Scenario: Private handler is never used / 不使用私有 Handler
- **WHEN** a built-in plugin route is implemented
- **THEN** execution calls the owning host adapter or owner subsystem and never reads handler/callback/execute fields from plugin metadata
- **中文** 当 built-in plugin route 已实现时，执行必须调用 owning host adapter 或 owner subsystem，绝不从 plugin metadata 读取 handler/callback/execute 字段。
