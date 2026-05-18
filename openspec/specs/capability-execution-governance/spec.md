# capability-execution-governance Specification

## Purpose
TBD - created by archiving change design-unified-capability-orchestration. Update Purpose after archive.
## Requirements
### Requirement: Capability Execution Levels

The platform SHALL classify every capability contribution as metadata-only, projectable, executable, or scheduled before it can affect runtime behavior.

平台必须在任何 capability contribution 影响 runtime behavior 前，将其分类为 metadata-only、projectable、executable 或 scheduled。

#### Scenario: Metadata remains inert

- **WHEN** a plugin manifest, skill manifest, agent definition, command manifest, hook manifest, MCP server manifest, model profile, workflow template, renderer contribution, or config fragment is discovered
- **THEN** the platform records it as metadata-only until an owning subsystem projects or executes it

#### Scenario: Side-effecting work is scheduled

- **WHEN** a capability can mutate state, call external resources, stream model output, execute hooks, call MCP, run sandboxed work, start a subagent, or run longer than one synchronous projection step
- **THEN** it MUST be treated as executable or scheduled work rather than metadata-only registration

### Requirement: Unified Execution Envelope

The platform SHALL normalize every executable or scheduled capability invocation into an execution envelope before execution starts.

平台必须在执行开始前，将每个 executable 或 scheduled capability invocation 规范化为 execution envelope。

#### Scenario: Envelope carries governance metadata

- **WHEN** a capability invocation is created
- **THEN** its envelope includes invocation id, capability or contribution id, version, kind, caller, parent invocation id, session id when available, workflow id when available, task id when available, agent id when available, input/output schema references, redaction class, provenance, trust, permissions, side-effect level, policy context, approval requirement, sandbox profile, resource locks, timeout, deadline, cancellation metadata, retry policy, idempotency metadata, trace context, telemetry metadata, and replay policy

#### Scenario: Envelope is stable across hosts

- **WHEN** CLI, VSCode, tests, CI, or future server mode invokes the same governed capability
- **THEN** host-specific UI state does not change the canonical envelope shape

### Requirement: Governed Execution Pipeline

The platform SHALL route executable and scheduled capability invocations through workflow orchestration, concurrency scheduling, policy, approval, sandbox, runtime message bus, observability, audit, and regression boundaries according to their constraints.

平台必须根据 capability constraints，将 executable 和 scheduled capability invocations 路由通过 workflow orchestration、concurrency scheduling、policy、approval、sandbox、runtime message bus、observability、audit 和 regression boundaries。

#### Scenario: Safe read-only execution

- **WHEN** a read-only synchronous capability has no external trust boundary, no side effect, no long-running work, and no special resource requirement
- **THEN** the platform can execute it with a minimal envelope and trace while still recording the result event

#### Scenario: Privileged execution

- **WHEN** a capability requires filesystem mutation, process execution, network access, memory write, cache mutation, workspace edit, plugin lifecycle action, MCP external call, or subagent delegation
- **THEN** the platform evaluates policy, approval, sandbox, resource locks, timeout, retry safety, audit, and replay metadata before execution

### Requirement: Direct Execution Boundary

No executable capability SHALL bypass the governed execution pipeline except inside approved execution owners, deterministic fakes, tests, or the package that owns the execution primitive.

任何 executable capability 都不得绕过 governed execution pipeline，除非位于 approved execution owners、deterministic fakes、tests 或拥有该 execution primitive 的 package 内。

#### Scenario: Application adapter cannot call primitive directly

- **WHEN** a CLI, VSCode, future server, or non-owner package needs a skill, hook, command, MCP call, model stream, sandbox job, plugin lifecycle action, or capability executor
- **THEN** it calls the governed runtime or execution pipeline instead of directly invoking the primitive subsystem

#### Scenario: Architecture lint rejects bypass

- **WHEN** source code outside approved execution owners, tests, deterministic fakes, or primitive-owning packages directly invokes a governed execution primitive
- **THEN** architecture lint fails with a stable rule id and file location

### Requirement: Canonical Execution Events

The platform SHALL expose canonical execution events that hosts can render without owning execution state machines.

平台必须暴露 canonical execution events，使 host 可以渲染状态但不拥有 execution state machines。

#### Scenario: Host renders canonical state

- **WHEN** a capability invocation progresses through requested, policy checked, approval required, scheduled, started, progress, completed, failed, cancelled, rolled back, or replay recorded states
- **THEN** CLI, VSCode, tests, CI, and future server mode consume the same canonical event stream and project it into host-specific rendering

### Requirement: Replayable Invocation Decisions

The platform SHALL persist enough redacted execution envelope, decision, event, result, and failure metadata for deterministic replay.

平台必须持久化足够的脱敏 execution envelope、decision、event、result 和 failure metadata，以支持 deterministic replay。

#### Scenario: Replay detects behavior drift

- **WHEN** a governed capability scenario is replayed
- **THEN** the regression harness can compare normalized envelopes, policy decisions, scheduled task events, bus records, outputs, errors, and audit summaries without live external services

### Requirement: Implemented Execution Envelope Builder

The platform SHALL provide an implemented execution envelope builder that creates stable envelopes for runtime kernel invocations.

平台必须提供已实现的 execution envelope builder，为 runtime kernel invocations 创建稳定 envelopes。

#### Scenario: Build minimal envelope

- **WHEN** the kernel receives a read-only built-in capability invocation
- **THEN** the builder creates an envelope with invocation id, capability id, version, kind, caller, session id when available, workflow id when available, policy context, side-effect level, timeout, cancellation metadata, trace context, and replay policy

#### Scenario: Validate envelope before execution

- **WHEN** an envelope is missing required governance metadata
- **THEN** validation fails before policy evaluation or scheduler submission

### Requirement: Kernel Invocation Result Contract

The governed execution pipeline SHALL normalize capability execution results into typed success, failure, cancellation, and timeout outcomes.

governed execution pipeline 必须将 capability execution results 规范化为 typed success、failure、cancellation 和 timeout outcomes。

#### Scenario: Normalize successful result

- **WHEN** a built-in capability returns successfully
- **THEN** the kernel publishes a completed event containing normalized output metadata, redaction class, trace id, and replay snapshot reference when available

#### Scenario: Normalize timeout result

- **WHEN** scheduler timeout cancels an invocation
- **THEN** the kernel publishes a timeout or cancelled outcome with envelope id, timeout metadata, and no partial host-owned state

### Requirement: Strict Execution Envelope Validation

The execution envelope validator SHALL validate required fields, field types, enum values, timeout bounds, trace shape, schema metadata, policy metadata, cancellation metadata, replay metadata, and idempotency metadata before scheduling.

execution envelope validator 必须在 scheduling 前校验 required fields、field types、enum values、timeout bounds、trace shape、schema metadata、policy metadata、cancellation metadata、replay metadata 和 idempotency metadata。

#### Scenario: Invalid timeout is rejected before policy

- **WHEN** an envelope declares a non-positive, non-finite, or out-of-range timeout
- **THEN** validation fails before policy evaluation or scheduler submission

#### Scenario: Malformed trace is rejected before policy

- **WHEN** an envelope lacks trace id, span id, correlation id, or required session linkage
- **THEN** validation fails before policy evaluation or scheduler submission

### Requirement: Abort-Aware Capability Context

Governed capability executors SHALL receive a context that includes envelope, trace, abort signal, cancellation metadata, and immutable execution metadata.

governed capability executors 必须接收包含 envelope、trace、abort signal、cancellation metadata 和 immutable execution metadata 的 context。

#### Scenario: Capability observes cancellation

- **WHEN** a capability invocation is cancelled or timed out
- **THEN** the executor can observe the aborted signal and must not continue side-effecting work

### Requirement: Tool Intent Preflight

The governed execution pipeline SHALL validate and optionally repair normalized model tool-call intents before creating an execution envelope or scheduling tool execution.

 governed execution pipeline 必须在创建 execution envelope 或调度 tool execution 前，对 normalized model tool-call intents 进行校验，并在安全时执行修复。

#### Scenario: Repair safe workspace path

- **WHEN** a model tool-call intent contains a workspace file path with provider-produced slash direction, redundant current-directory prefix, or relative path notation
- **THEN** preflight resolves it through the platform path contract, keeps it inside the workspace boundary, records the repair action, and returns repaired input for governed execution

#### Scenario: Reject unsafe path

- **WHEN** a model tool-call intent contains an absolute path, parent traversal, home-directory expansion, or platform-incompatible path that cannot be proven inside the workspace
- **THEN** preflight rejects the intent with typed diagnostics before policy evaluation or scheduler submission

#### Scenario: Reject unknown tool

- **WHEN** a normalized tool-call intent names a capability that is not model-visible or executable
- **THEN** preflight rejects the intent and does not create an execution envelope

#### Scenario: Preflight emits replayable metadata

- **WHEN** preflight repairs or rejects an intent
- **THEN** the result includes original input, repaired input when available, repair actions, diagnostics, platform metadata, workspace root, and replay-safe redaction metadata

### Requirement: Provider-Specific Tool Intent Profiles

The governed execution pipeline SHALL support provider-specific preflight profiles for deterministic tool-call repair while preserving the mandatory common safety core.

governed execution pipeline 必须支持 provider-specific preflight profiles，用于 deterministic tool-call repair，同时保留强制 common safety core。

#### Scenario: Provider profile repairs shape before safety checks

- **WHEN** a provider emits tool-call intent with provider-specific aliases, nested argument JSON, or provider-specific path field names
- **THEN** preflight applies the matching provider profile first and then runs common model-visible tool, workspace path, platform, policy, and replay checks

#### Scenario: Provider profile cannot weaken safety

- **WHEN** a provider profile attempts to repair input that remains absolute, parent-traversing, outside the workspace, unknown, or platform-unsafe
- **THEN** common preflight rejects the intent before envelope creation or scheduler submission

#### Scenario: Provider profile is recorded

- **WHEN** provider-specific repair is applied
- **THEN** preflight result records provider id, profile id when available, repair actions, and diagnostics for replay and audit

### Requirement: Core Tools Use Governed Execution / 核心工具使用受治理执行

Every executable core coding tool SHALL be invoked through execution envelope creation, policy evaluation, scheduler submission, platform provider context, runtime message bus events, and replayable session records.

每个 executable core coding tool 必须通过 execution envelope creation、policy evaluation、scheduler submission、platform provider context、runtime message bus events 和 replayable session records 调用。

#### Scenario: Tool invocation enters runtime kernel / 工具调用进入 runtime kernel

- **WHEN** a host, model loop, or test invokes a core coding tool
- **THEN** the invocation enters `RuntimeKernel.execute` or an equivalent governed kernel entry point before the tool executor runs
- **中文** 当 host、model loop 或 test 调用 core coding tool 时，invocation 必须在 tool executor 运行前进入 `RuntimeKernel.execute` 或等价受治理 kernel entry point。

#### Scenario: Tool denial prevents scheduling / 工具拒绝阻止调度

- **WHEN** policy denies a write, shell, test, or platform-unavailable core tool invocation
- **THEN** no scheduler task is created and the canonical event stream includes a typed rejection
- **中文** 当 policy 拒绝 write、shell、test 或 platform-unavailable core tool invocation 时，不得创建 scheduler task，canonical event stream 必须包含 typed rejection。

### Requirement: Envelope Declares Secret And Sandbox Requirements / Envelope 声明 Secret 与 Sandbox 要求

Governed execution envelopes SHALL declare secret exposure, redaction class, resource scope, side-effect scope, sandbox requirements, and audit metadata before execution.

governed execution envelopes 必须在 execution 前声明 secret exposure、redaction class、resource scope、side-effect scope、sandbox requirements 和 audit metadata。

#### Scenario: Capability manifest contributes sandbox metadata / Capability Manifest 贡献 Sandbox 元数据

- **WHEN** a capability is registered as model-visible or executable
- **THEN** its manifest declares side effect level, permissions, sandbox requirements, model visibility, executor visibility, and redaction expectations
- **中文** 当 capability 注册为 model-visible 或 executable 时，其 manifest 必须声明 side effect level、permissions、sandbox requirements、model visibility、executor visibility 和 redaction expectations。

#### Scenario: Unsafe envelope is rejected / 不安全 Envelope 被拒绝

- **WHEN** an envelope lacks required secret or sandbox metadata for a side-effecting invocation
- **THEN** runtime rejects it before policy or scheduler execution
- **中文** 当 side-effecting invocation 的 envelope 缺少 required secret 或 sandbox metadata 时，runtime 必须在 policy 或 scheduler execution 前拒绝它。

### Requirement: MCP Gateway Governed Boundary / MCP Gateway 受治理边界

MCP executable calls and resource reads SHALL carry governed metadata before they are consumed by runtime, skills, hooks, commands, agents, plugins, hosts, or future servers.

MCP executable calls 和 resource reads 在被 runtime、skills、hooks、commands、agents、plugins、hosts 或未来 servers 消费前，必须携带受治理 metadata。

#### Scenario: MCP call declares governance metadata / MCP call 声明治理元数据

- **WHEN** an MCP tool call or resource read request is created
- **THEN** it declares schema version, caller, server id, namespace, trust, permissions, timeout, redaction, transport, audit metadata, trace metadata when present, and replay policy before handler dispatch
- **中文** 当 MCP tool call 或 resource read request 被创建时，它必须在 handler dispatch 前声明 schema version、caller、server id、namespace、trust、permissions、timeout、redaction、transport、audit metadata、可选 trace metadata 和 replay policy。

#### Scenario: MCP direct bypass fails lint / MCP 直接绕过触发 lint

- **WHEN** a host adapter, feature package, provider package, skill, hook, plugin, or extension package calls MCP execution primitives outside the runtime/governed owner path
- **THEN** architecture lint fails with a stable governed execution rule id
- **中文** 当 host adapter、feature package、provider package、skill、hook、plugin 或 extension package 在 runtime/governed owner path 外调用 MCP execution primitives 时，architecture lint 必须以稳定 governed execution rule id 失败。

### Requirement: Model-Requested Capability Governance / 模型请求能力治理

Every model-requested executable capability SHALL pass through execution envelope creation, capability lookup, schema validation, policy decision, scheduler admission, timeout control, retry policy, result evidence, and trace publication before the agent loop can continue.

每个模型请求的 executable capability 都必须经过 execution envelope creation、capability lookup、schema validation、policy decision、scheduler admission、timeout control、retry policy、result evidence 和 trace publication，agent loop 才能继续。

#### Scenario: Capability execution is admitted before start / 能力执行先准入再开始

- **WHEN** runtime receives a valid model tool intent for an executable capability
- **THEN** governance creates an execution envelope, validates inputs, obtains a policy decision, admits the work through scheduler, and only then starts execution
- **中文** 当 runtime 收到有效的模型 tool intent 并指向 executable capability 时，governance 必须创建 execution envelope、校验 inputs、取得 policy decision、通过 scheduler 准入，然后才开始执行。

#### Scenario: Policy denial returns model feedback / Policy 拒绝返回模型反馈

- **WHEN** policy denies a model-requested capability
- **THEN** governance emits denial evidence and returns a bounded provider-neutral tool result or terminal event according to runtime policy without executing the capability
- **中文** 当 policy 拒绝模型请求的 capability 时，governance 必须发出 denial evidence，并按 runtime policy 返回有界 provider-neutral tool result 或 terminal event，且不得执行该 capability。

### Requirement: Agent Loop Retry Governance / Agent Loop 重试治理

Retries in the agent loop SHALL be governed by retry policy, idempotency metadata, side-effect level, timeout budget, and trace continuity.

agent loop 中的 retries 必须受 retry policy、idempotency metadata、side-effect level、timeout budget 和 trace continuity 治理。

#### Scenario: Non-idempotent tool is not retried automatically / 非幂等工具不自动重试

- **WHEN** a non-idempotent write or shell capability fails after starting execution
- **THEN** governance does not retry automatically and emits failure evidence with checkpoint or rollback metadata when available
- **中文** 当非幂等 write 或 shell capability 在开始执行后失败时，governance 不得自动重试，并必须发出 failure evidence，适用时包含 checkpoint 或 rollback metadata。

#### Scenario: Retry preserves trace / 重试保留 trace

- **WHEN** an idempotent model request or read-only capability is retried
- **THEN** every attempt shares the same parent trace id and records attempt number, reason, delay, and terminal attempt status
- **中文** 当幂等 model request 或 read-only capability 被重试时，每次 attempt 必须共享同一 parent trace id，并记录 attempt number、reason、delay 和 terminal attempt status。

### Requirement: Execution Profiles Are Governed Envelope Metadata / Execution Profile 是受治理 Envelope 元数据

Governed execution envelopes SHALL carry execution profile metadata for process-like capabilities, including interactivity, environment policy, timeout class, output bounds, and replay policy.

受治理 execution envelopes 必须为 process-like capabilities 携带 execution profile metadata，包括 interactivity、environment policy、timeout class、output bounds 与 replay policy。

#### Scenario: Noninteractive profile is evaluated before scheduling / 调度前评估 Noninteractive Profile

- **WHEN** a shell, test, git, or external command capability requests a noninteractive profile
- **THEN** policy and sandbox evaluate the requested interactivity level, environment additions, cwd, command summary, timeout, and output bounds before scheduling
- **中文** 当 shell、test、git 或 external command capability 请求 noninteractive profile 时，policy 与 sandbox 必须在调度前评估 requested interactivity level、environment additions、cwd、command summary、timeout 与 output bounds。

#### Scenario: Adapter cannot bypass governed execution / Adapter 不得绕过受治理执行

- **WHEN** an evaluation adapter needs to run a command, check an artifact, or invoke the CLI
- **THEN** it either calls the published CLI surface or a governed runtime capability and records the envelope evidence
- **AND** it does not call lower-level primitives to create product behavior that the CLI cannot reproduce
- **中文** 当 evaluation adapter 需要运行命令、检查 artifact 或调用 CLI 时，必须调用已发布 CLI surface 或受治理 runtime capability 并记录 envelope evidence；不得通过 lower-level primitives 创造 CLI 无法复现的产品行为。

### Requirement: Hidden Prompt Rules Are Not Capability Execution / 隐藏 Prompt 规则不是 Capability Execution

Capability execution governance SHALL treat adapter-only hidden prompt rules as evaluation diagnostics, not as executable product capability.

capability execution governance 必须将 adapter-only hidden prompt rules 视为 evaluation diagnostics，而不是 executable product capability。

#### Scenario: Prompt-only workaround is scored as gap / 仅 Prompt 绕过计为缺口

- **WHEN** a benchmark succeeds only because an adapter injected hidden task-specific instructions outside prompt assembly contracts
- **THEN** delivery evidence records a product-layer gap and the scorecard does not mark the corresponding capability complete
- **中文** 当 benchmark 只有因为 adapter 在 prompt assembly contracts 外注入隐藏任务专用指令才成功时，delivery evidence 必须记录 product-layer gap，scorecard 不得将对应 capability 标记为完成。

