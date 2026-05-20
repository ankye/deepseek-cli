# tool-family-scorecards Specification

## Purpose
Define tool family scorecard requirements for measuring live, fake, replay, and readiness evidence across tool families.

定义 tool family scorecards 对跨 tool families 的 live、fake、replay 与 readiness evidence 衡量要求。

## Requirements
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

### Requirement: Real DeepSeek Delivery Capability Score Uses Existing Strict Scoring / 真实 DeepSeek 交付能力分数 使用现有严格评分

The system SHALL reach a real DeepSeek tool-family delivery capability score of at least `0.9` without changing score math, denominator rules, family pass rules, or the zero-credit treatment of `fake`, `replayed`, `partial`, `fail`, `not_assessed`, `planned`, `absent`, and `unavailable` results.

系统必须在不修改 score math、denominator rules、family pass rules，以及 `fake`、`replayed`、`partial`、`fail`、`not_assessed`、`planned`、`absent` 与 `unavailable` 零分处理的前提下，使真实 DeepSeek tool-family delivery capability score 达到至少 `0.9`。

#### Scenario: Fake coverage does not inflate real score / Fake 覆盖不抬高真实分

- **WHEN** a family has fake or replayed coverage but lacks complete real DeepSeek live evidence
- **THEN** the real-delivery scorecard keeps the missing live layers at zero and does not mark that family passed
- **中文** 当某个 family 有 fake 或 replayed coverage，但缺少完整真实 DeepSeek live evidence 时，真实交付 scorecard 必须将缺失 live layers 保持为零，且不得将该 family 标记为 passed。

#### Scenario: Delivery capability target maps to family pass count / 交付能力目标映射到 Family 通过数

- **WHEN** the 64-family matrix is used for the real DeepSeek delivery gate
- **THEN** the gate requires at least 58 passing families and `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9`
- **中文** 当 64-family matrix 用作真实 DeepSeek 交付门禁时，门禁必须要求至少 58 个 passing families 且 `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9`。

### Requirement: Live Evidence Proves Complete Family Path / Live 证据证明完整 Family 链路

Each real family pass SHALL be backed by evidence that proves model selection, tool-intent preflight, policy or safety decision, runtime execution, bounded feedback continuation, representative task verification, and provider-native support when applicable.

每个真实 family pass 必须由证据支持，证明 model selection、tool-intent preflight、policy or safety decision、runtime execution、有界 feedback continuation、representative task verification，以及适用时的 provider-native support。

#### Scenario: Missing task or safety evidence blocks pass / 缺少任务或安全证据阻止通过

- **WHEN** live execution succeeds but representative task verification or safety evidence is missing
- **THEN** the family remains non-passing and the diagnostics report the missing layer
- **中文** 当 live execution 成功，但缺少 representative task verification 或 safety evidence 时，该 family 仍然不得通过，diagnostics 必须报告缺失层。

#### Scenario: Provider-native blocker remains honest / Provider-Native 阻塞保持诚实

- **WHEN** a provider or connector family lacks real provider-native evidence
- **THEN** the provider-native layer remains `not_assessed` or `fail`, and fake or local connector evidence does not satisfy it
- **中文** 当 provider 或 connector family 缺少真实 provider-native evidence 时，provider-native 层必须保持 `not_assessed` 或 `fail`，fake 或本地 connector evidence 不得满足该层。

### Requirement: Diagnostics Separates Real And Regression Evidence / Diagnostics 分离真实证据与回归证据

Diagnostics SHALL report real DeepSeek live coverage separately from fake-first, replay, and deterministic regression coverage so users can judge final delivery ability without confusing it with local test coverage.

Diagnostics 必须将真实 DeepSeek live coverage 与 fake-first、replay、deterministic regression coverage 分开报告，使用户可以判断最终交付能力，而不会与本地测试覆盖混淆。

#### Scenario: Report shows blocking layers / 报告显示阻塞层

- **WHEN** the real delivery capability score is below `0.9`
- **THEN** diagnostics lists non-passing family ids, missing layers, and whether the blocker is implementation, live execution, task outcome, safety, or provider-native support
- **中文** 当真实 delivery capability score 低于 `0.9` 时，diagnostics 必须列出未通过 family ids、缺失层，以及阻塞属于 implementation、live execution、task outcome、safety 还是 provider-native support。

