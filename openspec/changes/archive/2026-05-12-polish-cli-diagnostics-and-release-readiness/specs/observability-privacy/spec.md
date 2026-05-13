## ADDED Requirements

### Requirement: CLI Support Bundle Projection / CLI 支持包投影

Observability diagnostic bundles SHALL be safe for CLI support-bundle projection in text, JSON, and JSONL output modes.

observability diagnostic bundles 必须可安全投影到 CLI support-bundle 的 text、JSON 和 JSONL output modes。

#### Scenario: CLI bundle projection is redacted / CLI Bundle 投影被脱敏

- **WHEN** CLI diagnostics renders a diagnostic bundle
- **THEN** the rendered artifact contains schema version, bundle id, privacy decision, redaction summary, selected counts, compatibility metadata, and records without raw env values, auth headers, credentials, private file contents, plugin tokens, or copied reference implementation details
- **中文** 当 CLI diagnostics 渲染 diagnostic bundle 时，rendered artifact 必须包含 schema version、bundle id、privacy decision、redaction summary、selected counts、compatibility metadata 和不含 raw env values、auth headers、credentials、private file contents、plugin tokens 或复制参考实现细节的 records。

#### Scenario: External support upload is denied by default / 外部支持上传默认拒绝

- **WHEN** CLI diagnostics evaluates support upload or external telemetry without explicit privacy settings that allow it
- **THEN** observability returns a denied privacy decision before any external payload is produced
- **中文** 当 CLI diagnostics 在没有显式允许的 privacy settings 时评估 support upload 或 external telemetry，observability 必须在产生任何 external payload 前返回 denied privacy decision。

### Requirement: Diagnostics Pit Evidence / 诊断坑位证据

Diagnostic bundle outputs SHALL preserve reference pit fixture ids used for redaction and environment snapshot coverage.

diagnostic bundle outputs 必须保留用于 redaction 与 environment snapshot coverage 的 reference pit fixture ids。

#### Scenario: Support bundle cites diagnostic pit / 支持包引用诊断坑位

- **WHEN** support-bundle tests cover redaction of support material
- **THEN** evidence includes `pit.diagnostic-redaction.support-bundle` and serializes safely without raw secret material
- **中文** 当 support-bundle tests 覆盖支持材料脱敏时，evidence 必须包含 `pit.diagnostic-redaction.support-bundle`，并且序列化后不包含 raw secret material。

#### Scenario: Environment snapshot pit is visible / 环境快照坑位可见

- **WHEN** diagnostics include startup environment or credential-presence metadata
- **THEN** evidence includes `pit.env-snapshot.immutable-startup` or an explicit deferral, and never reads mutable env values after the diagnostics snapshot is assembled
- **中文** 当 diagnostics 包含 startup environment 或 credential-presence metadata 时，evidence 必须包含 `pit.env-snapshot.immutable-startup` 或明确 deferred，且在 diagnostics snapshot 组装后不得读取 mutable env values。
