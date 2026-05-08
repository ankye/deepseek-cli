# concurrency-orchestration Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Central Concurrency Orchestrator

The system SHALL define a concurrency orchestration layer that owns task scopes, task scheduling, cancellation propagation, deadlines, resource locks, queues, backpressure, rate limits, retry budgets, and task telemetry.

系统必须定义 concurrency orchestration layer，统一管理 task scopes、task scheduling、cancellation propagation、deadlines、resource locks、queues、backpressure、rate limits、retry budgets 和 task telemetry。

#### Scenario: Runtime receives concurrency dependency

- **WHEN** runtime, agent management, model gateway, capability execution, context provider work, extension loading, or sandbox execution needs asynchronous work
- **THEN** it uses the `ConcurrencyOrchestrator` contract
- **AND** it does not create unmanaged background tasks for platform work

#### Scenario: Fake scheduler supports tests

- **WHEN** tests construct runtime dependencies
- **THEN** they can provide a fake concurrency orchestrator with deterministic scheduling, cancellation, and timing behavior

### Requirement: Structured Cancellation and Deadlines

The concurrency orchestrator SHALL support parent-child task scopes, cancellation reasons, host cancellation propagation, deadlines, timeouts, and terminal task events.

concurrency orchestrator 必须支持 parent-child task scopes、cancellation reasons、host cancellation propagation、deadlines、timeouts 和 terminal task events。

#### Scenario: Host cancellation propagates to child tasks

- **WHEN** a host cancels an active runtime turn
- **THEN** the turn task scope is cancelled
- **AND** model streams, capability execution, sandbox processes, context providers, and child agent tasks under that scope receive cancellation

#### Scenario: Deadline cancels overdue task

- **WHEN** a task exceeds its configured deadline
- **THEN** the orchestrator cancels the task with a deadline reason
- **AND** emits a terminal timeout or cancellation task event

### Requirement: Resource Locks

The concurrency orchestrator SHALL provide resource locks for workspace, file path, session, agent instance, process slot, model provider, and extension loading resources.

concurrency orchestrator 必须为 workspace、file path、session、agent instance、process slot、model provider 和 extension loading resources 提供 resource locks。

#### Scenario: File mutation uses path lock

- **WHEN** a capability proposes or applies a file mutation
- **THEN** it acquires the required workspace or path lock before mutation
- **AND** concurrent conflicting mutations are queued, rejected, or serialized according to policy

#### Scenario: Agent instance turn is serialized

- **WHEN** the same agent instance receives multiple turn requests
- **THEN** the orchestrator serializes or rejects concurrent turns according to the agent lifecycle policy

### Requirement: Queues, Backpressure, and Rate Limits

The concurrency orchestrator SHALL provide queue policies, bounded concurrency, backpressure signals, provider rate limits, tool execution limits, and sandbox process limits.

concurrency orchestrator 必须提供 queue policies、bounded concurrency、backpressure signals、provider rate limits、tool execution limits 和 sandbox process limits。

#### Scenario: Model provider rate limit

- **WHEN** model calls exceed the configured provider concurrency or rate budget
- **THEN** the orchestrator queues, delays, or rejects additional requests with structured rate-limit metadata

#### Scenario: Runtime event stream applies backpressure

- **WHEN** a host consumes runtime events slowly
- **THEN** the runtime and concurrency layer can apply backpressure or bounded buffering instead of unbounded memory growth

### Requirement: Retry Budget and Idempotency Metadata

The concurrency orchestrator SHALL track retry budgets and require idempotency metadata before retrying model calls, tool execution, or extension operations.

concurrency orchestrator 必须跟踪 retry budgets，并在重试 model calls、tool execution 或 extension operations 前要求 idempotency metadata。

#### Scenario: Retry non-idempotent operation is blocked

- **WHEN** a failed operation is not marked idempotent or retry-safe
- **THEN** the orchestrator does not retry it automatically

#### Scenario: Retry budget is exhausted

- **WHEN** an operation exhausts its retry budget
- **THEN** the orchestrator returns a structured retry-exhausted error and emits task telemetry

### Requirement: Task Telemetry and Audit

The concurrency orchestrator SHALL emit structured task events for scheduled, started, blocked, waiting, rate-limited, locked, cancelled, timed out, failed, and completed states.

concurrency orchestrator 必须为 scheduled、started、blocked、waiting、rate-limited、locked、cancelled、timed out、failed 和 completed states 输出结构化 task events。

#### Scenario: Task event includes ownership metadata

- **WHEN** a task event is emitted
- **THEN** it includes task id, scope id, owner kind, owner id, session id when available, agent id when available, timing metadata, and redacted reason metadata

#### Scenario: Audit receives concurrency decision

- **WHEN** a task is blocked, cancelled, rate-limited, or denied a lock
- **THEN** policy or audit boundaries can receive the structured concurrency decision

### Requirement: Future Multi-Agent Scheduling Boundary

The concurrency orchestrator SHALL define scheduling metadata that can support future delegated agents and multi-agent graphs while allowing the first implementation to run one default agent.

concurrency orchestrator 必须定义 scheduling metadata，以支持未来 delegated agents 和 multi-agent graphs，同时允许第一版只运行一个 default agent。

#### Scenario: Single default agent uses scheduler

- **WHEN** the first implementation runs a single default agent turn
- **THEN** it still creates a task scope and schedules model/tool/context work through the orchestrator

#### Scenario: Delegated task declares constraints

- **WHEN** a future agent delegates work to another agent
- **THEN** the scheduled task can declare priority, parent scope, resource constraints, deadline, cancellation policy, and approval requirements

### Requirement: Governed Capability Scheduling

The concurrency orchestrator SHALL schedule executable capability envelopes that require asynchronous execution, resource locks, cancellation, deadlines, retry budgets, rate limits, backpressure, or side-effect isolation.

concurrency orchestrator 必须调度需要 asynchronous execution、resource locks、cancellation、deadlines、retry budgets、rate limits、backpressure 或 side-effect isolation 的 executable capability envelopes。

#### Scenario: Scheduler receives envelope resource requirements

- **WHEN** a governed capability invocation enters scheduling
- **THEN** the scheduler receives task scope, owner metadata, resource locks, timeout, deadline, retry policy, idempotency metadata, cancellation policy, priority, and backpressure policy from the envelope

#### Scenario: Scheduler does not invent workflow semantics

- **WHEN** the scheduler starts, delays, cancels, retries, rate-limits, or rejects executable work
- **THEN** it emits task events and structured decisions without adding undeclared workflow steps or changing workflow completion criteria

### Requirement: In-Process Scheduler Queue

The concurrency orchestrator SHALL provide an in-process deterministic scheduler queue for runtime kernel work.

concurrency orchestrator 必须为 runtime kernel work 提供 in-process deterministic scheduler queue。

#### Scenario: Schedule single task

- **WHEN** the kernel submits an executable task with an execution envelope
- **THEN** the scheduler emits queued, started, and settled task events with the same trace context

#### Scenario: Enforce concurrency limit

- **WHEN** more tasks are submitted than the configured concurrency limit permits
- **THEN** extra tasks remain queued until running tasks settle

### Requirement: Scheduler Cancellation and Timeout

The scheduler SHALL enforce cancellation and timeout for kernel-submitted tasks.

scheduler 必须为 kernel-submitted tasks 执行 cancellation 和 timeout。

#### Scenario: Cancel queued task

- **WHEN** a queued task is cancelled before it starts
- **THEN** the scheduler marks it cancelled and never calls its executor

#### Scenario: Timeout running task

- **WHEN** a running task exceeds its timeout
- **THEN** the scheduler requests cancellation and emits a timeout-aware terminal event

