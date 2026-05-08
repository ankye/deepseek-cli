# communication-protocol Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Versioned Protocol Envelope

The system SHALL define a versioned protocol envelope for host-runtime communication across in-process, CLI stream, VSCode, test, and future server transports.

系统必须定义版本化 protocol envelope，用于 in-process、CLI stream、VSCode、test 和未来 server transports 的 host-runtime 通信。

#### Scenario: Envelope contains routing metadata

- **WHEN** a host sends a protocol message
- **THEN** the envelope includes protocol version, schema version, message id, correlation id, source host, route, timestamp, trace context, redaction class, and optional session id

#### Scenario: Unknown protocol version is rejected

- **WHEN** the protocol decoder receives an unsupported protocol version
- **THEN** it returns a structured protocol error without invoking runtime behavior

### Requirement: Transport-Neutral Pipeline

The communication layer SHALL process messages through transport-neutral decode, validate, route, authorize, execute, encode, and observe stages.

通信层必须通过 transport-neutral 的 decode、validate、route、authorize、execute、encode 和 observe stages 处理消息。

#### Scenario: CLI and VSCode share pipeline

- **WHEN** CLI and VSCode submit equivalent runtime turn requests
- **THEN** both requests pass through the same protocol validation and routing pipeline

#### Scenario: Protocol pipeline emits observability

- **WHEN** a message is accepted, rejected, routed, completed, or failed
- **THEN** the pipeline emits structured observability events with redacted metadata

### Requirement: Request, Event, and Control Messages

The protocol SHALL define typed messages for runtime turns, control commands, approvals, cancellation, workspace edits, event streams, session operations, and replay.

协议必须定义 runtime turns、control commands、approvals、cancellation、workspace edits、event streams、session operations 和 replay 的 typed messages。

#### Scenario: Cancellation uses control message

- **WHEN** a host cancels an active operation
- **THEN** it sends a cancellation control message correlated to the active request or task scope

#### Scenario: Runtime event is protocol event

- **WHEN** runtime emits a `RuntimeEvent`
- **THEN** the protocol layer can wrap it as a transport event without losing event id, session id, trace context, or redaction metadata

### Requirement: Backpressure and Ordering

The protocol SHALL define ordering, buffering, and backpressure semantics for streaming events.

协议必须定义 streaming events 的 ordering、buffering 和 backpressure semantics。

#### Scenario: Slow host receives bounded stream

- **WHEN** a host consumes events slower than runtime produces them
- **THEN** the protocol layer applies bounded buffering, backpressure, or a structured overflow error according to transport policy

#### Scenario: Correlated events remain ordered

- **WHEN** events belong to the same request correlation id
- **THEN** the protocol preserves their declared order within that stream

### Requirement: Protocol Golden Tests

The framework SHALL include golden tests for protocol envelopes, routing, errors, cancellation, backpressure, and event ordering.

框架必须包含 protocol envelopes、routing、errors、cancellation、backpressure 和 event ordering 的 golden tests。

#### Scenario: Golden protocol trace replays

- **WHEN** a golden protocol trace is replayed
- **THEN** the protocol layer produces the expected normalized events and errors

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

