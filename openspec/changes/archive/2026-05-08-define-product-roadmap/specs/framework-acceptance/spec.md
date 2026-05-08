## ADDED Requirements

### Requirement: Roadmap Acceptance Gates / 路线图验收门禁

Framework acceptance SHALL include roadmap-node gates for product scope, platform integration, host behavior, regression evidence, documentation, and launch readiness.

framework acceptance 必须包含 roadmap-node gates，覆盖 product scope、platform integration、host behavior、regression evidence、documentation 和 launch readiness。

#### Scenario: Node acceptance is explicit / 节点验收必须明确

- **WHEN** a roadmap node is implemented
- **THEN** acceptance evidence identifies which user-visible behavior, platform contracts, host adapters, and tests prove readiness
- **中文** 当路线图节点被实现时，验收证据必须说明哪些用户可见行为、平台契约、host adapters 和测试能够证明可发布性。

#### Scenario: Stable launch requires roadmap evidence / 稳定发布必须有路线图证据

- **WHEN** a feature is promoted to beta or stable
- **THEN** the acceptance record includes roadmap node, known limitations, regression suites, and rollback or disable plan
- **中文** 当功能推进到 beta 或 stable 时，验收记录必须包含路线图节点、已知限制、回归套件以及回滚或禁用方案。

### Requirement: Product Readiness Acceptance Coverage / 产品可用性验收覆盖

Framework acceptance SHALL require explicit evidence for local readiness, credential safety, observability/privacy, code intelligence, SDK/API compatibility, model capability governance, and host UX landing points when a roadmap node includes those areas.

framework acceptance 必须在路线图节点包含 local readiness、credential safety、observability/privacy、code intelligence、SDK/API compatibility、model capability governance 和 host UX landing points 时要求明确证据。

#### Scenario: R1 local readiness has smoke evidence / R1 本地可用性有 smoke 证据

- **WHEN** R1 acceptance is reviewed
- **THEN** init, config, credential reference setup, doctor diagnostics, privacy setting, install verification, and no-live-provider default behavior have smoke or contract evidence
- **中文** 当评审 R1 acceptance 时，init、config、credential reference setup、doctor diagnostics、privacy setting、install verification 和 no-live-provider default behavior 必须有 smoke 或 contract evidence。

#### Scenario: Privacy and credential evidence is mandatory / 隐私与凭证证据必需

- **WHEN** a node touches credentials, telemetry, diagnostics, memory, persisted traces, or support bundles
- **THEN** acceptance evidence proves redaction, opt-out behavior, data/privacy class, and no raw secret persistence
- **中文** 当节点涉及 credentials、telemetry、diagnostics、memory、persisted traces 或 support bundles 时，验收证据必须证明 redaction、opt-out behavior、data/privacy class 和 no raw secret persistence。
