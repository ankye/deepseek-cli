# runtime-event-loop Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Headless Runtime Entry Point

The system SHALL provide a headless agent runtime API that accepts user input and returns an asynchronous stream of runtime events without requiring a terminal UI.

#### Scenario: Submit headless user input

- **WHEN** a caller submits a user input to the runtime
- **THEN** the runtime returns an `AsyncIterable` of `RuntimeEvent` values

#### Scenario: Runtime does not depend on CLI UI

- **WHEN** the runtime package is imported by a test or non-CLI adapter
- **THEN** it MUST NOT require terminal UI modules to initialize

### Requirement: Turn Lifecycle Events

The system SHALL emit structured events for session start, turn start, model output, tool requests, tool completion, turn completion, and errors.

#### Scenario: Successful turn lifecycle

- **WHEN** a model response completes without tool execution
- **THEN** the event stream includes turn start, model output, and turn completion events in order

#### Scenario: Tool turn lifecycle

- **WHEN** a model response requests a registered capability
- **THEN** the event stream includes a tool requested event before the corresponding tool completed event

### Requirement: Runtime Dependency Injection

The runtime SHALL receive model gateway, capability registry, context engine, policy engine, sandbox runtime, and session store dependencies through explicit construction or factory configuration.

#### Scenario: Mock runtime dependencies

- **WHEN** tests construct the runtime with mock dependencies
- **THEN** the runtime uses those dependencies without reading global process state

### Requirement: Separate Application Adapters

The system SHALL keep the CLI application adapter and VSCode extension adapter in separate source directories that both depend on shared runtime packages.

#### Scenario: CLI and VSCode extension are separate

- **WHEN** the framework source tree is created
- **THEN** it contains separate `src/apps/cli` and `src/apps/vscode-extension` directories

#### Scenario: Application adapters depend on runtime

- **WHEN** either application adapter needs agent behavior
- **THEN** it uses shared runtime package contracts instead of importing implementation from the other application adapter

### Requirement: Runtime Interruption Contract

The runtime SHALL expose an interruption mechanism that can cancel an in-progress turn and emit a terminal cancellation or error event.

#### Scenario: Interrupt active turn

- **WHEN** a caller interrupts an active runtime turn
- **THEN** the active turn stops and emits a final event indicating cancellation

### Requirement: Runtime Uses Governed Invocation Boundary

The runtime SHALL be the temporary first execution owner for governed capability invocation until a dedicated execution orchestrator exists, and it SHALL preserve execution envelope, policy, scheduler, bus, trace, audit, and replay boundaries when invoking executable capabilities.

runtime 必须在 dedicated execution orchestrator 出现前作为临时第一 execution owner，并在调用 executable capabilities 时保留 execution envelope、policy、scheduler、bus、trace、audit 和 replay boundaries。

#### Scenario: Runtime invokes model through governed boundary

- **WHEN** runtime needs a model stream, capability execution, command execution, skill activation, hook invocation, MCP call, sandbox job, plugin lifecycle action, or subagent turn
- **THEN** it creates or receives a governed execution envelope rather than allowing application adapters to call the primitive directly

#### Scenario: Direct host bypass is forbidden

- **WHEN** CLI, VSCode, or future server host needs executable work
- **THEN** it calls runtime or protocol endpoints and does not directly invoke model, skill, hook, command, MCP, plugin, sandbox, or capability execution primitives

### Requirement: Kernel-Backed Headless Runtime

The runtime event loop SHALL use the runtime execution kernel as the concrete execution owner for headless turns.

runtime event loop 必须使用 runtime execution kernel 作为 headless turns 的具体 execution owner。

#### Scenario: Headless input enters kernel

- **WHEN** a caller submits headless user input through the runtime package
- **THEN** the runtime delegates executable work to the kernel and streams the kernel's canonical events

#### Scenario: Runtime exposes kernel factory

- **WHEN** tests or adapters import the runtime package
- **THEN** they can create a deterministic kernel-backed runtime without importing CLI or VSCode packages

### Requirement: Runtime Event Ordering

The kernel-backed runtime loop SHALL emit lifecycle, envelope, policy, scheduling, execution, result, and terminal events in a stable order.

kernel-backed runtime loop 必须以稳定顺序输出 lifecycle、envelope、policy、scheduling、execution、result 和 terminal events。

#### Scenario: Successful execution order

- **WHEN** a kernel-backed capability completes successfully
- **THEN** the event stream includes request accepted, envelope created, workflow opened, policy decided, scheduled, started, output or progress, completed, and workflow closed events in order

#### Scenario: Failed execution order

- **WHEN** a kernel-backed capability fails
- **THEN** the event stream includes the same pre-execution events followed by failed and workflow closed events with typed error metadata

### Requirement: Kernel-Only Runtime Event Loop

The runtime event loop SHALL remove default legacy direct execution behavior and use `RuntimeKernel` for all executable work.

runtime event loop 必须移除默认 legacy direct execution behavior，并对所有 executable work 使用 `RuntimeKernel`。

#### Scenario: No direct model stream in runtime turn

- **WHEN** the runtime package handles a user turn
- **THEN** it does not directly invoke the model gateway and instead creates governed kernel invocations for model or capability work

#### Scenario: Compatibility name delegates only

- **WHEN** an exported API keeps a previous ergonomic name such as `runTurn`
- **THEN** that API is only a thin delegate over kernel execution and owns no separate execution state machine

### Requirement: Runtime Uses Resumed Session Id / Runtime 使用恢复的 Session Id

The runtime event loop SHALL allow callers to submit kernel-backed turns with a resumed or forked session id.

runtime event loop 必须允许 caller 使用 resumed 或 forked session id 提交 kernel-backed turns。

#### Scenario: Resumed turn preserves session id / 恢复后的 turn 保留 session id

- **WHEN** a caller resumes a session and submits a new prompt
- **THEN** the runtime kernel invocation uses the resumed session id and appends subsequent runtime events to that session event log
- **中文** 当 caller 恢复 session 并提交新 prompt 时，runtime kernel invocation 必须使用恢复后的 session id，并将后续 runtime events 追加到该 session event log。

#### Scenario: Forked turn uses child session id / 分叉后的 turn 使用 child session id

- **WHEN** a caller forks a parent session and submits a prompt on the child
- **THEN** the runtime kernel invocation uses the child session id and preserves lineage metadata through session events
- **中文** 当 caller 分叉 parent session 并在 child 上提交 prompt 时，runtime kernel invocation 必须使用 child session id，并通过 session events 保留 lineage metadata。

### Requirement: Resume/Fork Preserve Kernel Governance / Resume/Fork 保持 Kernel 治理

Resume and fork-lite SHALL NOT create separate runtime execution paths.

resume 与 fork-lite 不得创建独立 runtime execution paths。

#### Scenario: Resumed execution remains governed / 恢复执行仍受治理

- **WHEN** a resumed or forked session executes model, tool, command, policy, scheduler, sandbox, or capability work
- **THEN** execution still passes through the runtime kernel, execution envelope, policy, scheduler, bus, observability, and replay boundaries
- **中文** 当 resumed 或 forked session 执行 model、tool、command、policy、scheduler、sandbox 或 capability work 时，执行仍必须经过 runtime kernel、execution envelope、policy、scheduler、bus、observability 和 replay boundaries。

#### Scenario: Direct resume bypass fails lint / 直接恢复绕过触发 lint

- **WHEN** host adapter code attempts to mutate session event logs and execute capabilities directly during resume or fork
- **THEN** architecture lint or tests fail before default test suites pass
- **中文** 当 host adapter code 在 resume 或 fork 期间尝试直接修改 session event logs 并直接执行 capabilities 时，architecture lint 或 tests 必须在默认测试通过前失败。

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
