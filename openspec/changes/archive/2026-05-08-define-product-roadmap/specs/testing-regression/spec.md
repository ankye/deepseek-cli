## ADDED Requirements

### Requirement: Roadmap Regression Levels / 路线图回归等级

The testing framework SHALL require every roadmap node to declare the minimum regression level needed for implementation and launch.

测试框架必须要求每个 roadmap node 声明 implementation 和 launch 所需的 minimum regression level。

#### Scenario: Node declares test ladder / 节点声明测试阶梯

- **WHEN** a roadmap node is planned
- **THEN** it declares required unit, contract, integration, golden, e2e, matrix, compatibility, and optional live-provider tests
- **中文** 当规划路线图节点时，必须声明必需的 unit、contract、integration、golden、e2e、matrix、compatibility 和可选 live-provider 测试。

#### Scenario: Product node adds scenario coverage / 产品节点增加场景覆盖

- **WHEN** a node introduces user-visible product workflow
- **THEN** a scenario or e2e smoke test covers the host-visible workflow before beta launch
- **中文** 当节点引入用户可见产品流程时，必须在 beta 发布前用 scenario 或 e2e smoke test 覆盖 host 可见流程。

#### Scenario: Readiness and governance fixtures are declared / 声明可用性与治理 fixtures

- **WHEN** a roadmap node includes local readiness, credentials, observability/privacy, code intelligence, SDK/API, or model capability governance
- **THEN** it declares fixtures for no-live-provider execution, redacted diagnostics, credential references, compatibility schemas, fallback decisions, and deterministic replay as applicable
- **中文** 当路线图节点包含 local readiness、credentials、observability/privacy、code intelligence、SDK/API 或 model capability governance 时，必须按需声明 no-live-provider execution、redacted diagnostics、credential references、compatibility schemas、fallback decisions 和 deterministic replay fixtures。
