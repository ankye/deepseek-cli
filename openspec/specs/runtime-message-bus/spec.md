# runtime-message-bus Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Internal Runtime Message Bus

The platform SHALL define an internal runtime message bus for typed service-to-service events, commands, requests, replies, and control signals inside the headless runtime.

平台必须定义 internal runtime message bus，用于 headless runtime 内部 typed service-to-service events、commands、requests、replies 和 control signals。

#### Scenario: Service publishes typed bus event

- **WHEN** a runtime service publishes a bus event
- **THEN** the event includes bus schema version, event id, topic, producer, correlation id, causation id, trace context, redaction class, timestamp, and typed payload

#### Scenario: Host protocol is not the internal bus

- **WHEN** CLI, VSCode, test, or future server transports communicate with runtime
- **THEN** they use the host-runtime protocol boundary
- **AND** runtime services communicate internally through the runtime message bus boundary

### Requirement: Topics, Routing, and Ownership

The runtime message bus SHALL define owned topics for runtime, workflow, concurrency, agent, model, context, memory, cache, capability, skill, extension, policy, sandbox, platform, session, observability, and regression events.

runtime message bus 必须定义 owned topics，覆盖 runtime、workflow、concurrency、agent、model、context、memory、cache、capability、skill、extension、policy、sandbox、platform、session、observability 和 regression events。

#### Scenario: Topic ownership is enforced

- **WHEN** a service publishes to a topic it does not own or have permission to emit
- **THEN** the bus rejects the message or routes it through a governed command interface

#### Scenario: Subscriber receives authorized topic events

- **WHEN** a service subscribes to a topic
- **THEN** the bus enforces subscription permissions, redaction rules, and compatibility checks before delivering events

### Requirement: Delivery, Ordering, and Backpressure

The runtime message bus SHALL provide deterministic in-memory delivery in the first framework, ordered delivery within a correlation stream, bounded queues, backpressure signals, cancellation propagation, and structured overflow errors.

runtime message bus 必须在第一版框架中提供 deterministic in-memory delivery、correlation stream 内有序 delivery、bounded queues、backpressure signals、cancellation propagation 和 structured overflow errors。

#### Scenario: Correlated bus events remain ordered

- **WHEN** multiple bus events belong to the same correlation id and ordered stream
- **THEN** subscribers observe those events in declared order

#### Scenario: Slow subscriber triggers backpressure

- **WHEN** a subscriber consumes events slower than the configured queue policy allows
- **THEN** the bus emits a backpressure signal, applies the configured overflow policy, and records telemetry

### Requirement: Replay and Session Integration

The runtime message bus SHALL expose replayable event records to the session store and regression harness without requiring live services or host adapters.

runtime message bus 必须向 session store 和 regression harness 暴露可 replay 的 event records，且不依赖 live services 或 host adapters。

#### Scenario: Bus trace is persisted for replay

- **WHEN** a runtime turn completes
- **THEN** selected bus events can be persisted as a redacted trace linked to the session, workflow, task, agent, and protocol correlation metadata

#### Scenario: Bus replay uses deterministic fakes

- **WHEN** a regression test replays a bus trace
- **THEN** it can reconstruct expected service interactions using deterministic fakes without live model, filesystem, process, network, or editor dependencies

### Requirement: Policy, Audit, and Isolation

The runtime message bus SHALL apply policy, audit, redaction, and isolation rules to commands and events that cross trust, sandbox, extension, skill, agent, or host boundaries.

runtime message bus 必须对跨越 trust、sandbox、extension、skill、agent 或 host boundaries 的 commands 和 events 应用 policy、audit、redaction 和 isolation rules。

#### Scenario: Extension command crosses trust boundary

- **WHEN** an extension-originated command is sent through the bus
- **THEN** the bus includes source trust metadata and routes the command through policy and audit checks before execution

#### Scenario: Sensitive payload is redacted for observer

- **WHEN** an observer subscribes to events containing sensitive payloads outside its allowed redaction class
- **THEN** the bus delivers a redacted event shape or denies delivery according to policy

### Requirement: Capability Invocation Event Topics

The runtime message bus SHALL define owned topics for capability invocation requested, policy checked, approval required, scheduled, started, progress, completed, failed, cancelled, rolled back, and replay recorded events.

runtime message bus 必须为 capability invocation requested、policy checked、approval required、scheduled、started、progress、completed、failed、cancelled、rolled back 和 replay recorded events 定义 owned topics。

#### Scenario: Invocation event includes envelope reference

- **WHEN** a governed capability emits a bus event
- **THEN** the event includes invocation id, producer, owner, session id when available, workflow id when available, task id when available, agent id when available, trace context, redaction class, trust boundary, and compatibility metadata

#### Scenario: Host observes projected events

- **WHEN** a host adapter subscribes to execution progress
- **THEN** it receives protocol-projected canonical runtime events rather than private subsystem state

### Requirement: In-Process Runtime Message Bus

The platform SHALL provide an in-process runtime message bus implementation for kernel events.

平台必须提供 in-process runtime message bus implementation，用于 kernel events。

#### Scenario: Publish and subscribe events

- **WHEN** kernel components publish lifecycle, envelope, policy, scheduler, execution, result, or error events
- **THEN** subscribers receive those events in publish order for the invocation stream

#### Scenario: Subscriber receives typed events

- **WHEN** CLI, tests, or future VSCode adapters subscribe to runtime events
- **THEN** each event includes a stable type, version, timestamp, trace context, and redaction metadata

### Requirement: Event Stream Projection

The message bus SHALL support host projection without transferring execution ownership to the host.

message bus 必须支持 host projection，但不得把 execution ownership 转移给 host。

#### Scenario: CLI projects stream-json output

- **WHEN** CLI runs a kernel-backed command with stream output enabled
- **THEN** it serializes canonical events without mutating kernel lifecycle state

### Requirement: Explicit Bus Failure Semantics

The runtime message bus and kernel integration SHALL expose explicit failure semantics for publish, subscription, replay storage, and backpressure.

runtime message bus 与 kernel integration 必须为 publish、subscription、replay storage 和 backpressure 暴露明确 failure semantics。

#### Scenario: Backpressure fails replayable invocation

- **WHEN** bus backpressure prevents publishing a replayable kernel event
- **THEN** the kernel invocation fails with a typed event persistence error and the failure is covered by contract tests

#### Scenario: Subscriber queue is bounded

- **WHEN** a subscriber consumes events slowly
- **THEN** bus buffering remains bounded or emits a typed backpressure failure instead of growing unbounded

### Requirement: Observability And Privacy Roadmap / 观测与隐私路线图

The runtime message bus SHALL support roadmap acceptance for observability, diagnostics, privacy opt-out, telemetry boundaries, redaction, and local deterministic trace collection before broad product launch.

runtime message bus 必须支持 observability、diagnostics、privacy opt-out、telemetry boundaries、redaction 和 local deterministic trace collection 的路线图验收，且这些能力应在大范围产品发布前建立。

#### Scenario: Diagnostic event is redacted / 诊断事件被脱敏

- **WHEN** a diagnostic, telemetry, analytics, support-bundle, bus, or runtime event is emitted
- **THEN** the event declares or is normalized into data/privacy class, redaction metadata, trace context, opt-out behavior, and persistence policy before storage or host projection
- **中文** 当 diagnostic、telemetry、analytics、support-bundle、bus 或 runtime event 被发出时，该事件必须在存储或 host projection 前声明或被归一化为 data/privacy class、redaction metadata、trace context、opt-out behavior 和 persistence policy。

#### Scenario: Privacy setting affects telemetry boundary / 隐私设置影响遥测边界

- **WHEN** a user disables telemetry or privacy policy denies export
- **THEN** runtime keeps deterministic local diagnostics while preventing external telemetry export and recording the decision in audit-safe metadata
- **中文** 当用户关闭 telemetry 或 privacy policy 拒绝导出时，runtime 必须保留 deterministic local diagnostics，同时阻止 external telemetry export，并以 audit-safe metadata 记录该决策。

#### Scenario: Bus records enter diagnostic bundle / bus records 进入诊断包

- **WHEN** bus or runtime replay records are included in a diagnostic bundle
- **THEN** only canonical redacted observability records or redacted replay summaries are included, never private subsystem state or raw payload secrets
- **中文** 当 bus 或 runtime replay records 被包含进 diagnostic bundle 时，只能包含 canonical redacted observability records 或 redacted replay summaries，不能包含 private subsystem state 或 raw payload secrets。
