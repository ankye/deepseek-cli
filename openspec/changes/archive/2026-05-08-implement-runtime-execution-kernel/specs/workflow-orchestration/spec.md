## ADDED Requirements

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
