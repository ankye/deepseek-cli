## ADDED Requirements

### Requirement: CLI Diagnostics Regression / CLI 诊断回归

The testing regression suite SHALL include deterministic coverage for CLI diagnostics bundle, diagnostics release readiness, doctor, privacy, and verify-install outputs.

testing regression suite 必须为 CLI diagnostics bundle、diagnostics release readiness、doctor、privacy 和 verify-install outputs 提供确定性覆盖。

#### Scenario: Diagnostics CLI smoke is deterministic / Diagnostics CLI Smoke 确定性

- **WHEN** CLI diagnostics tests run
- **THEN** they assert text, JSON, and JSONL outputs parse deterministically, contain stable kinds and schema versions, and do not include raw secret-like fixture values
- **中文** 当 CLI diagnostics tests 运行时，必须断言 text、JSON 和 JSONL outputs 可确定性解析，包含稳定 kind 与 schema versions，且不包含 raw secret-like fixture values。

#### Scenario: Release readiness package surface is tested / 发布就绪包表面被测试

- **WHEN** release-readiness tests run
- **THEN** they assert expected CLI package files, bin entry, publish access, ignored generated bundles, and required verification command names
- **中文** 当 release-readiness tests 运行时，必须断言 expected CLI package files、bin entry、publish access、ignored generated bundles 和 required verification command names。

### Requirement: Support Bundle Redaction Regression / 支持包脱敏回归

The regression suite SHALL test full serialization of support-bundle outputs against raw secret, credential, env, plugin, MCP, trace, and path fixture leaks.

regression suite 必须测试 support-bundle outputs 的完整序列化，防止 raw secret、credential、env、plugin、MCP、trace 和 path fixture 泄漏。

#### Scenario: Bundle serialization is safe / Bundle 序列化安全

- **WHEN** support-bundle tests serialize CLI diagnostics bundle output
- **THEN** the serialized output excludes raw secret values and includes `pit.diagnostic-redaction.support-bundle`
- **中文** 当 support-bundle tests 序列化 CLI diagnostics bundle output 时，serialized output 必须排除 raw secret values，并包含 `pit.diagnostic-redaction.support-bundle`。

#### Scenario: External export denial is tested / 外部导出拒绝被测试

- **WHEN** support-upload or external telemetry is requested without explicit export permission
- **THEN** tests assert the privacy decision is `deny-export` and no records are included in the external payload
- **中文** 当在没有显式 export permission 时请求 support-upload 或 external telemetry，测试必须断言 privacy decision 是 `deny-export`，且 external payload 不包含 records。
