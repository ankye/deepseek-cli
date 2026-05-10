## MODIFIED Requirements

### Requirement: Turn Lifecycle Events

The system SHALL emit structured events for session start, turn start, context projection, model output, tool intents, tool repair, tool execution, tool feedback, model continuation, turn completion, and errors.

系统必须为 session start、turn start、context projection、model output、tool intents、tool repair、tool execution、tool feedback、model continuation、turn completion 和 errors 发出结构化事件。

#### Scenario: Successful turn lifecycle

- **WHEN** a model response completes without tool execution
- **THEN** the event stream includes turn start, model output, and turn completion events in order

#### Scenario: Tool turn lifecycle

- **WHEN** a model response requests a registered capability
- **THEN** the event stream includes a tool requested event before the corresponding tool completed event

#### Scenario: Live tool continuation lifecycle / Live 工具继续生命周期

- **WHEN** a live model response requests a tool and the tool succeeds
- **THEN** the event stream includes tool intent, optional repair, governed execution events, model-facing tool result, continuation model request, final model output, and turn completion in order
- **中文** 当 live model response 请求 tool 且 tool 成功时，event stream 必须按顺序包含 tool intent、可选 repair、受治理 execution events、model-facing tool result、continuation model request、最终 model output 和 turn completion。

### Requirement: Runtime Uses Governed Invocation Boundary

The runtime SHALL be the execution owner for model-tool iteration and SHALL preserve execution envelope, policy, scheduler, bus, trace, audit, replay, and sandbox boundaries when invoking executable capabilities from live model tool intents.

runtime 必须作为 model-tool iteration 的 execution owner，并在从 live model tool intents 调用 executable capabilities 时保留 execution envelope、policy、scheduler、bus、trace、audit、replay 和 sandbox boundaries。

#### Scenario: Runtime invokes model through governed boundary

- **WHEN** runtime needs a model stream, capability execution, command execution, skill activation, hook invocation, MCP call, sandbox job, plugin lifecycle action, or subagent turn
- **THEN** it creates or receives a governed execution envelope rather than allowing application adapters to call the primitive directly

#### Scenario: Direct host bypass is forbidden

- **WHEN** CLI, VSCode, or future server host needs executable work
- **THEN** it calls runtime or protocol endpoints and does not directly invoke model, skill, hook, command, MCP, plugin, sandbox, or capability execution primitives

#### Scenario: Live model tool intent enters kernel / Live 模型工具意图进入 Kernel

- **WHEN** runtime accepts a live model tool intent for execution
- **THEN** it creates a kernel invocation with the original tool call id, repaired input evidence, policy context, trace context, timeout, resource scope, and replay metadata
- **中文** 当 runtime 接受 live model tool intent 进行执行时，必须创建 kernel invocation，并携带 original tool call id、repaired input evidence、policy context、trace context、timeout、resource scope 和 replay metadata。

### Requirement: Runtime Event Ordering

The kernel-backed runtime loop SHALL emit lifecycle, context, model, tool intent, repair, envelope, policy, scheduling, execution, feedback, continuation, result, and terminal events in a stable order.

kernel-backed runtime loop 必须以稳定顺序输出 lifecycle、context、model、tool intent、repair、envelope、policy、scheduling、execution、feedback、continuation、result 和 terminal events。

#### Scenario: Successful execution order

- **WHEN** a kernel-backed capability completes successfully
- **THEN** the event stream includes request accepted, envelope created, workflow opened, policy decided, scheduled, started, output or progress, completed, and workflow closed events in order

#### Scenario: Failed execution order

- **WHEN** a kernel-backed capability fails
- **THEN** the event stream includes the same pre-execution events followed by failed and workflow closed events with typed error metadata

#### Scenario: Successful live tool order / 成功 Live 工具顺序

- **WHEN** a live tool call succeeds and model continuation completes
- **THEN** the runtime event stream includes the successful kernel execution sequence between model tool intent and tool feedback, then a continuation model request before turn completion
- **中文** 当 live tool call 成功且 model continuation 完成时，runtime event stream 必须在 model tool intent 与 tool feedback 之间包含成功 kernel execution sequence，然后在 turn completion 前包含 continuation model request。

### Requirement: Projection Failure Blocks Model Dispatch / Projection 失败阻止模型派发

Runtime SHALL fail closed when projection returns a hard budget rejection, unsupported schema, unsafe redaction state, corrupted projection evidence, or live tool continuation would exceed the configured context/tool feedback budget.

runtime 在 projection 返回 hard budget rejection、unsupported schema、unsafe redaction state、corrupted projection evidence，或 live tool continuation 会超过 configured context/tool feedback budget 时，必须 fail closed。

#### Scenario: Rejected projection emits terminal event

- **WHEN** projection is rejected before model dispatch
- **THEN** runtime emits a typed terminal event and does not call the model gateway

#### Scenario: Tool feedback budget blocks continuation / 工具反馈预算阻止继续

- **WHEN** accumulated tool feedback would exceed the continuation budget
- **THEN** runtime emits a typed terminal event and does not send another live model request
- **中文** 当累计 tool feedback 会超过 continuation budget 时，runtime 必须发出 typed terminal event，且不得发送另一个 live model request。

## ADDED Requirements

### Requirement: Live Tool Continuation Policy / Live 工具继续策略

Runtime SHALL decide whether each live tool outcome should continue the model, provide corrective feedback, or terminate the turn based on safety class, policy decision, loop limits, and provider state.

runtime 必须根据 safety class、policy decision、loop limits 和 provider state，决定每个 live tool outcome 是继续模型、提供 corrective feedback，还是终止 turn。

#### Scenario: Correctable rejection continues / 可纠正拒绝可继续

- **WHEN** a model tool call is rejected for a correctable schema or path issue and the continuation policy allows self-correction
- **THEN** runtime sends bounded rejection feedback to the model instead of executing the tool
- **中文** 当 model tool call 因可纠正 schema 或 path 问题被拒绝，且 continuation policy 允许 self-correction 时，runtime 必须向模型发送有界 rejection feedback，而不是执行工具。

#### Scenario: Terminal rejection stops / 终态拒绝停止

- **WHEN** a model tool call attempts forbidden capability access, secret exfiltration, repeated unsafe requests, or loop-limit violation
- **THEN** runtime emits a typed terminal failure and does not send another model continuation request
- **中文** 当 model tool call 尝试 forbidden capability access、secret exfiltration、重复 unsafe requests 或违反 loop-limit 时，runtime 必须发出 typed terminal failure，且不得发送另一个 model continuation request。
