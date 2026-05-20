## ADDED Requirements

### Requirement: Package-Level Evidence Matrix / 包级 Evidence Matrix

The regression system SHALL produce or validate a package-level evidence matrix for risk-bearing packages and host surfaces.

回归系统必须为有风险 packages 与 host surfaces 生成或校验包级 evidence matrix。

#### Scenario: Matrix distinguishes evidence types / 矩阵区分证据类型

- **WHEN** evidence is reported for a package or capability
- **THEN** the matrix distinguishes contract, integration, golden, matrix, e2e, live smoke, acceptance, and readiness evidence
- **中文** 当为 package 或 capability 报告 evidence 时，矩阵必须区分 contract、integration、golden、matrix、e2e、live smoke、acceptance 与 readiness evidence。

### Requirement: Risk-Based Evidence Thresholds / 基于风险的证据阈值

Evidence requirements SHALL vary by package risk tier, capability maturity, and host surface.

证据要求必须根据 package risk tier、capability maturity 与 host surface 变化。

#### Scenario: Contract-only evidence is not product readiness / Contract-only 不等于产品就绪

- **WHEN** a risk-bearing capability has only contract tests
- **THEN** the matrix marks product readiness as gated unless required integration, acceptance, e2e, live smoke, or readiness evidence is attached
- **中文** 当有风险能力只有 contract tests 时，矩阵必须将产品就绪标记为 gated，除非附加了必需的 integration、acceptance、e2e、live smoke 或 readiness evidence。

### Requirement: Stable Evidence Output / 稳定 Evidence 输出

Evidence matrix output SHALL be deterministic, redacted, and suitable for acceptance fixtures.

Evidence matrix 输出必须确定性、脱敏，并适合 acceptance fixtures。

#### Scenario: Matrix output is fixture-friendly / 矩阵输出适合 Fixture

- **WHEN** the matrix emits JSON or JSONL
- **THEN** records include stable ids, package, capability, evidence type, status, missing evidence, severity, and next action
- **中文** 当矩阵输出 JSON 或 JSONL 时，records 必须包含 stable ids、package、capability、evidence type、status、missing evidence、severity 与 next action。

### Requirement: Test-First Implementation Gate / 测试先行实现门禁

Non-documentation implementation work SHALL add or update focused behavior coverage before implementation code is changed.

非文档实现工作必须在修改实现代码前，先增加或更新聚焦的行为覆盖。

#### Scenario: Implementation starts with coverage / 实现从覆盖开始

- **WHEN** a change modifies implementation code under `src/**`
- **THEN** the change first adds or updates unit, contract, regression, golden, matrix, integration, or e2e coverage for the behavior
- **中文** 当变更修改 `src/**` 下的实现代码时，变更必须先增加或更新该行为的 unit、contract、regression、golden、matrix、integration 或 e2e 覆盖。

#### Scenario: Untestable implementation records exception / 无法先测的实现记录例外

- **WHEN** no practical test can be written before implementation
- **THEN** the OpenSpec task or design records the reason, risk, and substitute verification before implementation begins
- **中文** 当确实无法在实现前编写实用测试时，OpenSpec task 或 design 必须先记录原因、风险和替代验证方式，然后才能开始实现。
