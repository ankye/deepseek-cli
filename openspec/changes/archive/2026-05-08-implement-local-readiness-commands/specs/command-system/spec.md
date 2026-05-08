## ADDED Requirements

### Requirement: Concrete Readiness Command Registration / 具体可用性命令注册

The command system SHALL register local readiness commands with stable ids, input schemas, output schemas, side-effect metadata, host support, and compatibility metadata.

command system 必须注册 local readiness commands，并包含 stable ids、input schemas、output schemas、side-effect metadata、host support 和 compatibility metadata。

#### Scenario: Readiness command has schema / readiness command 有 schema

- **WHEN** a readiness command is registered
- **THEN** its manifest declares command id, input schema, output schema, side-effect level, permissions, host support, and compatibility range
- **中文** 当 readiness command 被注册时，其 manifest 必须声明 command id、input schema、output schema、side-effect level、permissions、host support 和 compatibility range。

#### Scenario: CLI invokes command through registry / CLI 通过 registry 调用命令

- **WHEN** CLI invokes a readiness command
- **THEN** it dispatches through the command system and renders the structured result instead of embedding command-specific state machines in CLI parsing
- **中文** 当 CLI 调用 readiness command 时，必须通过 command system dispatch 并渲染 structured result，而不是在 CLI parsing 中嵌入 command-specific state machines。
