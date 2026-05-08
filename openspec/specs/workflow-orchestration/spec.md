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

