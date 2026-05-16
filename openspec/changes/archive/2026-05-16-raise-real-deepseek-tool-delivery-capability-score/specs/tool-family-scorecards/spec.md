## ADDED Requirements

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
