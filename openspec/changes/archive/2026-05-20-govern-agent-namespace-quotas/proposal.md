## Why

Multi-agent coordinator/worker/repair modes cannot become default write-capable behavior until each agent has explicit namespace, quota, ownership, and lineage controls. / 多 agent coordinator/worker/repair 模式在每个 agent 具备明确 namespace、quota、ownership 与 lineage 控制前，不能成为默认可写行为。

This change opens the governance track that makes subagents scoped execution units instead of unbounded helpers. / 本变更打开治理专项，把 subagents 定义为有作用域的执行单元，而不是无边界 helper。

## What Changes

- Define agent namespaces for paths, tools, memory, scratchpad, checkpoints, budgets, deadlines, and parent lineage. / 定义 agent namespace，覆盖 paths、tools、memory、scratchpad、checkpoints、budgets、deadlines 与 parent lineage。
- Require quotas before multi-agent write execution is promoted. / 要求在推广多 agent 写执行前具备 quotas。
- Require runtime event-loop handoff to enforce agent scope and ownership. / 要求 runtime event-loop handoff 执行 agent scope 与 ownership。

## Capabilities

### New Capabilities

### Modified Capabilities

- `agent-management`: Add namespace, quota, lineage, and scoped write governance requirements. / 增加 namespace、quota、lineage 与 scoped write 治理要求。
- `runtime-event-loop`: Add scoped subagent execution and cancellation/timeout handoff requirements. / 增加 scoped subagent execution 与 cancellation/timeout handoff 要求。

## Impact

- Owner packages / 责任包: `agent-management`, `runtime`, `workflow-orchestration`, `policy-sandbox`, `testing-regression`.
- Product posture / 产品姿态: multi-agent remains rollout-gated until scope evidence exists. / 在 scope evidence 存在前，多 agent 保持 rollout-gated。
