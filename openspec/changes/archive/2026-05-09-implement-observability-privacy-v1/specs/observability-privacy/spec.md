## ADDED Requirements

### Requirement: Canonical Observability Records / 标准观测记录

The platform SHALL normalize emitted observability events into versioned canonical records before storage, replay, diagnostic bundle generation, or host projection.

平台必须在 storage、replay、diagnostic bundle generation 或 host projection 之前，将 emitted observability events 归一化为版本化 canonical records。

#### Scenario: Event becomes canonical record / event 转为标准记录

- **WHEN** a runtime, bus, provider, policy, or diagnostic event is emitted
- **THEN** the stored record includes schema version, record id, event kind, timestamp, name, fields, data/privacy class, redaction metadata, trace metadata when available, persistence policy, compatibility metadata, and privacy decision metadata
- **中文** 当 runtime、bus、provider、policy 或 diagnostic event 被发出时，stored record 必须包含 schema version、record id、event kind、timestamp、name、fields、data/privacy class、redaction metadata、可用 trace metadata、persistence policy、compatibility metadata 和 privacy decision metadata。

### Requirement: Privacy Defaults / 隐私默认值

The observability system SHALL default to local deterministic diagnostics and SHALL deny external telemetry/export unless explicitly allowed.

observability system 必须默认使用 local deterministic diagnostics，并且除非显式允许，否则必须拒绝 external telemetry/export。

#### Scenario: Telemetry is disabled by default / 默认关闭遥测

- **WHEN** no privacy settings are provided
- **THEN** local diagnostic records can be retained, external telemetry is disabled, and export attempts are denied with an audit-safe privacy decision
- **中文** 当未提供 privacy settings 时，local diagnostic records 可以保留，external telemetry 关闭，export attempts 必须以 audit-safe privacy decision 被拒绝。

#### Scenario: Privacy opt-out keeps local diagnostics / 隐私退出保留本地诊断

- **WHEN** telemetry is disabled or external export is denied
- **THEN** deterministic local diagnostics remain available while external export is blocked and recorded as redacted metadata
- **中文** 当 telemetry 关闭或 external export 被拒绝时，deterministic local diagnostics 必须仍可用，同时 external export 被阻止并以脱敏 metadata 记录。

### Requirement: Diagnostic Bundle Generation / 诊断包生成

The observability system SHALL generate bounded diagnostic bundles containing redacted canonical records, redaction summaries, privacy decisions, and generation metadata.

observability system 必须生成有界 diagnostic bundles，包含脱敏 canonical records、redaction summaries、privacy decisions 和 generation metadata。

#### Scenario: Bundle contains redacted evidence / bundle 包含脱敏证据

- **WHEN** a diagnostic bundle is generated from observability records
- **THEN** the bundle includes schema version, bundle id, generated timestamp, selected record count, redaction summary, privacy decision, compatibility metadata, and records without raw secret values
- **中文** 当 diagnostic bundle 从 observability records 生成时，bundle 必须包含 schema version、bundle id、generated timestamp、selected record count、redaction summary、privacy decision、compatibility metadata 和不含 raw secret values 的 records。

#### Scenario: Bundle respects record limits / bundle 遵守记录上限

- **WHEN** more records exist than the requested bundle limit
- **THEN** the bundle includes only the bounded subset and records truncation metadata without leaking dropped record payloads
- **中文** 当 records 数量超过 requested bundle limit 时，bundle 只能包含有界子集，并记录 truncation metadata，且不得泄漏被丢弃 record payload。

### Requirement: Secret-Safe Redaction / Secret 安全脱敏

Observability storage and diagnostic bundles SHALL classify and redact raw API keys, bearer tokens, env-style credentials, passwords, and private-key-like content before persistence.

observability storage 与 diagnostic bundles 必须在 persistence 前 classify 并 redact raw API keys、bearer tokens、env-style credentials、passwords 和 private-key-like content。

#### Scenario: Secret fixture does not persist / secret fixture 不持久化

- **WHEN** event fields contain secret-like strings
- **THEN** drained records, diagnostic bundles, replay traces, and assertion output contain redacted markers instead of raw values
- **中文** 当 event fields 包含 secret-like strings 时，drained records、diagnostic bundles、replay traces 和 assertion output 必须包含 redacted markers，而不是 raw values。

### Requirement: Export Policy Decisions / 导出策略决策

Diagnostic export SHALL be mediated by privacy settings and export policy before any external transfer is attempted.

diagnostic export 必须在任何 external transfer 尝试前由 privacy settings 与 export policy 介入决策。

#### Scenario: Export denied before transfer / 导出在传输前被拒绝

- **WHEN** a caller requests external export while telemetry or external export is disabled
- **THEN** the system returns a denied privacy decision and no transport/export payload is produced
- **中文** 当调用方在 telemetry 或 external export 关闭时请求 external export，系统必须返回 denied privacy decision，且不产生 transport/export payload。

### Requirement: Compatibility And Replay / 兼容性与回放

Observability records and diagnostic bundles SHALL be schema-versioned and replayable through the deterministic regression harness.

observability records 与 diagnostic bundles 必须带 schema version，并可通过 deterministic regression harness replay。

#### Scenario: Schema version is required / 必须包含 schema version

- **WHEN** compatibility tests inspect observability records or diagnostic bundles
- **THEN** each persisted artifact declares a supported schema version or fails closed with a deterministic diagnostic
- **中文** 当 compatibility tests 检查 observability records 或 diagnostic bundles 时，每个 persisted artifact 必须声明 supported schema version，否则以 deterministic diagnostic 安全失败。
