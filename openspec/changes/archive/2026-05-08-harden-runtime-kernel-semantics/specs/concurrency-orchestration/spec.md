## ADDED Requirements

### Requirement: Abort-Backed Scheduler Tasks

The concurrency orchestrator SHALL provide abort-backed task execution for cancellable runtime kernel work.

concurrency orchestrator 必须为 cancellable runtime kernel work 提供 abort-backed task execution。

#### Scenario: Task receives abort signal

- **WHEN** the scheduler starts a cancellable task
- **THEN** the task execution context includes an `AbortSignal` that is aborted on cancellation or timeout

#### Scenario: Cancelled queued task never starts

- **WHEN** a queued task is cancelled before a slot is available
- **THEN** the scheduler emits a cancelled terminal event and does not call the task executor

### Requirement: Deterministic Scheduler Event Ordering

The concurrency orchestrator SHALL emit deterministic task lifecycle events for queued, started, completed, failed, cancelled, and timed-out states.

concurrency orchestrator 必须为 queued、started、completed、failed、cancelled 和 timed-out states 发出确定性 task lifecycle events。

#### Scenario: Successful task order

- **WHEN** a scheduled task completes successfully
- **THEN** task events appear in queued, running, completed order with trace and task metadata

#### Scenario: Timeout task order

- **WHEN** a scheduled task times out
- **THEN** task events appear in queued, running, timed-out order and no completed event is emitted
