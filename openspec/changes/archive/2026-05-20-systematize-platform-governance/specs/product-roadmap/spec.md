## ADDED Requirements

### Requirement: Roadmap Maturity Labels / 路线图成熟度标签

The product roadmap SHALL use canonical governance maturity labels for risk-bearing capabilities and SHALL distinguish implementation contracts from product readiness.

产品路线图必须为有风险能力使用规范治理成熟度标签，并且必须区分实现契约与产品就绪。

#### Scenario: Roadmap labels gated capability / 路线图标记受门禁能力

- **WHEN** roadmap text describes multi-agent orchestration, command palette/TUI behavior, semantic indexing, remote connectivity, distribution updates, VSCode/server/SDK promotion, or enterprise features
- **THEN** it labels the capability as `implemented`, `partial`, `rollout-gated`, `deferred`, `placeholder`, or `unsupported` and names the promotion evidence required
- **中文** 当路线图描述 multi-agent orchestration、command palette/TUI 行为、semantic indexing、remote connectivity、distribution updates、VSCode/server/SDK promotion 或 enterprise features 时，必须将能力标记为 `implemented`、`partial`、`rollout-gated`、`deferred`、`placeholder` 或 `unsupported`，并说明所需推广证据。

#### Scenario: Contract exists but product is gated / 契约存在但产品受门禁

- **WHEN** a capability has contracts, DTOs, events, or deterministic placeholders but lacks product acceptance evidence
- **THEN** roadmap language records it as `partial`, `rollout-gated`, `deferred`, or `placeholder` rather than product-complete
- **中文** 当某能力已有 contracts、DTOs、events 或确定性占位实现，但缺少产品验收证据时，路线图语言必须将其记录为 `partial`、`rollout-gated`、`deferred` 或 `placeholder`，而不是 product-complete。

### Requirement: Roadmap Evidence Links / 路线图证据链接

Roadmap status entries SHALL cite acceptance evidence, tests, diagnostics, or OpenSpec requirements when claiming product readiness for risk-bearing work.

路线图状态项在声明有风险工作产品就绪时，必须引用 acceptance evidence、tests、diagnostics 或 OpenSpec requirements。

#### Scenario: Product-ready claim cites evidence / 产品就绪声明引用证据

- **WHEN** roadmap marks a risk-bearing capability as implemented or ready for host promotion
- **THEN** the entry cites the relevant acceptance evidence, deterministic tests, or governance diagnostic output that justifies the claim
- **中文** 当路线图将有风险能力标记为 implemented 或 ready for host promotion 时，该条目必须引用相关 acceptance evidence、确定性测试或治理诊断输出来支撑声明。

#### Scenario: Missing evidence remains visible / 缺失证据保持可见

- **WHEN** required evidence is not yet available
- **THEN** the roadmap lists the missing evidence as a gate rather than omitting the capability or overstating completion
- **中文** 当必需证据尚不可用时，路线图必须将缺失证据列为门禁，而不是省略该能力或夸大完成度。

### Requirement: Kernel And Extensibility Roadmap Gates / 内核与扩展性路线图门禁

The product roadmap SHALL gate host promotion, multi-agent write execution, plugin ecosystem expansion, remote/server work, and enterprise distribution on stable kernel and extensibility governance evidence.

产品路线图必须用稳定内核与扩展性治理证据门禁 host promotion、多 agent 写执行、插件生态扩张、remote/server 工作和企业级分发。

#### Scenario: Expansion waits for kernel evidence / 扩张等待内核证据

- **WHEN** roadmap proposes VSCode/server/SDK promotion, default coordinator/worker write execution, signed plugin distribution, remote runtime, or enterprise audit/export work
- **THEN** the roadmap cites kernel-boundary, UAPI compatibility, policy gate, module governance, agent scope, diagnostics, and regression evidence required before launch
- **中文** 当路线图提议 VSCode/server/SDK promotion、默认 coordinator/worker 写执行、签名插件分发、remote runtime 或 enterprise audit/export 工作时，路线图必须引用发布前所需的 kernel-boundary、UAPI compatibility、policy gate、module governance、agent scope、diagnostics 与 regression evidence。

#### Scenario: Stable kernel is the first governance gate / 稳定内核是第一个治理门禁

- **WHEN** roadmap orders governance work for platform hardening
- **THEN** it lists stable runtime kernel governance before UAPI migration, context pipeline/cache, pipe/backpressure, agent scopes, policy-sandbox, plugin marketplace, host promotion, and enterprise governance tracks
- **中文** 当路线图排序平台加固治理工作时，必须将稳定 runtime kernel 治理列在 UAPI migration、context pipeline/cache、pipe/backpressure、agent scopes、policy-sandbox、插件市场、host promotion 与企业治理轨道之前。

### Requirement: Roadmap Tracks Umbrella Closure / 路线图跟踪总纲关闭

The product roadmap SHALL treat the platform governance umbrella as open until required child governance tracks have completion evidence or explicit deferral records.

产品路线图必须将平台治理总纲视为打开状态，直到必需专项治理轨道具备完成证据或显式延期记录。

#### Scenario: Roadmap marks governance complete / 路线图标记治理完成

- **WHEN** roadmap marks the platform governance program as complete
- **THEN** it cites the completed child changes, validation evidence, accepted deferrals, and release-gate impact
- **中文** 当路线图将平台治理 program 标记为完成时，必须引用已完成专项变更、校验证据、已接受延期与发布门禁影响。
