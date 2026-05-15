## ADDED Requirements

### Requirement: Evidence-First Records Are Redacted And Replayable / 证据优先记录脱敏且可回放

Observability SHALL normalize evidence-first workflow events into redacted canonical records suitable for replay, diagnostics, and local support bundles.

observability 必须将 evidence-first workflow events 归一化为脱敏 canonical records，适用于 replay、diagnostics 与 local support bundles。

#### Scenario: Evidence plan is observable / 证据计划可观测
- **WHEN** a fact-sensitive task creates an evidence plan
- **THEN** observability records plan id, task classification, required fact classes, source groups, source coverage, stop conditions, trace metadata, schema version, and redaction metadata
- **中文** 当 fact-sensitive task 创建 evidence plan 时，observability 必须记录 plan id、task classification、required fact classes、source groups、source coverage、stop conditions、trace metadata、schema version 与 redaction metadata。

#### Scenario: Evidence manifest excludes raw secrets / 证据清单排除原始 Secrets
- **WHEN** evidence items or claim groundings are stored, rendered, or exported
- **THEN** records contain bounded previews, fingerprints, source references, fact classes, and redaction summaries without raw secrets, unbounded private file content, provider raw reasoning, or authorization material
- **中文** 当 evidence items 或 claim groundings 被存储、展示或导出时，records 必须包含 bounded previews、fingerprints、source references、fact classes 与 redaction summaries，不得包含 raw secrets、无界私有文件内容、provider raw reasoning 或 authorization material。

### Requirement: Unsupported Claim Diagnostics Are Safe / 未支持声明诊断安全

Observability SHALL record unsupported-claim diagnostics without leaking unsafe source content or overstating unverified conclusions.

observability 必须记录 unsupported-claim diagnostics，同时不泄漏 unsafe source content，也不夸大未经验证的结论。

#### Scenario: Unsupported command diagnostic is bounded / 未支持命令诊断有界
- **WHEN** generated output includes an unsupported command or package claim
- **THEN** observability records the claim fingerprint, bounded claim preview, missing evidence class, output artifact id, and remediation hint without persisting full generated artifact content by default
- **中文** 当生成输出包含 unsupported command 或 package claim 时，observability 必须记录 claim fingerprint、有界 claim preview、missing evidence class、output artifact id 与 remediation hint，默认不持久化完整生成产物内容。
