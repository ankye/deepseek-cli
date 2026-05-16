## ADDED Requirements

### Requirement: Strict Tool Family Scoring / 严格工具家族评分
The system SHALL compute tool family scorecards where `pass` contributes `1`, and `partial`, `fail`, `not_assessed`, `planned`, `absent`, and `unavailable` contribute `0`; only explicit `not_applicable` is excluded from denominators.

系统必须计算 tool family scorecards：`pass` 贡献 `1`，`partial`、`fail`、`not_assessed`、`planned`、`absent` 与 `unavailable` 贡献 `0`；只有显式 `not_applicable` 可从分母排除。

#### Scenario: Planned browser does not score / Planned Browser 不得分
- **WHEN** `browser.navigate` is marked `planned` but has no passing implementation and live evidence
- **THEN** the family contributes zero to objective score
- **中文** 当 `browser.navigate` 标记为 `planned` 但没有通过的实现与 live evidence 时，该 family 必须对 objective score 贡献零分。

### Requirement: Family Scorecards Separate Evidence Layers / Family Scorecard 分离证据层
Each family scorecard SHALL separately report catalog presence, implementation status, static contract score, live tool score, task outcome score, and safety score.

每个 family scorecard 必须分别报告 catalog presence、implementation status、static contract score、live tool score、task outcome score 与 safety score。

#### Scenario: Static contract alone cannot prove family / 仅静态契约不能证明 Family
- **WHEN** a family has schemas and manifests but no live model/tool evidence
- **THEN** the static layer may pass but live tool and task outcome layers remain zero
- **中文** 当某个 family 有 schemas 与 manifests 但没有 live model/tool evidence 时，static layer 可以通过，但 live tool 与 task outcome layers 必须保持零分。

### Requirement: Live Family Coverage Proves Full Path / Live Family Coverage 证明完整路径
Live family coverage SHALL prove that the model emitted or selected the operation, preflight accepted or repaired it, policy permitted it, runtime executed it, result feedback returned to the model, and representative task outcome was verified.

live family coverage 必须证明模型发起或选择该 operation、preflight 接受或修复、policy 允许、runtime 执行、结果回灌模型，并且代表性任务结果已验证。

#### Scenario: Missing feedback fails live family / 缺少回灌导致 Live Family 失败
- **WHEN** a tool executes successfully but the result is not returned to the model as bounded provider-neutral feedback
- **THEN** the live family criterion fails
- **中文** 当工具执行成功但结果没有以有界 provider-neutral feedback 回灌给模型时，live family criterion 必须失败。

### Requirement: Parity Matrix Reports Family Counts / Parity Matrix 报告 Family 计数
Diagnostics SHALL emit a parity matrix with total, implemented, live-covered, task-covered, absent, planned, unavailable, and not-applicable family counts.

diagnostics 必须输出 parity matrix，包含 total、implemented、live-covered、task-covered、absent、planned、unavailable 与 not-applicable family counts。

#### Scenario: Aggregate exposes denominator / 聚合暴露分母
- **WHEN** diagnostics renders overall tool-family readiness
- **THEN** it displays the family denominator and cannot present a score using only implemented families
- **中文** 当 diagnostics 渲染整体 tool-family readiness 时，必须显示 family 分母，且不得只用已实现 families 呈现分数。
