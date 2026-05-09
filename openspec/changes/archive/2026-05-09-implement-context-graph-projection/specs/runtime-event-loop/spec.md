## ADDED Requirements

### Requirement: Runtime Uses Context Projection Before Model Dispatch / Runtime 在模型派发前使用 Context Projection

The runtime event loop SHALL request ContextGraph projection before constructing or dispatching a model request.

runtime event loop 必须在构造或派发 model request 前请求 ContextGraph projection。

#### Scenario: Model request uses projection result / Model request 使用 projection result

- **WHEN** a user turn reaches model dispatch
- **THEN** runtime builds the model request from the projection result rather than raw session logs, raw workspace state, or host UI buffers
- **中文** 当 user turn 到达 model dispatch 时，runtime 必须从 projection result 构造 model request，而不是直接使用 raw session logs、raw workspace state 或 host UI buffers。

### Requirement: Projection Failure Blocks Model Dispatch / Projection 失败阻止模型派发

Runtime SHALL fail closed when projection returns a hard budget rejection, unsupported schema, unsafe redaction state, or corrupted projection evidence.

runtime 在 projection 返回 hard budget rejection、unsupported schema、unsafe redaction state 或 corrupted projection evidence 时必须 fail closed。

#### Scenario: Rejected projection emits terminal event / 被拒绝的 projection 发出终态事件

- **WHEN** projection is rejected before model dispatch
- **THEN** runtime emits a typed terminal event and does not call the model gateway
- **中文** 当 projection 在 model dispatch 前被拒绝时，runtime 必须发出 typed terminal event，且不得调用 model gateway。

### Requirement: Runtime Preserves Kernel Governance During Projection / Runtime 在 Projection 中保持 Kernel 治理

Projection SHALL be represented in runtime events and traces without creating a separate execution state machine.

projection 必须体现在 runtime events 与 traces 中，且不得创建独立 execution state machine。

#### Scenario: Projection events are correlated / Projection 事件可关联

- **WHEN** projection runs for a turn
- **THEN** projection events share the turn correlation id, session id, trace context, and redaction metadata
- **中文** 当 projection 为一个 turn 运行时，projection events 必须共享 turn correlation id、session id、trace context 和 redaction metadata。
