## ADDED Requirements

### Requirement: Agent Namespace / Agent Namespace

Write-capable agents SHALL execute within explicit namespaces that bound paths, tools, memory, scratchpad, checkpoints, budgets, deadlines, lineage, and ownership.

可写 agents 必须在显式 namespaces 中执行，用于约束 paths、tools、memory、scratchpad、checkpoints、budgets、deadlines、lineage 与 ownership。

#### Scenario: Agent write is scoped / Agent 写入受 Scope 约束

- **WHEN** a coordinator, worker, verifier, repair, or implementer agent attempts a write operation
- **THEN** agent-management verifies the operation is within the agent namespace before execution proceeds
- **中文** 当 coordinator、worker、verifier、repair 或 implementer agent 尝试写操作时，agent-management 必须在执行前验证该操作位于 agent namespace 内。

### Requirement: Agent Quotas / Agent Quotas

Agent execution SHALL enforce quotas for token budget, tool calls, wall-clock deadlines, retries, and mutation scope.

Agent execution 必须执行 token budget、tool calls、wall-clock deadlines、retries 与 mutation scope 的 quotas。

#### Scenario: Quota exhaustion stops work / Quota 耗尽停止工作

- **WHEN** an agent exhausts a configured quota
- **THEN** execution stops or requests policy-approved extension and emits a quota diagnostic
- **中文** 当 agent 耗尽配置 quota 时，execution 必须停止或请求 policy-approved extension，并发出 quota diagnostic。

### Requirement: Agent Lineage And Ownership / Agent Lineage 与 Ownership

Child agents SHALL record parent lineage, delegated scope, output ownership, and merge responsibility.

Child agents 必须记录 parent lineage、delegated scope、output ownership 与 merge responsibility。

#### Scenario: Child scope cannot silently expand / Child Scope 不能静默扩大

- **WHEN** a child agent requests broader paths, tools, memory, or budget than its parent delegated
- **THEN** the request requires an explicit policy decision and lineage record
- **中文** 当 child agent 请求比 parent delegated 更宽的 paths、tools、memory 或 budget 时，该请求必须需要显式 policy decision 与 lineage record。
