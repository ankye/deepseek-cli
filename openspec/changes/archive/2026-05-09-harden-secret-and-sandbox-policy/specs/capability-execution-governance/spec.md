## ADDED Requirements

### Requirement: Envelope Declares Secret And Sandbox Requirements / Envelope 声明 Secret 与 Sandbox 要求

Governed execution envelopes SHALL declare secret exposure, redaction class, resource scope, side-effect scope, sandbox requirements, and audit metadata before execution.

governed execution envelopes 必须在 execution 前声明 secret exposure、redaction class、resource scope、side-effect scope、sandbox requirements 和 audit metadata。

#### Scenario: Capability manifest contributes sandbox metadata / Capability Manifest 贡献 Sandbox 元数据

- **WHEN** a capability is registered as model-visible or executable
- **THEN** its manifest declares side effect level, permissions, sandbox requirements, model visibility, executor visibility, and redaction expectations
- **中文** 当 capability 注册为 model-visible 或 executable 时，其 manifest 必须声明 side effect level、permissions、sandbox requirements、model visibility、executor visibility 和 redaction expectations。

#### Scenario: Unsafe envelope is rejected / 不安全 Envelope 被拒绝

- **WHEN** an envelope lacks required secret or sandbox metadata for a side-effecting invocation
- **THEN** runtime rejects it before policy or scheduler execution
- **中文** 当 side-effecting invocation 的 envelope 缺少 required secret 或 sandbox metadata 时，runtime 必须在 policy 或 scheduler execution 前拒绝它。
