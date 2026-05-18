## ADDED Requirements

### Requirement: Memory Capabilities Are Layered And Separately Gated / 记忆能力分层且独立门禁

The system SHALL distinguish current conversation context, PageIndex or index recall, lossless context preservation, permanent promoted memory, provider cache, and external memory hooks as separate capabilities with separate diagnostics and delivery gates.

系统必须将 current conversation context、PageIndex 或 index recall、lossless context preservation、permanent promoted memory、provider cache 与 external memory hooks 区分为独立能力，并提供独立 diagnostics 与 delivery gates。

#### Scenario: Recall is not permanent memory / Recall 不等于永久记忆

- **WHEN** the runtime can recall PageIndex or lossless context records but has no approved durable promoted memory provider
- **THEN** diagnostics and delivery scoring report recall capability separately from permanent memory
- **中文** 当 runtime 能召回 PageIndex 或 lossless context records 但没有 approved durable promoted memory provider 时，diagnostics 与 delivery scoring 必须将 recall capability 与 permanent memory 分开报告。

#### Scenario: Disabled memory is explicit / 记忆关闭显式化

- **WHEN** long-term memory is disabled by user, workspace, session, policy, provider unavailability, or missing configuration
- **THEN** prompt assembly and delivery scoring report `disabled`, `unavailable`, or `missing` with scope metadata rather than silently omitting memory evidence
- **中文** 当长期记忆因 user、workspace、session、policy、provider unavailable 或 missing configuration 被关闭时，prompt assembly 与 delivery scoring 必须带 scope metadata 报告 `disabled`、`unavailable` 或 `missing`，而不是静默省略 memory evidence。

### Requirement: External Memory Hooks Fit The Main Workflow / 外部记忆 Hook 融入主流程

External memory hooks SHALL integrate through capture, retrieval, prompt injection, verification evidence, and scoring boundaries without bypassing prompt assembly priority or runtime policy.

外部 memory hooks 必须通过 capture、retrieval、prompt injection、verification evidence 与 scoring boundaries 融入主流程，不得绕过 prompt assembly priority 或 runtime policy。

#### Scenario: External memory cannot override current rules / 外部记忆不能覆盖当前规则

- **WHEN** an external memory provider returns memories or procedure suggestions
- **THEN** runtime treats them as governed context candidates below current user instructions, host policy, and repository rules
- **AND** prompt evidence records inclusion, exclusion, conflict, or degradation decisions
- **中文** 当外部 memory provider 返回 memories 或 procedure suggestions 时，runtime 必须将其作为受治理 context candidates，优先级低于当前 user instructions、host policy 与 repository rules；prompt evidence 必须记录 inclusion、exclusion、conflict 或 degradation decisions。
