## ADDED Requirements

### Requirement: Public Runtime SDK And Control API Roadmap / 公共 Runtime SDK 与控制 API 路线图

The communication protocol SHALL place public runtime SDK and control API stabilization in R4 with versioned request, event, control, cancellation, replay, error, and persisted-session schemas.

communication protocol 必须把 public runtime SDK 与 control API 稳定化放入 R4，并提供版本化 request、event、control、cancellation、replay、error 和 persisted-session schemas。

#### Scenario: SDK uses public protocol schemas / SDK 使用公共协议 schema

- **WHEN** a CLI, VSCode, server, remote, or third-party SDK client submits runtime work
- **THEN** it uses public protocol schemas and compatibility metadata instead of private runtime objects or stdout parsing
- **中文** 当 CLI、VSCode、server、remote 或 third-party SDK client 提交 runtime work 时，必须使用 public protocol schemas 和 compatibility metadata，而不是 private runtime objects 或 stdout parsing。

#### Scenario: Control API compatibility is tested / 控制 API 兼容性被测试

- **WHEN** protocol or control API schemas change
- **THEN** compatibility fixtures prove additive compatibility, explicit breaking rejection, migration behavior, and replay stability
- **中文** 当 protocol 或 control API schemas 变化时，compatibility fixtures 必须证明 additive compatibility、explicit breaking rejection、migration behavior 和 replay stability。
