# runtime-event-loop Specification

## Purpose
Define runtime event loop requirements for turn phases, tool feedback, model continuation, repair, cancellation, and terminal events.

定义 runtime event loop 对 turn phases、tool feedback、model continuation、repair、cancellation 与 terminal events 的要求。

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

The runtime SHALL expose an interruption mechanism that can cancel an in-progress turn via an `AbortSignal` on `AgentLoopRequest` and SHALL emit a terminal `agent.loop.cancelled` event when the signal fires.

runtime 必须通过 `AgentLoopRequest.signal`（`AbortSignal`）暴露取消机制，信号触发时必须发出终端事件 `agent.loop.cancelled`。

#### Scenario: Interrupt active turn via signal

- **WHEN** a caller passes an `AbortSignal` that is aborted while `runAgentLoop` is mid-turn
- **THEN** the active turn stops at the next yield boundary, any in-flight model stream or tool execution is aborted, and the loop emits a single terminal `agent.loop.cancelled` event with `status: "cancelled"`, `reason: "user-cancelled"`, plus the accumulated `iterations`, `toolCalls`, and `assistantText`
- **中文** 当调用者传入的 `AbortSignal` 在 `runAgentLoop` 运行中被 abort 时，活跃 turn 必须在下一个 yield 边界停止，进行中的 model stream 或 tool execution 必须取消，并在最后发出一个终态事件 `agent.loop.cancelled`，字段包含 `status: "cancelled"`、`reason: "user-cancelled"`、累计的 `iterations`、`toolCalls` 与 `assistantText`。

#### Scenario: Cancelled turn persists partial events

- **WHEN** an abort terminates a turn after some events have been emitted
- **THEN** every event up to and including `agent.loop.cancelled` is recorded via the runtime adapter so session resume sees the partial turn, no `agent.loop.completed` or `agent.loop.failed` is emitted for the same turn
- **中文** 当 abort 在部分事件已发出后终止一个 turn 时，包括 `agent.loop.cancelled` 在内的所有事件必须经 runtime adapter 记录，session resume 能看到该半截 turn；同一 turn 不得再发 `agent.loop.completed` 或 `agent.loop.failed`。

#### Scenario: Signal already aborted before first iteration

- **WHEN** `runAgentLoop` is called with a signal that is already aborted
- **THEN** the loop emits `agent.loop.started`, then `agent.loop.cancelled` with zero iterations and empty `assistantText`, and returns without dispatching to the model
- **中文** 当 `runAgentLoop` 被调用时传入已经 abort 的 signal，loop 必须发 `agent.loop.started`，再发 iterations=0 且 `assistantText` 为空的 `agent.loop.cancelled`，且不得派发给 model。

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

Runtime SHALL fail closed when projection returns a hard budget rejection, unsupported schema, unsafe redaction state, corrupted projection evidence, or live tool continuation would exceed the configured context/tool feedback budget.

runtime 在 projection 返回 hard budget rejection、unsupported schema、unsafe redaction state、corrupted projection evidence，或 live tool continuation 会超过 configured context/tool feedback budget 时，必须 fail closed。

#### Scenario: Rejected projection emits terminal event

- **WHEN** projection is rejected before model dispatch
- **THEN** runtime emits a typed terminal event and does not call the model gateway

#### Scenario: Tool feedback budget blocks continuation / 工具反馈预算阻止继续

- **WHEN** accumulated tool feedback would exceed the continuation budget
- **THEN** runtime emits a typed terminal event and does not send another live model request
- **中文** 当累计 tool feedback 会超过 continuation budget 时，runtime 必须发出 typed terminal event，且不得发送另一个 live model request。

### Requirement: Runtime Preserves Kernel Governance During Projection / Runtime 在 Projection 中保持 Kernel 治理

Projection SHALL be represented in runtime events and traces without creating a separate execution state machine.

projection 必须体现在 runtime events 与 traces 中，且不得创建独立 execution state machine。

#### Scenario: Projection events are correlated / Projection 事件可关联

- **WHEN** projection runs for a turn
- **THEN** projection events share the turn correlation id, session id, trace context, and redaction metadata
- **中文** 当 projection 为一个 turn 运行时，projection events 必须共享 turn correlation id、session id、trace context 和 redaction metadata。

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

### Requirement: Runtime Owns Model Tool Iteration / Runtime 拥有模型工具迭代

The runtime event loop SHALL own the complete model-tool iteration for agent turns and SHALL NOT delegate loop state to CLI, VSCode, server adapters, provider adapters, hooks, skills, MCP servers, or plugins.

runtime event loop 必须拥有 agent turns 的完整 model-tool iteration，且不得把 loop state 委托给 CLI、VSCode、server adapters、provider adapters、hooks、skills、MCP servers 或 plugins。

#### Scenario: Runtime repeats after tool result / Runtime 在工具结果后继续迭代

- **WHEN** a model response requests a tool and the governed execution returns a result
- **THEN** runtime appends a provider-neutral tool result message to the turn context and dispatches the next model request through the model gateway
- **中文** 当 model response 请求工具且受治理执行返回结果时，runtime 必须把 provider-neutral tool result message 追加到 turn context，并通过 model gateway 派发下一次 model request。

#### Scenario: Host does not execute loop / Host 不执行 loop

- **WHEN** CLI or VSCode starts an agent turn
- **THEN** it submits user input to runtime and renders returned events without directly controlling model-tool iteration
- **中文** 当 CLI 或 VSCode 启动 agent turn 时，它只向 runtime 提交 user input 并渲染返回 events，不得直接控制 model-tool iteration。

### Requirement: Runtime Emits Canonical Agent Loop Events / Runtime 发出标准 Agent Loop Events

The runtime event loop SHALL emit canonical events for session lifecycle, turn lifecycle, model request, model output, reasoning output, tool intent, tool repair, tool preflight, tool execution, tool result, retry, cancellation, error, and terminal completion.

runtime event loop 必须为 session lifecycle、turn lifecycle、model request、model output、reasoning output、tool intent、tool repair、tool preflight、tool execution、tool result、retry、cancellation、error 和 terminal completion 发出 canonical events。

#### Scenario: Tool turn event order is stable / 工具 turn 事件顺序稳定

- **WHEN** a turn contains one model-requested tool execution
- **THEN** runtime emits turn started, model requested, model output or reasoning, tool intent, tool preflight, tool execution started, tool result, model requested again, assistant output, and turn completed in stable order
- **中文** 当 turn 包含一次模型请求的工具执行时，runtime 必须按稳定顺序发出 turn started、model requested、model output 或 reasoning、tool intent、tool preflight、tool execution started、tool result、再次 model requested、assistant output 和 turn completed。

#### Scenario: Terminal event closes every turn / 每个 turn 都有终态事件

- **WHEN** an agent turn succeeds, fails, times out, or is cancelled
- **THEN** runtime emits exactly one terminal turn event with status, typed reason, trace id, and replay metadata
- **中文** 当 agent turn 成功、失败、超时或取消时，runtime 必须发出恰好一个 terminal turn event，包含 status、typed reason、trace id 和 replay metadata。

### Requirement: Runtime Bounds Agent Loop Iteration / Runtime 限制 Agent Loop 迭代

The runtime event loop SHALL enforce configured limits for maximum model iterations, maximum tool calls per turn, total turn duration, tool timeout, output size, retry attempts, and token or budget metadata before and during execution.

runtime event loop 必须在执行前与执行期间强制 maximum model iterations、maximum tool calls per turn、total turn duration、tool timeout、output size、retry attempts 以及 token 或 budget metadata 限制。

#### Scenario: Iteration limit fails closed / 迭代限制安全失败

- **WHEN** a model keeps requesting tools beyond the configured maximum iterations
- **THEN** runtime stops the loop and emits a typed iteration-limit terminal event without scheduling further tools
- **中文** 当模型持续请求工具并超过配置的 maximum iterations 时，runtime 必须停止 loop 并发出 typed iteration-limit terminal event，且不得继续调度工具。

### Requirement: Runtime Preserves Reasoning Across Tool Turns / Runtime 跨工具回合保留 Reasoning

The runtime agent loop SHALL accumulate per-iteration reasoning text emitted by the model provider and attach it to the assistant chat message that records the tool call, so the continuation request carries the reasoning required by thinking-mode providers. The runtime SHALL emit a typed `model.reasoning.persisted` event exactly when reasoning is attached, reporting the iteration number, byte length, and redaction tag, without emitting the reasoning text itself.

runtime agent loop 必须按 iteration 累积 model provider 发出的 reasoning 文本，并附加到记录 tool call 的 assistant chat message 上，让 continuation 请求携带 thinking-mode provider 所需的 reasoning。Runtime 在 reasoning 被附加时必须发出 typed `model.reasoning.persisted` 事件，携带 iteration、byte length 和 redaction tag，不得携带 reasoning 文本本身。

#### Scenario: Reasoning persists into continuation history / Reasoning 进入 continuation 历史

- **WHEN** the model emits one or more reasoning chunks and then a tool call in the same iteration
- **THEN** the assistant chat message recording the tool call carries `reasoningContent` equal to the concatenated reasoning text, and the next provider request body includes that reasoning
- **中文** 当模型在同一 iteration 中发出一个或多个 reasoning chunk 后紧跟一次 tool call 时，记录该 tool call 的 assistant chat message 必须携带与拼接 reasoning 相等的 `reasoningContent`，下一次 provider 请求 body 必须包含该 reasoning。

#### Scenario: Persistence event fires once per persisted iteration / 持久化事件每次持久化 iteration 触发一次

- **WHEN** reasoning is attached to an assistant chat message for a given iteration
- **THEN** the runtime emits exactly one `model.reasoning.persisted` event for that iteration with `{ iteration, byteLength, redaction }` fields and no raw reasoning text
- **中文** 当某个 iteration 的 reasoning 被附加到 assistant chat message 时，runtime 必须对该 iteration 发出恰好一个 `model.reasoning.persisted` 事件，字段为 `{ iteration, byteLength, redaction }`，不得包含 reasoning 原文。

#### Scenario: Non-thinking turns emit no persistence event / 非 thinking 回合不触发持久化事件

- **WHEN** an iteration contains no reasoning chunks
- **THEN** no `model.reasoning.persisted` event is emitted and the assistant message carries no `reasoningContent`
- **中文** 当某个 iteration 没有 reasoning chunk 时，不得发出 `model.reasoning.persisted` 事件，且 assistant message 不得携带 `reasoningContent`。

### Requirement: Runtime Invokes Lifecycle Hooks / Runtime 触发生命周期 Hook

The runtime SHALL invoke `deps.hooks.invokeHooks` at canonical lifecycle points during each agent turn and SHALL interpret the hook invocation result to gate model dispatch, tool execution, and turn termination according to the hook failure policy.

runtime 必须在每个 agent turn 的规范生命周期点调用 `deps.hooks.invokeHooks`,并根据 hook failure policy 处理 invocation 结果,以此门控 model 分发、tool 执行与 turn 终止。

#### Scenario: Runtime fires hooks at the five wired points / 五个接线点触发

- **WHEN** `runAgentLoop` executes a turn
- **THEN** it SHALL invoke hooks at `user-input.before` once per turn, at `model-call.before` and `model-call.after` once per model iteration, and at `tool-execution.before` / `tool-execution.after` once per tool call, using the hook invocation schemaVersion, trace, and sessionId consistent with the current turn
- **中文** 当 `runAgentLoop` 执行 turn 时,必须在 `user-input.before`(每 turn 一次)、`model-call.before` / `model-call.after`(每次 model iteration 各一次)、`tool-execution.before` / `tool-execution.after`(每次 tool call 各一次)调用 hooks,使用与当前 turn 一致的 invocation schemaVersion、trace、sessionId。

#### Scenario: Blocking hook at user-input causes blocked turn / user-input block 产生被阻塞 turn

- **WHEN** a user-input.before hook returns blocked status
- **THEN** the runtime SHALL emit `agent.loop.failed` with `reason: "blocked-by-hook"` and SHALL NOT call `deps.models.stream` for that turn
- **中文** 当 user-input.before 的 hook 返回 blocked 时,runtime 必须发 `agent.loop.failed`(`reason: "blocked-by-hook"`)且不得为该 turn 调用 `deps.models.stream`。

#### Scenario: Blocking hook at model-call emits model.blocked / model-call block 发 model.blocked

- **WHEN** a model-call.before hook returns blocked status
- **THEN** the runtime SHALL emit a `model.blocked` event and a terminal `agent.loop.failed` with `reason: "blocked-by-hook"`, without issuing the model stream call
- **中文** 当 model-call.before 的 hook 返回 blocked 时,runtime 必须发 `model.blocked` 事件和终态 `agent.loop.failed`(`reason: "blocked-by-hook"`),且不发起 model stream 调用。

#### Scenario: Blocking hook at tool-execution denies the tool / tool-execution block 拒绝工具

- **WHEN** a tool-execution.before hook returns blocked status
- **THEN** the runtime SHALL skip that tool's `kernel.execute` call, synthesize a `model.tool.result` with feedback status `denied`, and continue executing subsequent iterations within the same turn
- **中文** 当 tool-execution.before 的 hook 返回 blocked 时,runtime 必须跳过该 tool 的 `kernel.execute`,合成一条 feedback status 为 `denied` 的 `model.tool.result`,并继续该 turn 的后续迭代。

#### Scenario: Default continue policy does not gate the turn / 默认 continue 策略不门控 turn

- **WHEN** hooks with `failurePolicy` other than `block` fail, time out, or are absent
- **THEN** the runtime proceeds past the lifecycle point, records diagnostics in the `hooks.invoked` event, and does not alter turn termination
- **中文** 当 `failurePolicy` 非 `block` 的 hook 失败、超时或不存在时,runtime 必须继续跨过该生命周期点,把诊断记在 `hooks.invoked` 事件里,不改变 turn 终态。

### Requirement: Scoped Agent Event-Loop Handoff / Scoped Agent Event-loop Handoff

The runtime event loop SHALL enforce agent scope, cancellation, timeout, and quota handoffs before running subagent work.

Runtime event loop 在运行 subagent work 前必须执行 agent scope、cancellation、timeout 与 quota handoffs。

#### Scenario: Event loop denies out-of-scope agent work / Event Loop 拒绝越界 Agent Work

- **WHEN** a subagent task is scheduled outside its namespace or quota
- **THEN** the event loop rejects or pauses the task with a stable diagnostic
- **中文** 当 subagent task 被调度到 namespace 或 quota 外时，event loop 必须用稳定 diagnostic 拒绝或暂停该任务。

### Requirement: Runtime Builds Model Requests From Pipeline / Runtime 从管道构建模型请求

The runtime event loop SHALL build model requests from the layered context pipeline so stable upstream blocks remain ordered and volatile current-turn content stays at the tail.

Runtime event loop 必须从分层 context pipeline 构建模型请求，使稳定上游 blocks 保持有序，易变 current-turn content 保持在尾部。

#### Scenario: Turn assembly preserves prefix / 回合组装保持前缀

- **WHEN** two turns share the same kernel and project pipeline blocks
- **THEN** runtime model request assembly preserves identical upstream message/section ordering before appending new session or current-turn blocks
- **中文** 当两个 turn 共享相同 kernel 与 project pipeline blocks 时，runtime 模型请求组装必须在追加新的 session 或 current-turn blocks 前保持相同上游 message/section ordering。

#### Scenario: Pipeline evidence is emitted / 管道证据被发出

- **WHEN** runtime dispatches a model request
- **THEN** it emits replay-safe evidence containing pipeline fingerprint, per-layer prefix hashes, included block counts, excluded block counts, and cache hint summary
- **中文** 当 runtime dispatch 模型请求时，必须发出可 replay evidence，包含 pipeline fingerprint、按层 prefix hashes、included block counts、excluded block counts 与 cache hint summary。

### Requirement: Tool Result Projection Keeps Stable Prefix Clean / 工具结果投影保持稳定前缀清洁

The runtime event loop SHALL route raw tool results to current-turn feedback or artifact storage and route only bounded summaries or references into stable session pipeline blocks.

Runtime event loop 必须将 raw tool results 路由到 current-turn feedback 或 artifact storage，并且只将有界 summary 或 references 路由到稳定 session pipeline blocks。

#### Scenario: Raw output does not enter stable layer / Raw Output 不进入稳定层

- **WHEN** a tool returns large stdout, stderr, file content, or binary/artifact references
- **THEN** runtime excludes raw unbounded content from kernel, project, and stable session prefix layers and records bounded evidence instead
- **中文** 当 tool 返回大型 stdout、stderr、file content 或 binary/artifact references 时，runtime 必须将 raw unbounded content 排除在 kernel、project 与稳定 session prefix layers 之外，并记录有界 evidence。

