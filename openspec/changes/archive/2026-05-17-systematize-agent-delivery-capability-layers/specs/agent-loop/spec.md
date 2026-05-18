## ADDED Requirements

### Requirement: Layered Delivery Workflow Uses The Existing Agent Loop / 分层交付工作流复用现有 Agent Loop

The agent loop SHALL coordinate project rules, tool governance, output contracts, verification expectations, and context or memory evidence through the existing evidence, planning, execution, verification, repair, synthesis, and terminal phases.

agent loop 必须通过现有 evidence、planning、execution、verification、repair、synthesis 与 terminal phases 协调 project rules、tool governance、output contracts、verification expectations 与 context 或 memory evidence。

#### Scenario: Turn records delivery layer plan / Turn 记录交付分层计划

- **WHEN** a task begins and any delivery layer is required by task intent, repository policy, output contract, tool projection, or memory policy
- **THEN** the phase plan records which layers are required, skipped, degraded, or not applicable
- **AND** the terminal event summarizes each required layer outcome before reporting completion or failure
- **中文** 当任务开始且任一交付层因 task intent、repository policy、output contract、tool projection 或 memory policy 被要求时，phase plan 必须记录哪些层 required、skipped、degraded 或 not applicable；terminal event 必须在报告完成或失败前汇总每个 required layer outcome。

#### Scenario: Layer gap routes to owning subsystem / 层级缺口归属到负责子系统

- **WHEN** verification detects a missing project rule, unavailable tool, unsatisfied output contract, absent required memory, or missing regression evidence
- **THEN** the agent loop records the owning layer and failure code instead of hiding the gap inside assistant text
- **中文** 当验证检测到 missing project rule、unavailable tool、unsatisfied output contract、absent required memory 或 missing regression evidence 时，agent loop 必须记录 owning layer 与 failure code，而不是把缺口隐藏在 assistant text 中。

### Requirement: Structured Delivery Completion Is Evidence-Bound / 结构化交付完成受证据约束

For structured, mutating, or externally scored tasks, the agent loop SHALL NOT emit a successful delivery terminal event until required output contracts and verification expectations are satisfied or explicitly not applicable.

对于结构化、有副作用或外部评分的任务，agent loop 不得在 required output contracts 与 verification expectations 被满足或明确不适用之前发出成功交付终态事件。

#### Scenario: Model text alone is insufficient / 仅模型文本不足以完成

- **WHEN** a task requires a JSON artifact, schema-compliant file, command plan, workspace mutation, or benchmark-checkable output
- **THEN** final assistant text without matching contract verification does not count as completed delivery
- **AND** the loop either enters self-repair or fails closed with typed diagnostics
- **中文** 当任务要求 JSON artifact、schema-compliant file、command plan、workspace mutation 或可由 benchmark 检查的 output 时，只有 final assistant text 而没有匹配的 contract verification 不得计为完成交付；loop 必须进入 self-repair 或带 typed diagnostics 安全失败。
