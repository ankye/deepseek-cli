## ADDED Requirements

### Requirement: Layered Delivery Regression Suite / 分层交付回归套件

The testing regression framework SHALL include deterministic and optional live-gated regression coverage for the layered delivery workflow.

testing regression framework 必须为 layered delivery workflow 提供 deterministic 与可选 live-gated regression 覆盖。

#### Scenario: Known benchmark gaps become product regressions / 已知评测缺口转为产品回归

- **WHEN** a live benchmark exposes a product gap such as pager hang, missing JSON schema validation, id/name semantic mismatch, absent memory gate, or adapter-only success
- **THEN** the gap is captured as a unit, contract, integration, golden, matrix, e2e, or live-gated regression at the owning layer
- **中文** 当 live benchmark 暴露 pager hang、missing JSON schema validation、id/name semantic mismatch、absent memory gate 或 adapter-only success 等产品缺口时，该缺口必须在负责层转化为 unit、contract、integration、golden、matrix、e2e 或 live-gated regression。

#### Scenario: Regression proves adapter slimness / 回归证明 Adapter 瘦身

- **WHEN** evaluation adapter tests run
- **THEN** they assert the adapter does not inject hidden task-specific solving rules and that product behavior is reproducible through CLI/runtime capabilities
- **中文** 当 evaluation adapter tests 运行时，必须断言 adapter 不注入隐藏任务专用解题规则，且产品行为可通过 CLI/runtime capabilities 复现。

### Requirement: Delivery Layer Evidence Is Replayable / 交付层证据可回放

Regression artifacts SHALL capture redacted, replayable evidence for each required delivery layer.

regression artifacts 必须为每个 required delivery layer 捕获脱敏、可回放证据。

#### Scenario: Golden trace includes layer outcomes / Golden Trace 包含层级结果

- **WHEN** a golden trace captures a structured or mutating agent task
- **THEN** it includes prompt assembly sections, tool envelopes, output contract verification, repair attempts, memory/context decisions, and terminal delivery layer summary
- **中文** 当 golden trace 捕获结构化或有副作用的 agent task 时，必须包含 prompt assembly sections、tool envelopes、output contract verification、repair attempts、memory/context decisions 与 terminal delivery layer summary。
