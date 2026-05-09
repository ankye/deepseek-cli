## ADDED Requirements

### Requirement: ContextGraph Projection Product Contract / ContextGraph Projection 产品契约

DeepSeek SHALL provide a governed ContextGraph projection capability that selects model-ready context from typed context nodes under policy, budget, redaction, and replay constraints.

DeepSeek 必须提供受治理的 ContextGraph projection 能力，在 policy、budget、redaction 和 replay 约束下，从类型化 context nodes 中选择可进入模型的上下文。

#### Scenario: Projection request is explicit / Projection request 显式

- **WHEN** runtime prepares a model request
- **THEN** it creates a projection request containing session id, turn id, model target, purpose, budget, scope, policy metadata, and trace metadata
- **中文** 当 runtime 准备 model request 时，必须创建包含 session id、turn id、model target、purpose、budget、scope、policy metadata 和 trace metadata 的 projection request。

#### Scenario: Projection result is replayable / Projection result 可 replay

- **WHEN** projection completes
- **THEN** it returns selected nodes, excluded nodes, ordering metadata, budget decision, redaction summary, cache metadata, and replay fingerprint
- **中文** 当 projection 完成时，必须返回 selected nodes、excluded nodes、ordering metadata、budget decision、redaction summary、cache metadata 和 replay fingerprint。

### Requirement: Deterministic Node Eligibility / 确定性节点资格

ContextGraph projection SHALL determine node eligibility through deterministic lifecycle, scope, freshness, policy, redaction, and invalidation rules.

ContextGraph projection 必须通过确定性的 lifecycle、scope、freshness、policy、redaction 和 invalidation rules 判断节点资格。

#### Scenario: Ineligible node is excluded with reason / 不合格节点带原因排除

- **WHEN** a candidate node is stale, outside scope, denied by policy, invalidated, or unsafe for the redaction class
- **THEN** projection excludes it and records a structured exclusion reason without leaking raw content
- **中文** 当 candidate node stale、outside scope、被 policy deny、已 invalidated 或不符合 redaction class 安全要求时，projection 必须排除它并记录 structured exclusion reason，且不泄漏 raw content。

#### Scenario: Eligible nodes have stable order / 合格节点顺序稳定

- **WHEN** multiple candidate nodes are eligible
- **THEN** projection orders them by deterministic priority, relevance, recency, dependency, and stable tie-break metadata
- **中文** 当多个 candidate nodes 合格时，projection 必须按 deterministic priority、relevance、recency、dependency 和 stable tie-break metadata 排序。

### Requirement: Budgeted Projection Degradation / 受预算约束的 Projection 降级

ContextGraph projection SHALL fit selected context within hard and soft token budgets and SHALL degrade deterministically before exceeding the hard budget.

ContextGraph projection 必须让 selected context 适配 hard 与 soft token budgets，并且在超过 hard budget 前确定性降级。

#### Scenario: Hard budget blocks unsafe projection / Hard budget 阻止不安全投影

- **WHEN** all eligible context cannot fit within the hard context budget
- **THEN** projection selects a deterministic subset or returns a typed budget rejection before model dispatch
- **中文** 当所有 eligible context 无法适配 hard context budget 时，projection 必须选择确定性子集，或在 model dispatch 前返回 typed budget rejection。

#### Scenario: Soft budget records degradation / Soft budget 记录降级

- **WHEN** projection stays within the hard budget but exceeds the soft target
- **THEN** it records degraded metadata and excluded lower-priority nodes with reasons
- **中文** 当 projection 未超过 hard budget 但超过 soft target 时，必须记录 degraded metadata，并带原因排除低优先级 nodes。

### Requirement: Projection Redaction Boundary / Projection 脱敏边界

Projection SHALL apply redaction before content appears in projection results, protocol events, traces, snapshots, caches, or test artifacts.

Projection 必须在内容进入 projection results、protocol events、traces、snapshots、caches 或 test artifacts 前执行脱敏。

#### Scenario: Secret-like node is blocked or redacted / 疑似 Secret 节点被阻止或脱敏

- **WHEN** a candidate node contains secret-like content or a redaction class unavailable to the caller
- **THEN** projection excludes or redacts the content and emits only redacted evidence
- **中文** 当 candidate node 包含 secret-like content，或其 redaction class 对 caller 不可用时，projection 必须排除或脱敏内容，并只发出 redacted evidence。

### Requirement: Projection Is Preparation Only / Projection 只负责准备

Projection SHALL NOT execute tools, mutate workspace files, call model providers, or own durable memory persistence.

Projection 不得执行工具、修改 workspace files、调用 model providers 或拥有 durable memory persistence。

#### Scenario: Projection side effects are rejected / Projection 副作用被拒绝

- **WHEN** projection logic attempts to perform executable work or mutate workspace state
- **THEN** tests or architecture lint fail before default suites pass
- **中文** 当 projection logic 试图执行可执行工作或修改 workspace state 时，tests 或 architecture lint 必须在默认测试通过前失败。
