## ADDED Requirements

### Requirement: Context Projection Budget Decision / Context Projection 预算决策

The usage budget service SHALL provide deterministic context-token budget inputs to ContextGraph projection before model dispatch.

usage budget service 必须在 model dispatch 前向 ContextGraph projection 提供确定性的 context-token budget inputs。

#### Scenario: Projection receives hard and soft limits / Projection 接收硬软限制

- **WHEN** runtime prepares projection for a model target
- **THEN** the budget service provides hard context limit, soft context target, reserved output budget, and budget policy metadata
- **中文** 当 runtime 为 model target 准备 projection 时，budget service 必须提供 hard context limit、soft context target、reserved output budget 和 budget policy metadata。

### Requirement: Token Estimation Is Deterministic By Default / Token 估算默认确定性

Context projection token estimation SHALL be deterministic in default tests and SHALL NOT require live provider tokenizers.

context projection token estimation 在默认测试中必须是确定性的，且不得要求 live provider tokenizers。

#### Scenario: Fake estimator drives default tests / Fake estimator 驱动默认测试

- **WHEN** default unit, integration, golden, matrix, or e2e tests run
- **THEN** they use deterministic token estimation fixtures and do not require network access or provider SDK calls
- **中文** 当默认 unit、integration、golden、matrix 或 e2e tests 运行时，必须使用 deterministic token estimation fixtures，且不要求 network access 或 provider SDK calls。

### Requirement: Projection Budget Evidence / Projection 预算证据

Projection budget decisions SHALL be emitted as structured usage evidence for replay and host summaries.

projection budget decisions 必须作为 structured usage evidence 发出，用于 replay 与 host summaries。

#### Scenario: Budget decision is replayable / 预算决策可 replay

- **WHEN** a projection result is recorded
- **THEN** it includes estimated input tokens, hard limit, soft target, reserved output tokens, selected token total, excluded token estimate, and decision reason
- **中文** 当 projection result 被记录时，必须包含 estimated input tokens、hard limit、soft target、reserved output tokens、selected token total、excluded token estimate 和 decision reason。
