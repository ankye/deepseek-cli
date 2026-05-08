## ADDED Requirements

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
