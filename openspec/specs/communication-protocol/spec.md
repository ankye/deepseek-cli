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
- **THEN** versioning fixtures prove additive compatibility, explicit breaking rejection, migration behavior, and replay stability
- **中文** 当 protocol 或 control API schemas 变化时，versioning fixtures 必须证明 additive compatibility、explicit breaking rejection、migration behavior 和 replay stability。

### Requirement: Chat CLI Event Consumption / Chat CLI 事件消费

The communication protocol SHALL allow the chat CLI to consume the same canonical runtime events and control semantics as run CLI, VSCode, tests, and future server transports.

communication protocol 必须允许 chat CLI 消费与 run CLI、VSCode、tests 和未来 server transports 相同的 canonical runtime events 与 control semantics。

#### Scenario: Chat prompt uses canonical events / Chat prompt 使用规范事件

- **WHEN** a chat prompt turn runs
- **THEN** prompt submission, runtime events, terminal states, errors, and cancellation are represented as protocol-compatible request, event, and control messages
- **中文** 当 chat prompt turn 运行时，prompt submission、runtime events、terminal states、errors 和 cancellation 必须表示为 protocol-compatible request、event 与 control messages。

#### Scenario: Host renderers share event semantics / Host renderer 共享事件语义

- **WHEN** CLI text, CLI JSONL, VSCode, tests, or future server adapters consume the same runtime event stream
- **THEN** each host renderer receives equivalent event ids, correlation ids, trace metadata, terminal states, and redaction classes
- **中文** 当 CLI text、CLI JSONL、VSCode、tests 或未来 server adapters 消费同一 runtime event stream 时，每个 host renderer 必须收到等价的 event ids、correlation ids、trace metadata、terminal states 和 redaction classes。

### Requirement: Chat Backpressure And Shutdown / Chat 背压与关闭

The protocol and host adapter boundary SHALL define bounded behavior for slow terminal output, EOF, cancellation, and runtime shutdown in the chat shell.

protocol 与 host adapter 边界必须为 chat shell 中的 slow terminal output、EOF、cancellation 和 runtime shutdown 定义有界行为。

#### Scenario: Slow terminal output is bounded / 慢终端输出有界

- **WHEN** the chat shell receives runtime events faster than the terminal writer can flush
- **THEN** the host adapter applies bounded buffering, awaits writes, or emits a structured overflow error according to protocol policy
- **中文** 当 chat shell 接收 runtime events 的速度快于 terminal writer flush 时，host adapter 必须根据 protocol policy 应用 bounded buffering、等待写入，或发出 structured overflow error。

#### Scenario: EOF shuts down runtime resources / EOF 关闭运行时资源

- **WHEN** the chat input stream reaches EOF
- **THEN** the host adapter sends or performs orderly shutdown for active runtime resources and emits no orphaned active invocation
- **中文** 当 chat input stream 到达 EOF 时，host adapter 必须发送或执行 active runtime resources 的有序关闭，并且不得留下 orphaned active invocation。

### Requirement: Session Operation Protocol Messages / Session 操作协议消息

The communication protocol SHALL define versioned request, result, event, and error semantics for session resume and fork-lite operations.

communication protocol 必须为 session resume 与 fork-lite operations 定义版本化 request、result、event 和 error 语义。

#### Scenario: Resume request is protocol-compatible / Resume request 兼容协议

- **WHEN** CLI, VSCode, tests, or future server transports request session resume
- **THEN** the request includes protocol version, correlation id, source host, session id, trace metadata, redaction metadata, and compatibility metadata
- **中文** 当 CLI、VSCode、tests 或未来 server transports 请求 session resume 时，request 必须包含 protocol version、correlation id、source host、session id、trace metadata、redaction metadata 和 compatibility metadata。

#### Scenario: Fork request is protocol-compatible / Fork request 兼容协议

- **WHEN** CLI, VSCode, tests, or future server transports request session fork-lite
- **THEN** the request includes parent session id, optional fork point sequence, reason metadata, trace metadata, redaction metadata, and compatibility metadata
- **中文** 当 CLI、VSCode、tests 或未来 server transports 请求 session fork-lite 时，request 必须包含 parent session id、optional fork point sequence、reason metadata、trace metadata、redaction metadata 和 compatibility metadata。

#### Scenario: Session operation failure is structured / Session 操作失败结构化

- **WHEN** a session operation fails because of unknown id, unsupported schema, corrupted event log, or policy denial
- **THEN** the protocol layer can return a typed, redacted, replayable error without invoking runtime execution
- **中文** 当 session operation 因 unknown id、unsupported schema、corrupted event log 或 policy denial 失败时，protocol layer 必须能够返回 typed、redacted、replayable error，且不调用 runtime execution。

### Requirement: Session Protocol Compatibility / Session 协议兼容性

Session operation schemas SHALL be compatibility-tested before archive.

session operation schemas 必须在 archive 前经过 versioning tests。

#### Scenario: Additive schema change remains compatible / 增量 schema 变化保持兼容

- **WHEN** session resume or fork-lite result schemas add optional fields
- **THEN** versioning tests prove existing readers can still parse required fields and ignore unknown optional fields
- **中文** 当 session resume 或 fork-lite result schemas 增加 optional fields 时，versioning tests 必须证明 existing readers 仍能解析 required fields 并忽略 unknown optional fields。

### Requirement: Projection Protocol Events / Projection 协议事件

The communication protocol SHALL define transport-neutral projection started, cache-hit, degraded, rejected, and completed events.

communication protocol 必须定义 transport-neutral 的 projection started、cache-hit、degraded、rejected 和 completed events。

#### Scenario: Hosts receive projection summary / Hosts 接收 projection 摘要

- **WHEN** CLI, VSCode, tests, or future server transports consume runtime events
- **THEN** they can observe projection summary metadata without reading context-engine internals
- **中文** 当 CLI、VSCode、tests 或未来 server transports 消费 runtime events 时，必须能观察 projection summary metadata，而不读取 context-engine internals。

### Requirement: Projection Protocol Redaction / Projection 协议脱敏

Projection protocol events SHALL expose redacted summaries and references, never raw secret-like context content.

projection protocol events 必须暴露 redacted summaries 与 references，绝不能暴露 raw secret-like context content。

#### Scenario: Rejected node remains redacted / 被拒绝节点保持脱敏

- **WHEN** a node is excluded because of redaction, policy, or scope
- **THEN** protocol events expose only node id, type, redaction class, and exclusion reason permitted by policy
- **中文** 当节点因 redaction、policy 或 scope 被排除时，protocol events 只能暴露 policy 允许的 node id、type、redaction class 和 exclusion reason。

### Requirement: Projection Protocol Compatibility / Projection 协议兼容性

Projection request, result, and event schemas SHALL be versioned and compatibility-tested.

projection request、result 和 event schemas 必须版本化并经过 versioning tests。

#### Scenario: Additive projection event fields are compatible / 增量 projection event 字段兼容

- **WHEN** projection events add optional fields
- **THEN** existing readers can parse required fields and ignore unknown optional fields
- **中文** 当 projection events 增加 optional fields 时，existing readers 必须能解析 required fields 并忽略 unknown optional fields。
