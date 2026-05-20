## ADDED Requirements

### Requirement: Scoped Agent Event-Loop Handoff / Scoped Agent Event-loop Handoff

The runtime event loop SHALL enforce agent scope, cancellation, timeout, and quota handoffs before running subagent work.

Runtime event loop 在运行 subagent work 前必须执行 agent scope、cancellation、timeout 与 quota handoffs。

#### Scenario: Event loop denies out-of-scope agent work / Event Loop 拒绝越界 Agent Work

- **WHEN** a subagent task is scheduled outside its namespace or quota
- **THEN** the event loop rejects or pauses the task with a stable diagnostic
- **中文** 当 subagent task 被调度到 namespace 或 quota 外时，event loop 必须用稳定 diagnostic 拒绝或暂停该任务。
