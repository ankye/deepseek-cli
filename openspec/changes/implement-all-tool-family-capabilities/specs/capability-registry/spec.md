## ADDED Requirements

### Requirement: Family-Aware Projection Filtering Is Enforced / 强制 Family-Aware 投影过滤
The registry SHALL filter model-visible capabilities by family id, domain id, risk class, host requirements, connector trust, provider support, policy, and agent scope.

registry 必须按 family id、domain id、risk class、host requirements、connector trust、provider support、policy 与 agent scope 过滤 model-visible capabilities。

#### Scenario: Denied family is excluded / 被拒绝 Family 被排除
- **WHEN** an agent scope denies `image.*`
- **THEN** `image.generate`, `image.edit`, `image.search-stock`, and `image.inspect` capabilities are excluded from model-visible projection
- **中文** 当 agent scope 拒绝 `image.*` 时，`image.generate`、`image.edit`、`image.search-stock` 与 `image.inspect` capabilities 必须从 model-visible projection 中排除。

### Requirement: Concrete Tool Registration Must Be Complete / 真实工具注册必须完整
The registry SHALL reject model-visible executable capability registration when the manifest lacks valid family metadata, output bounds, timeout, risk metadata, or required security fields.

当 manifest 缺少有效 family metadata、output bounds、timeout、risk metadata 或必要 security fields 时，registry 必须拒绝 model-visible executable capability registration。

#### Scenario: Missing timeout blocks projection / 缺少 Timeout 阻止投影
- **WHEN** an executable family tool registers without a timeout policy
- **THEN** the registry returns a stable validation diagnostic and does not expose it to the model
- **中文** 当 executable family tool 注册时没有 timeout policy，registry 必须返回稳定 validation diagnostic，并且不向模型暴露该工具。
