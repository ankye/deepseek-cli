## ADDED Requirements

### Requirement: Agent Namespace And Quota Governance / Agent Namespace 与配额治理

Agent management SHALL define explicit scopes for every non-default agent mode before write-capable multi-agent execution is promoted.

Agent management 必须在可写多 agent 执行被推广前，为每个非 default agent mode 定义显式 scopes。

#### Scenario: Worker has bounded namespace / Worker 具备有界 Namespace

- **WHEN** a worker agent is spawned for a task
- **THEN** its work order includes path scope, tool scope, memory scope, scratchpad scope, checkpoint policy, token budget, deadline, lineage, and ownership metadata
- **中文** 当 worker agent 为任务被 spawn 时，其 work order 必须包含 path scope、tool scope、memory scope、scratchpad scope、checkpoint policy、token budget、deadline、lineage 与 ownership metadata。

#### Scenario: Missing scope blocks write promotion / 缺失 Scope 阻止写执行推广

- **WHEN** coordinator, worker, repair, or implementer mode attempts write-capable default execution without required scopes
- **THEN** runtime or diagnostics rejects promotion and records a governance finding rather than falling back to implicit broad access
- **中文** 当 coordinator、worker、repair 或 implementer mode 在缺少必需 scopes 时尝试默认可写执行，runtime 或 diagnostics 必须拒绝推广并记录治理发现，而不是回退到隐式宽权限。

### Requirement: Agent Resource Accounting / Agent 资源记账

Agent orchestration SHALL account for budgets, fan-out, over-delegation, conflict risk, and verification evidence.

Agent orchestration 必须对 budgets、fan-out、over-delegation、conflict risk 与 verification evidence 进行记账。

#### Scenario: Coordinator default enablement requires evidence / Coordinator 默认启用需要证据

- **WHEN** coordinator mode is proposed for default enablement
- **THEN** evidence shows bounded worker fan-out, lower correction cost or failure rate than baseline, scoped writes, conflict handling, and verification quality
- **中文** 当 coordinator mode 被提议默认启用时，证据必须证明 bounded worker fan-out、相比 baseline 更低的 correction cost 或 failure rate、scoped writes、conflict handling 与 verification quality。
