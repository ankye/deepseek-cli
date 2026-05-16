# workflow-orchestration Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Workflow Task Model

The system SHALL define a workflow orchestration layer for user tasks, workflow graphs, steps, dependencies, artifacts, checkpoints, handoff, rollback, retry policy, and completion criteria.

系统必须定义 workflow orchestration layer，管理 user tasks、workflow graphs、steps、dependencies、artifacts、checkpoints、handoff、rollback、retry policy 和 completion criteria。

#### Scenario: Create workflow from user turn

- **WHEN** runtime receives a user turn
- **THEN** the workflow orchestrator can create a workflow with task id, owner agent, session id, initial step, completion criteria, and trace metadata

#### Scenario: Step dependencies are validated

- **WHEN** a workflow graph is registered or resumed
- **THEN** the orchestrator validates step ids, dependencies, cycles, required artifacts, and rollback metadata

### Requirement: Pipeline Execution

The workflow orchestrator SHALL emit structured events for step scheduled, started, blocked, completed, failed, skipped, rolled back, and checkpointed states.

workflow orchestrator 必须为 step scheduled、started、blocked、completed、failed、skipped、rolled back 和 checkpointed states 输出结构化事件。

#### Scenario: Single-turn workflow emits step events

- **WHEN** the first implementation executes a single-turn workflow
- **THEN** it still emits workflow and step events around runtime/model/capability activity

#### Scenario: Workflow uses concurrency orchestrator

- **WHEN** a workflow step executes asynchronous work
- **THEN** it is scheduled through the concurrency orchestrator with task scope, deadline, cancellation, and resource metadata

### Requirement: Checkpoint and Rollback

The workflow orchestrator SHALL integrate checkpoint and rollback metadata with the session store.

workflow orchestrator 必须将 checkpoint 和 rollback metadata 接入 session store。

#### Scenario: Create workflow checkpoint

- **WHEN** a workflow reaches a checkpoint boundary
- **THEN** it records checkpoint metadata with session position, workflow id, step id, artifacts, and rollback strategy

#### Scenario: Rollback is explicit

- **WHEN** a workflow step needs rollback
- **THEN** the orchestrator emits a rollback event and applies only declared rollback actions after policy approval when required

### Requirement: Handoff and Delegation

The workflow model SHALL include handoff and delegation metadata for future sub-agent and multi-agent execution.

workflow model 必须包含 handoff 和 delegation metadata，用于未来 sub-agent 和 multi-agent execution。

#### Scenario: Delegation records scope constraints

- **WHEN** a future workflow delegates a step to another agent
- **THEN** the delegation metadata includes source agent, target agent definition, task summary, scope constraints, approval requirements, and session linkage

### Requirement: Workflow Tests

The framework SHALL include deterministic tests for workflow graph validation, step ordering, checkpoint creation, rollback metadata, and event emission.

框架必须包含 workflow graph validation、step ordering、checkpoint creation、rollback metadata 和 event emission 的确定性测试。

#### Scenario: Workflow replay matches golden events

- **WHEN** a workflow golden trace is replayed
- **THEN** normalized workflow events match the expected sequence

### Requirement: Executable Workflow Nodes

The workflow orchestrator SHALL represent executable capability invocations as typed workflow nodes with dependencies, owner agent, expected artifacts, rollback metadata, checkpoint policy, and execution envelope references.

workflow orchestrator 必须将 executable capability invocations 表示为 typed workflow nodes，并包含 dependencies、owner agent、expected artifacts、rollback metadata、checkpoint policy 和 execution envelope references。

#### Scenario: Workflow plans tool execution

- **WHEN** a user turn requires a tool, command, skill-backed action, MCP call, hook mutation, model call, workspace edit, plugin lifecycle action, or subagent delegation
- **THEN** the workflow graph contains an executable node instead of allowing direct primitive invocation from the host or arbitrary package

#### Scenario: Workflow does not own locks

- **WHEN** an executable workflow node declares resource needs
- **THEN** the workflow records semantic dependencies and resource intent but leaves lock acquisition, rate limits, cancellation, deadlines, and retry budget enforcement to the concurrency scheduler

### Requirement: Minimal Kernel Workflow Boundary

The workflow orchestrator SHALL create a minimal workflow and task boundary for each kernel invocation.

workflow orchestrator 必须为每个 kernel invocation 创建最小 workflow 和 task boundary。

#### Scenario: Create workflow for capability invocation

- **WHEN** the kernel accepts an executable capability request
- **THEN** workflow orchestration records workflow id, task id, owner agent when available, session id when available, step id, capability id, envelope id, trace context, and completion criteria

#### Scenario: Close workflow on terminal result

- **WHEN** the scheduled executable task completes, fails, times out, or is cancelled
- **THEN** workflow orchestration emits a terminal workflow event linked to the same envelope and task

### Requirement: Workflow Defers Execution Enforcement

The workflow orchestrator SHALL not bypass the scheduler for executable work.

workflow orchestrator 不得绕过 scheduler 执行 executable work。

#### Scenario: Workflow records intent only

- **WHEN** a workflow step declares resource or timeout intent
- **THEN** workflow stores the semantic intent and the scheduler enforces queueing, timeout, cancellation, and concurrency

### Requirement: Single Workflow Closure

Workflow orchestration SHALL close each kernel invocation exactly once with a terminal status linked to the same envelope, task, and trace lineage.

workflow orchestration 必须对每个 kernel invocation 只关闭一次，并使用与同一 envelope、task 和 trace lineage 关联的 terminal status。

#### Scenario: Successful invocation closes once

- **WHEN** a kernel invocation completes successfully
- **THEN** exactly one workflow closed event is emitted after capability and scheduler terminal events

#### Scenario: Cancelled invocation closes once

- **WHEN** a kernel invocation is cancelled or timed out
- **THEN** exactly one workflow closed event is emitted with cancelled or timed-out status

### Requirement: Runtime-Owned Tool Pipelines / Runtime 拥有工具管线
Workflow orchestration SHALL represent tool chaining as runtime-owned pipelines with typed steps, declared inputs, artifact references, policy decisions, preflight results, execution results, and replay metadata.

workflow orchestration 必须把工具衔接表示为 runtime-owned pipelines，包含 typed steps、declared inputs、artifact references、policy decisions、preflight results、execution results 与 replay metadata。

#### Scenario: Sequential pipeline routes artifacts / 顺序管线路由 Artifact
- **WHEN** a pipeline reads a file, applies a patch, and runs tests
- **THEN** each step consumes explicit inputs or artifact references and records its own policy, preflight, execution, and evidence records
- **中文** 当 pipeline 读取文件、应用 patch 并运行测试时，每一步必须消费显式 inputs 或 artifact references，并记录自己的 policy、preflight、execution 与 evidence records。

### Requirement: Executors Do Not Call Executors / Executor 不得互调
Capability executors SHALL NOT directly invoke other capability executors; all chaining SHALL go through the runtime pipeline or agent loop.

capability executors 不得直接调用其他 capability executors；所有衔接必须经过 runtime pipeline 或 agent loop。

#### Scenario: Private tool call is rejected / 私下工具调用被拒绝
- **WHEN** an implementation attempts to call another tool executor from inside a tool executor
- **THEN** architecture lint or runtime validation fails with a stable diagnostic
- **中文** 当实现试图在一个 tool executor 内调用另一个 tool executor 时，architecture lint 或 runtime validation 必须以稳定 diagnostic 失败。

### Requirement: Parallel Pipelines Preserve Isolation / 并行管线保持隔离
Parallel pipeline steps SHALL declare independent scopes, resource locks, merge strategy, and conflict behavior before execution.

并行 pipeline steps 必须在执行前声明 independent scopes、resource locks、merge strategy 与 conflict behavior。

#### Scenario: Overlapping write scopes block parallel mutation / 写范围重叠阻止并行修改
- **WHEN** two parallel steps request overlapping write scope
- **THEN** orchestration rejects the parallel plan or serializes the steps with explicit diagnostics
- **中文** 当两个 parallel steps 请求重叠 write scope 时，orchestration 必须拒绝 parallel plan 或以显式 diagnostics 串行化这些 steps。

### Requirement: Stream Pipelines Are Bounded / 流式管线有边界
Streaming pipelines SHALL preserve backpressure, truncation, redaction, cancellation, and replay-safe summaries between steps.

流式 pipelines 必须在 steps 之间保留 backpressure、truncation、redaction、cancellation 与 replay-safe summaries。

#### Scenario: Stream truncation is recorded / 流式截断被记录
- **WHEN** one step streams more output than the next step can accept
- **THEN** orchestration records truncation metadata and passes a bounded artifact reference rather than unbounded raw content
- **中文** 当某一步 stream 的输出超过下一步可接受范围时，orchestration 必须记录 truncation metadata，并传递 bounded artifact reference，而不是无边界 raw content。

### Requirement: Pipeline Families Are Executable Runtime Capabilities / Pipeline Families 是可执行 Runtime Capabilities
The workflow orchestration layer SHALL expose `pipeline.sequence`, `pipeline.parallel`, `pipeline.artifact-routing`, and `pipeline.stream` as runtime-owned executable capabilities.

workflow orchestration layer 必须把 `pipeline.sequence`、`pipeline.parallel`、`pipeline.artifact-routing` 与 `pipeline.stream` 暴露为 runtime-owned executable capabilities。

#### Scenario: Sequential pipeline records every governed step / 顺序管线记录每个受治理 Step
- **WHEN** a sequential pipeline reads a file, applies a patch, and runs tests
- **THEN** every step records policy, preflight, execution, evidence, replay metadata, and bounded artifact references
- **中文** 当顺序管线读取文件、应用 patch 并运行测试时，每一步都必须记录 policy、preflight、execution、evidence、replay metadata 与 bounded artifact references。

### Requirement: Private Executor Chaining Is Rejected / 私下 Executor 互调被拒绝
Tool executors SHALL NOT call other tool executors directly; all composition SHALL go through runtime pipelines or the agent loop.

tool executors 不得直接调用其他 tool executors；所有组合必须通过 runtime pipelines 或 agent loop。

#### Scenario: Lint catches executor-to-executor call / Lint 捕获 Executor 互调
- **WHEN** a tool executor imports or resolves another executor to run it privately
- **THEN** architecture lint or runtime validation fails with a stable diagnostic
- **中文** 当 tool executor 导入或解析另一个 executor 并私下运行时，architecture lint 或 runtime validation 必须以稳定 diagnostic 失败。

