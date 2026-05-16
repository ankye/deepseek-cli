## ADDED Requirements

### Requirement: Capability Family Metadata / Capability 家族元数据
The capability registry SHALL require every model-visible capability projection to include tool domain id, tool family id, risk class, maturity state, operation profiles, host requirements, and scorecard rubric id.

capability registry 必须要求每个 model-visible capability projection 包含 tool domain id、tool family id、risk class、maturity state、operation profiles、host requirements 与 scorecard rubric id。

#### Scenario: Missing family metadata blocks projection / 缺少 Family 元数据阻止投影
- **WHEN** an executable capability lacks a valid catalog family id
- **THEN** the registry rejects model-visible projection with a typed validation diagnostic
- **中文** 当 executable capability 缺少有效 catalog family id 时，registry 必须以 typed validation diagnostic 拒绝 model-visible projection。

### Requirement: Family-Aware Projection Filtering / 感知 Family 的投影过滤
The registry SHALL support filtering model-visible capabilities by family, domain, risk class, connector trust, host requirements, policy, and agent scope.

registry 必须支持按 family、domain、risk class、connector trust、host requirements、policy 与 agent scope 过滤 model-visible capabilities。

#### Scenario: Agent scope denies family / Agent Scope 拒绝 Family
- **WHEN** an active agent scope denies the `browser.*` domain
- **THEN** registry projection excludes all browser family capabilities even if individual capability ids are enabled
- **中文** 当 active agent scope 拒绝 `browser.*` domain 时，即使单个 capability id 已启用，registry projection 也必须排除所有 browser family capabilities。

### Requirement: Capability Id Does Not Imply Family / Capability ID 不隐式等于 Family
The registry SHALL NOT infer tool family solely from capability id prefixes; explicit catalog metadata is required.

registry 不得仅从 capability id 前缀推断 tool family；必须要求显式 catalog metadata。

#### Scenario: External capability declares family / 外部 Capability 声明 Family
- **WHEN** an MCP or plugin tool exposes an id such as `plugin.foo.run`
- **THEN** it must declare its catalog family before it can become model-visible
- **中文** 当 MCP 或 plugin tool 暴露类似 `plugin.foo.run` 的 id 时，它必须先声明 catalog family，之后才能成为 model-visible。
