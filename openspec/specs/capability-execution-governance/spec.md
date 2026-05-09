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

