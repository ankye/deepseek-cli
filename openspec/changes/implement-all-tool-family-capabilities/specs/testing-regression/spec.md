## ADDED Requirements

### Requirement: Regression Covers All 64 Family Implementations / 回归覆盖全部 64 个 Family 实现
The regression suite SHALL include contract, projection, execution, safety, and score math tests for every first-version family.

regression suite 必须为每个第一版 family 包含 contract、projection、execution、safety 与 score math tests。

#### Scenario: Removing a family executor fails tests / 删除 Family Executor 导致测试失败
- **WHEN** an implemented family loses its executor or model-visible projection
- **THEN** regression tests fail and diagnostics report the family as incomplete
- **中文** 当某个已实现 family 丢失 executor 或 model-visible projection 时，regression tests 必须失败，diagnostics 必须报告该 family incomplete。

### Requirement: Acceptance Snapshots Record Family Evidence / Acceptance Snapshot 记录 Family 证据
Acceptance evidence SHALL include family parity snapshots, representative task fixtures, fake connector replay records, and optional live coverage records.

acceptance evidence 必须包含 family parity snapshots、representative task fixtures、fake connector replay records 与可选 live coverage records。

#### Scenario: Missing browser replay lowers score / 缺少 Browser Replay 降低分数
- **WHEN** browser family fake replay evidence is missing
- **THEN** browser implementation may exist but replay/task layers remain zero
- **中文** 当 browser family fake replay evidence 缺失时，browser implementation 可以存在，但 replay/task layers 必须保持零分。
