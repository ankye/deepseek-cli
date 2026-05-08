## ADDED Requirements

### Requirement: Optional Live Provider Test Gate / 可选 Live Provider 测试门禁

The testing framework SHALL keep live provider tests outside default test commands and SHALL expose them through an explicit optional script and environment gate.

testing framework 必须把 live provider tests 排除在默认 test commands 之外，并通过明确的 optional script 和 environment gate 暴露。

#### Scenario: Default tests do not run live provider / 默认测试不运行 live provider

- **WHEN** `npm test` runs
- **THEN** it does not require network access, DeepSeek credentials, provider availability, or account balance
- **中文** 当 `npm test` 运行时，它不得要求 network access、DeepSeek credentials、provider availability 或 account balance。

#### Scenario: Live smoke has structural assertions / Live smoke 使用结构断言

- **WHEN** optional live smoke runs against DeepSeek
- **THEN** it asserts normalized event structure, non-empty assistant text, redacted credential handling, and terminal completion without snapshotting exact model text
- **中文** 当 optional live smoke 针对 DeepSeek 运行时，它必须断言 normalized event structure、non-empty assistant text、redacted credential handling 和 terminal completion，而不是 snapshot 精确模型文本。
