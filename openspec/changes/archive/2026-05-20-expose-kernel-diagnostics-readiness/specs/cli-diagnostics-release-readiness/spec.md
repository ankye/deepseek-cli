## ADDED Requirements

### Requirement: Proc-Style Governance Diagnostics / Proc 风格治理 Diagnostics

CLI diagnostics SHALL expose stable governance sections for kernel boundary, UAPI compatibility, context/cache health, bus pressure, policy gates, agent scopes, module status, roadmap drift, and evidence matrix.

CLI diagnostics 必须暴露稳定治理 sections，覆盖 kernel boundary、UAPI compatibility、context/cache health、bus pressure、policy gates、agent scopes、module status、roadmap drift 与 evidence matrix。

#### Scenario: Readiness prints governance sections / Readiness 输出治理 Sections

- **WHEN** a user runs release readiness diagnostics
- **THEN** CLI output includes governance sections with stable ids, severity grouping, affected packages, evidence references, and next actions
- **中文** 当用户运行 release readiness diagnostics 时，CLI 输出必须包含带 stable ids、severity grouping、affected packages、evidence references 与 next actions 的治理 sections。

### Requirement: Machine-Readable Readiness Output / 机器可读 Readiness 输出

Governance diagnostics SHALL be available in text, JSON, and JSONL formats.

治理 diagnostics 必须支持 text、JSON 与 JSONL 格式。

#### Scenario: CI consumes readiness findings / CI 消费 Readiness Findings

- **WHEN** readiness is run in JSON or JSONL mode
- **THEN** each finding includes stable id, capability, owner package, severity, maturity state, evidence ids, redaction metadata, and suggested action
- **中文** 当 readiness 以 JSON 或 JSONL 模式运行时，每个 finding 必须包含 stable id、capability、owner package、severity、maturity state、evidence ids、redaction metadata 与 suggested action。

### Requirement: Product-Ready Claim Gate / 产品就绪声明门禁

Readiness SHALL report release-blocking diagnostics when product-ready claims conflict with governance evidence.

当产品就绪声明与治理证据冲突时，readiness 必须报告 release-blocking diagnostics。

#### Scenario: Placeholder conflicts with release claim / Placeholder 与发布声明冲突

- **WHEN** release metadata marks a placeholder, deferred, rollout-gated, or evidence-missing capability as product-ready
- **THEN** readiness fails with a stable release-blocking diagnostic
- **中文** 当 release metadata 将 placeholder、deferred、rollout-gated 或缺少证据的能力标记为 product-ready 时，readiness 必须以稳定 release-blocking diagnostic 失败。
