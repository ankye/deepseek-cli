## ADDED Requirements

### Requirement: Extension Management Commands Are Structured / 扩展管理命令结构化

The command system SHALL treat CLI extension management commands as structured command results with stable identities, side-effect metadata, host support, output schemas, and redaction metadata.

Command system 必须把 CLI extension management commands 作为 structured command results，包含 stable identities、side-effect metadata、host support、output schemas 和 redaction metadata。

#### Scenario: Extension command has stable identity / 扩展命令有稳定身份
- **WHEN** a CLI extension command is registered or documented
- **THEN** it has a stable command id, side-effect level, owner subsystem, required permissions, supported output modes, and compatibility metadata
- **中文** 当 CLI extension command 被注册或文档化时，它必须具备 stable command id、side-effect level、owner subsystem、required permissions、supported output modes 和 compatibility metadata。

#### Scenario: Side-effecting extension command routes through owner / 有副作用扩展命令路由到 Owner
- **WHEN** an extension command installs a plugin, applies a lockfile, activates a skill, tests MCP, or diagnoses credentials
- **THEN** it routes through the owning package contract and returns a structured result instead of mutating CLI-private state
- **中文** 当 extension command 安装 plugin、应用 lockfile、激活 skill、测试 MCP 或诊断 credentials 时，必须通过所属 package contract 路由并返回 structured result，而不是修改 CLI-private state。
