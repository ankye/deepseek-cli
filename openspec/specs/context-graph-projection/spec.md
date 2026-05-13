## Purpose

Define the product-level ContextGraph projection boundary that selects model-ready context from typed evidence under policy, budget, redaction, cache, and replay constraints.

定义产品级 ContextGraph projection 边界，在 policy、budget、redaction、cache 和 replay 约束下，从类型化证据中选择可进入模型的上下文。
## Requirements
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

### Requirement: Projection Honors Secret Policy / Projection 遵守 Secret Policy

ContextGraph projection SHALL honor policy/sandbox secret decisions and SHALL NOT expose content that policy denies.

ContextGraph projection 必须遵守 policy/sandbox secret decisions，且不得暴露 policy deny 的内容。

#### Scenario: Policy-denied node stays excluded / Policy 拒绝节点保持排除

- **WHEN** a candidate context node is denied by secret or sandbox policy
- **THEN** projection excludes it with redacted reason metadata before model dispatch
- **中文** 当 candidate context node 被 secret 或 sandbox policy deny 时，projection 必须在 model dispatch 前排除它，并记录 redacted reason metadata。

#### Scenario: Projection redaction matches audit class / Projection 脱敏匹配审计等级

- **WHEN** projection emits selected/excluded summaries
- **THEN** redaction class and audit reason metadata match policy decisions for the same content
- **中文** 当 projection 发出 selected/excluded summaries 时，redaction class 与 audit reason metadata 必须匹配同一内容的 policy decisions。

### Requirement: Selected CLI References Enter ContextGraph Projection / 选中 CLI 引用进入 ContextGraph Projection

ContextGraph projection SHALL accept selected CLI reference content as typed context candidates only after runtime-owned resolution, policy checks, and platform path normalization.

ContextGraph projection 必须只在 runtime-owned resolution、policy checks 与 platform path normalization 之后，接受 selected CLI reference content 作为 typed context candidates。

#### Scenario: Reference materialization is governed / 引用物化受治理

- **WHEN** a prompt turn contains active CLI file references
- **THEN** runtime resolves those references through platform workspace path APIs, creates typed `file` candidates, and sends them through context projection before model dispatch
- **中文** 当 prompt turn 包含 active CLI file references 时，runtime 必须通过 platform workspace path APIs 解析这些 references，创建 typed `file` candidates，并在 model dispatch 前发送给 context projection。

#### Scenario: Unsupported references are evidence-only / 不支持的引用仅作为证据

- **WHEN** a prompt turn contains directory, symbol, diagnostic, diff, message, turn, or tool-evidence references not supported by this slice
- **THEN** projection evidence records them as unresolved or excluded reference ids without reading content or failing the turn
- **中文** 当 prompt turn 包含本阶段不支持的 directory、symbol、diagnostic、diff、message、turn 或 tool-evidence references 时，projection evidence 必须将其记录为 unresolved 或 excluded reference ids，不读取内容，也不让 turn 失败。

### Requirement: PageIndex Recall Projection Boundary / PageIndex 回溯投影边界

ContextGraph projection SHALL treat PageIndex as deterministic recall evidence and SHALL NOT materialize PageIndex pages into model-visible context until an explicit projection capability is added.

ContextGraph projection 必须将 PageIndex 视为 deterministic recall evidence，并且在明确增加 projection capability 前，不得将 PageIndex pages 物化为 model-visible context。

#### Scenario: PageIndex is recall truth source / PageIndex 是回溯 Truth Source

- **WHEN** semantic recall or ZVec ranking is introduced later
- **THEN** every semantic candidate must point back to a deterministic PageIndex page id, session id, and turn id
- **中文** 当未来引入 semantic recall 或 ZVec ranking 时，每个 semantic candidate 都必须指回确定性的 PageIndex page id、session id 与 turn id。

#### Scenario: Turn page references remain unsupported in this slice / 本片不支持 Turn Page 引用投影

- **WHEN** a prompt turn contains a PageIndex recall target or `turn` reference before turn/page projection is implemented
- **THEN** projection evidence records it as unsupported or evidence-only without reading transcript content or failing the turn
- **中文** 当 prompt turn 在 turn/page projection 实现前包含 PageIndex recall target 或 `turn` reference 时，projection evidence 必须将其记录为 unsupported 或 evidence-only，不读取 transcript content，也不让 turn 失败。

### Requirement: PageIndex Turn References Materialize As Summaries / PageIndex Turn 引用物化为 Summary

ContextGraph projection SHALL materialize PageIndex-shaped `turn` references into bounded `summary` context nodes, SHALL preserve explicit recall scope and evidence quality provenance, SHALL include a model-visible evidence usage qualifier, and SHALL leave other unsupported references as evidence-only.

ContextGraph projection 必须将 PageIndex 形态的 `turn` references 物化为有界 `summary` context nodes，必须保留明确的 recall scope 与 evidence quality provenance，必须包含模型可见的 evidence usage qualifier，并将其他 unsupported references 保持为 evidence-only。

#### Scenario: PageIndex turn reference becomes summary node / PageIndex Turn 引用成为 Summary Node

- **WHEN** a prompt turn contains an active `turn` reference with PageIndex page metadata and bounded previews
- **THEN** runtime projection creates a `summary` candidate node from those previews, runs normal budget/redaction selection, and emits resolved reference evidence
- **中文** 当 prompt turn 包含带 PageIndex page metadata 与 bounded previews 的 active `turn` reference 时，runtime projection 必须基于这些 previews 创建 `summary` candidate node，运行正常 budget/redaction selection，并发出 resolved reference evidence。

#### Scenario: Non-PageIndex turn reference remains unresolved / 非 PageIndex Turn 引用保持未解析

- **WHEN** a prompt turn contains a `turn` reference without PageIndex page metadata
- **THEN** projection records it as unsupported or incomplete without reading transcript content or failing the turn
- **中文** 当 prompt turn 包含没有 PageIndex page metadata 的 `turn` reference 时，projection 必须将其记录为 unsupported 或 incomplete，不读取 transcript content，也不让 turn 失败。

#### Scenario: Projected recall summary preserves prompt boundary / 投影 Recall Summary 保持 Prompt 边界

- **WHEN** projected PageIndex summaries are sent to the model
- **THEN** they appear in runtime-owned context messages while the user prompt message remains the exact submitted prompt text
- **中文** 当投影后的 PageIndex summaries 被发送给 model 时，它们必须出现在 runtime-owned context messages 中，而 user prompt message 必须保持用户提交的原样 prompt text。

#### Scenario: Projected recall summary preserves scope provenance / 投影 Recall Summary 保留 Scope 来源

- **WHEN** a projected PageIndex summary is created from a scoped recall reference
- **THEN** its model-visible summary, node provenance, and replay dependency fingerprint include the recall scope so `session` and `workspace` evidence remain distinguishable
- **中文** 当投影后的 PageIndex summary 来自带 scope 的 recall reference 时，其模型可见摘要、node provenance 与 replay dependency fingerprint 必须包含 recall scope，使 `session` 与 `workspace` 证据保持可区分。

#### Scenario: Projected recall summary preserves evidence quality / 投影 Recall Summary 保留证据质量

- **WHEN** a projected PageIndex summary is created from a recall reference with evidence quality metadata
- **THEN** its model-visible summary and node provenance include createdAt, freshness status, matched fields, and deterministic ranking reason without adding raw full transcript content
- **中文** 当投影后的 PageIndex summary 来自带 evidence quality metadata 的 recall reference 时，其模型可见摘要与 node provenance 必须包含 createdAt、freshness status、matched fields 和 deterministic ranking reason，且不得加入完整原始 transcript content。

#### Scenario: Projected recall summary qualifies historical evidence / 投影 Recall Summary 标注历史证据

- **WHEN** a projected PageIndex summary is materialized into model-visible context
- **THEN** the summary includes a qualifier telling the model to treat the content as historical recall evidence that may be stale or incomplete, and the qualifier is recorded in provenance and replay fingerprints
- **中文** 当投影后的 PageIndex summary 被物化进模型可见上下文时，该 summary 必须包含 qualifier，告知模型将内容视为可能过期或不完整的历史 recall evidence，并且该 qualifier 必须记录到 provenance 与 replay fingerprints。

### Requirement: PageIndex Projection Includes Freshness Evidence / PageIndex Projection 包含 Freshness Evidence

ContextGraph projection SHALL include bounded PageIndex freshness evidence in model-visible recall summaries and node provenance.

ContextGraph projection 必须在模型可见的 PageIndex recall summaries 与 node provenance 中包含有界 PageIndex freshness evidence。

#### Scenario: Projected summary explains stale evidence / 投影摘要解释 Stale Evidence

- **WHEN** a PageIndex recall reference carries stale reason or workspace watermark metadata
- **THEN** the projected model-visible summary includes a compact freshness evidence line and node provenance preserves the same bounded fields
- **中文** 当 PageIndex recall reference 携带 stale reason 或 workspace watermark metadata 时，投影后的模型可见 summary 必须包含 compact freshness evidence line，并且 node provenance 必须保留相同的有界字段。

#### Scenario: Projection fingerprint includes freshness evidence / Projection Fingerprint 包含 Freshness Evidence

- **WHEN** freshness reason or watermark metadata changes for the same PageIndex reference
- **THEN** the projected node dependency fingerprint changes even if prompt and assistant previews are unchanged
- **中文** 当同一个 PageIndex reference 的 freshness reason 或 watermark metadata 改变时，即使 prompt 与 assistant previews 未变化，投影 node dependency fingerprint 也必须改变。

### Requirement: Projection Requires PageIndex Provenance For Semantic Recall / Projection 要求 Semantic Recall 具备 PageIndex Provenance

ContextGraph projection SHALL only materialize semantic recall candidates when they preserve deterministic PageIndex provenance and bounded freshness evidence.

ContextGraph projection 只有在 semantic recall candidates 保留 deterministic PageIndex provenance 与有界 freshness evidence 时，才可以将其物化。

#### Scenario: Semantic recall without provenance remains evidence-only / 无 Provenance 的 Semantic Recall 仅作 Evidence
- **WHEN** a ZVec or code-index recall candidate lacks PageIndex page id, session id, turn id, or freshness evidence
- **THEN** projection records the candidate as unresolved or evidence-only without adding it to model-visible context
- **中文** 当 ZVec 或 code-index recall candidate 缺少 PageIndex page id、session id、turn id 或 freshness evidence 时，projection 必须将该 candidate 记录为 unresolved 或 evidence-only，不得加入模型可见 context。

#### Scenario: Semantic provider status is visible in provenance / Semantic Provider Status 在 Provenance 可见
- **WHEN** projection materializes a PageIndex-backed semantic recall candidate
- **THEN** node provenance and replay fingerprints include provider id, provider kind, semantic status, PageIndex page id, and freshness evidence
- **中文** 当 projection 物化由 PageIndex 支撑的 semantic recall candidate 时，node provenance 与 replay fingerprints 必须包含 provider id、provider kind、semantic status、PageIndex page id 与 freshness evidence。
