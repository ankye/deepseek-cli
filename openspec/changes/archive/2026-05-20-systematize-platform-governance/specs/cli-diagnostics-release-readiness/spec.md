## ADDED Requirements

### Requirement: Governance Readiness Diagnostics / 治理就绪诊断

CLI diagnostics and release readiness SHALL surface platform governance findings for placeholders, rollout gates, deferred providers, thin host adapters, stale aliases, and missing evidence.

CLI diagnostics 与 release readiness 必须暴露关于占位实现、rollout gates、deferred providers、薄 host adapter、陈旧 alias 和缺失证据的平台治理发现。

#### Scenario: Readiness reports placeholder risk / Readiness 报告占位风险

- **WHEN** readiness evaluates remote connectivity, distribution update, extension/evolution placeholders, semantic indexing, VSCode adapter, or multi-agent rollout status
- **THEN** output includes governance findings with canonical maturity state, severity, evidence ids, and suggested next action
- **中文** 当 readiness 评估 remote connectivity、distribution update、extension/evolution 占位、semantic indexing、VSCode adapter 或 multi-agent rollout 状态时，输出必须包含带规范成熟度状态、严重度、evidence ids 和建议下一步的治理发现。

#### Scenario: JSON output is structured / JSON 输出结构化

- **WHEN** governance diagnostics are rendered in `json` or `jsonl` output mode
- **THEN** each finding is emitted as structured data rather than prose-only text and carries redaction metadata
- **中文** 当治理诊断以 `json` 或 `jsonl` 输出模式渲染时，每个发现必须作为结构化数据输出，而不是仅输出 prose text，并且携带 redaction metadata。

### Requirement: Release-Blocking Governance Conflicts / 发布阻断治理冲突

Release readiness SHALL fail closed when a release claim conflicts with governance evidence for a risk-bearing capability.

当 release 声明与有风险能力的治理证据冲突时，release readiness 必须 fail closed。

#### Scenario: Product-ready claim conflicts with deferred evidence / 产品就绪声明与延期证据冲突

- **WHEN** release metadata or roadmap status claims a capability is product-ready while governance evidence marks it `placeholder`, `deferred`, or missing required evidence
- **THEN** readiness emits a release-blocking diagnostic and names the downgrade or evidence required to proceed
- **中文** 当 release metadata 或 roadmap status 声称某能力产品就绪，但治理证据将其标记为 `placeholder`、`deferred` 或缺少必需证据时，readiness 必须输出 release-blocking diagnostic，并说明继续推进所需的降级或证据。

#### Scenario: Contract coverage is not product evidence / Contract 覆盖不等于产品证据

- **WHEN** a readiness gate evaluates a host or product workflow
- **THEN** it distinguishes contract tests from CLI/product acceptance, e2e, live smoke, matrix, and golden evidence
- **中文** 当 readiness gate 评估 host 或产品 workflow 时，必须区分 contract tests 与 CLI/product acceptance、e2e、live smoke、matrix 和 golden evidence。

### Requirement: Governance Summary In CLI Text Output / CLI 文本输出中的治理摘要

CLI text diagnostics SHALL summarize governance risk without requiring users to inspect internal docs.

CLI 文本诊断必须摘要治理风险，用户不需要查看内部文档即可理解。

#### Scenario: Text output names risk and next action / 文本输出说明风险与下一步

- **WHEN** a user runs diagnostics or readiness in text mode
- **THEN** the CLI lists governance findings grouped by severity, with affected package/capability, maturity state, and next action
- **中文** 当用户以 text 模式运行 diagnostics 或 readiness 时，CLI 必须按严重度列出治理发现，包含受影响 package/capability、成熟度状态和下一步。

### Requirement: Kernel Introspection Diagnostics / 内核自省诊断

CLI diagnostics SHALL expose `/proc`-style introspection for runtime kernel boundaries, UAPI versioning, context prefix stability, bus backpressure, agent scopes, policy gates, and module status.

CLI diagnostics 必须为 runtime kernel boundaries、UAPI versioning、context prefix stability、bus backpressure、agent scopes、policy gates 与 module status 暴露 `/proc` 风格自省。

#### Scenario: Diagnostics show kernel health / Diagnostics 展示内核健康度

- **WHEN** a user runs release readiness or diagnostics evaluation
- **THEN** the CLI reports kernel-boundary findings, central-file pressure, contract compatibility findings, policy bypass findings, module governance findings, and context cache/prefix findings as structured sections
- **中文** 当用户运行 release readiness 或 diagnostics evaluation 时，CLI 必须以结构化 sections 报告 kernel-boundary findings、central-file pressure、contract compatibility findings、policy bypass findings、module governance findings 与 context cache/prefix findings。
