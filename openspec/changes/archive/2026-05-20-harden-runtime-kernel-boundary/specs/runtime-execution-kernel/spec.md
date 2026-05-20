## ADDED Requirements

### Requirement: Stable Kernel Responsibility Set / 稳定 Kernel 职责集合

The runtime execution kernel SHALL own only turn lifecycle, execution envelopes, policy handoff, scheduler handoff, canonical event emission, and model/tool continuation orchestration.

Runtime execution kernel 必须只负责 turn lifecycle、execution envelopes、policy handoff、scheduler handoff、canonical event emission 与 model/tool continuation orchestration。

#### Scenario: Subsystem logic stays outside runtime / 子系统逻辑留在 runtime 外

- **WHEN** runtime needs context retrieval, prompt assembly, memory/cache storage, plugin execution, MCP transport, code intelligence, provider serialization, or host rendering
- **THEN** it calls the responsible package through public contracts or injected dependencies instead of importing private implementation logic
- **中文** 当 runtime 需要 context retrieval、prompt assembly、memory/cache storage、plugin execution、MCP transport、code intelligence、provider serialization 或 host rendering 时，必须通过公共契约或注入依赖调用责任包，而不是导入私有实现逻辑。

### Requirement: Kernel Dependency Boundary / Kernel 依赖边界

The runtime execution kernel SHALL reject forbidden dependency directions that couple it to apps, provider SDKs, test fakes, host APIs, or private subsystem internals.

Runtime execution kernel 必须拒绝使其耦合到 apps、provider SDK、test fakes、host APIs 或私有子系统内部实现的禁止依赖方向。

#### Scenario: Forbidden runtime import is detected / 检测到禁止 runtime import

- **WHEN** runtime code imports an app package, VSCode API, Node host-only API outside approved adapters, model SDK, testing fake, or private package path
- **THEN** lint or readiness reports a kernel-boundary diagnostic with owner, severity, and suggested extraction target
- **中文** 当 runtime 代码导入 app package、VSCode API、approved adapter 外的 Node host-only API、model SDK、testing fake 或私有 package path 时，lint 或 readiness 必须报告包含 owner、严重度与建议抽取目标的 kernel-boundary diagnostic。

### Requirement: Explicit Kernel Handoffs / 显式 Kernel Handoff

Cross-subsystem runtime interactions SHALL be represented as public contracts, injected dependencies, or stable service interfaces.

跨子系统 runtime 交互必须表现为公共契约、注入依赖或稳定 service interface。

#### Scenario: Handoff is auditable / Handoff 可审计

- **WHEN** runtime invokes policy, scheduler, context, prompt, model, tool, memory/cache, or bus behavior
- **THEN** the call path identifies the public contract or injected dependency used for the handoff
- **中文** 当 runtime 调用 policy、scheduler、context、prompt、model、tool、memory/cache 或 bus 行为时，调用路径必须识别用于 handoff 的公共契约或注入依赖。

### Requirement: Expiring Runtime Compatibility Shims / 可过期 Runtime 兼容 Shim

Runtime compatibility shims SHALL declare owner, reason, extraction target, expiration trigger, diagnostic id, and release-gate impact.

Runtime compatibility shim 必须声明 owner、原因、抽取目标、过期触发条件、diagnostic id 与发布门禁影响。

#### Scenario: Shim cannot become invisible infrastructure / Shim 不能变成隐形基础设施

- **WHEN** runtime keeps subsystem-owned behavior temporarily for compatibility
- **THEN** diagnostics list the shim and block product-ready claims that depend on it after the expiration trigger
- **中文** 当 runtime 为兼容性暂时保留子系统所有行为时，diagnostics 必须列出该 shim，并在过期触发条件后阻止依赖它的产品就绪声明。
