## MODIFIED Requirements

### Requirement: Observability And Privacy Roadmap / 观测与隐私路线图

The runtime message bus SHALL support roadmap acceptance for observability, diagnostics, privacy opt-out, telemetry boundaries, redaction, and local deterministic trace collection before broad product launch.

runtime message bus 必须支持 observability、diagnostics、privacy opt-out、telemetry boundaries、redaction 和 local deterministic trace collection 的路线图验收，且这些能力应在大范围产品发布前建立。

#### Scenario: Diagnostic event is redacted / 诊断事件被脱敏

- **WHEN** a diagnostic, telemetry, analytics, support-bundle, bus, or runtime event is emitted
- **THEN** the event declares or is normalized into data/privacy class, redaction metadata, trace context, opt-out behavior, and persistence policy before storage or host projection
- **中文** 当 diagnostic、telemetry、analytics、support-bundle、bus 或 runtime event 被发出时，该事件必须在存储或 host projection 前声明或被归一化为 data/privacy class、redaction metadata、trace context、opt-out behavior 和 persistence policy。

#### Scenario: Privacy setting affects telemetry boundary / 隐私设置影响遥测边界

- **WHEN** a user disables telemetry or privacy policy denies export
- **THEN** runtime keeps deterministic local diagnostics while preventing external telemetry export and recording the decision in audit-safe metadata
- **中文** 当用户关闭 telemetry 或 privacy policy 拒绝导出时，runtime 必须保留 deterministic local diagnostics，同时阻止 external telemetry export，并以 audit-safe metadata 记录该决策。

#### Scenario: Bus records enter diagnostic bundle / bus records 进入诊断包

- **WHEN** bus or runtime replay records are included in a diagnostic bundle
- **THEN** only canonical redacted observability records or redacted replay summaries are included, never private subsystem state or raw payload secrets
- **中文** 当 bus 或 runtime replay records 被包含进 diagnostic bundle 时，只能包含 canonical redacted observability records 或 redacted replay summaries，不能包含 private subsystem state 或 raw payload secrets。
