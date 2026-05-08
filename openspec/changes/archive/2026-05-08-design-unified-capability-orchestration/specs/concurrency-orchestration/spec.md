## ADDED Requirements

### Requirement: Governed Capability Scheduling

The concurrency orchestrator SHALL schedule executable capability envelopes that require asynchronous execution, resource locks, cancellation, deadlines, retry budgets, rate limits, backpressure, or side-effect isolation.

concurrency orchestrator 必须调度需要 asynchronous execution、resource locks、cancellation、deadlines、retry budgets、rate limits、backpressure 或 side-effect isolation 的 executable capability envelopes。

#### Scenario: Scheduler receives envelope resource requirements

- **WHEN** a governed capability invocation enters scheduling
- **THEN** the scheduler receives task scope, owner metadata, resource locks, timeout, deadline, retry policy, idempotency metadata, cancellation policy, priority, and backpressure policy from the envelope

#### Scenario: Scheduler does not invent workflow semantics

- **WHEN** the scheduler starts, delays, cancels, retries, rate-limits, or rejects executable work
- **THEN** it emits task events and structured decisions without adding undeclared workflow steps or changing workflow completion criteria
