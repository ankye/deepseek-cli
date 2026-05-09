## MODIFIED Requirements

### Requirement: Observability Privacy Regression Coverage / 观测隐私回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, and matrix coverage for observability records, privacy settings, export decisions, diagnostic bundles, and no-raw-secret evidence.

regression framework 必须为 observability records、privacy settings、export decisions、diagnostic bundles 和 no-raw-secret evidence 提供 deterministic unit、contract、integration、golden、compatibility 和 matrix 覆盖。

#### Scenario: Golden replay includes observability evidence / golden replay 包含观测证据

- **WHEN** a golden trace includes runtime events and observability records
- **THEN** replay asserts stable schema, privacy decision metadata, redaction summary, and no raw secret-like content
- **中文** 当 golden trace 包含 runtime events 与 observability records 时，replay 必须断言 stable schema、privacy decision metadata、redaction summary 和无 raw secret-like content。

#### Scenario: Matrix covers privacy modes / matrix 覆盖隐私模式

- **WHEN** matrix tests run
- **THEN** they cover default local diagnostics, telemetry disabled, external export denied, explicit local bundle generation, and secret fixtures
- **中文** 当 matrix tests 运行时，必须覆盖 default local diagnostics、telemetry disabled、external export denied、explicit local bundle generation 和 secret fixtures。

#### Scenario: Compatibility requires schemas / compatibility 要求 schema

- **WHEN** compatibility tests inspect observability records and diagnostic bundles
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 observability records 与 diagnostic bundles 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。
