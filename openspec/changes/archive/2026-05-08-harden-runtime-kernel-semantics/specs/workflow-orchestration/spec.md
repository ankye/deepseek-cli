## ADDED Requirements

### Requirement: Single Workflow Closure

Workflow orchestration SHALL close each kernel invocation exactly once with a terminal status linked to the same envelope, task, and trace lineage.

workflow orchestration 必须对每个 kernel invocation 只关闭一次，并使用与同一 envelope、task 和 trace lineage 关联的 terminal status。

#### Scenario: Successful invocation closes once

- **WHEN** a kernel invocation completes successfully
- **THEN** exactly one workflow closed event is emitted after capability and scheduler terminal events

#### Scenario: Cancelled invocation closes once

- **WHEN** a kernel invocation is cancelled or timed out
- **THEN** exactly one workflow closed event is emitted with cancelled or timed-out status
