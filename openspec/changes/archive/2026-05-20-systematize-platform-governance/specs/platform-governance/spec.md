## ADDED Requirements

### Requirement: Platform Governance Taxonomy / 平台治理分类

The platform SHALL classify package, capability, host, and evidence status using the canonical maturity states `implemented`, `partial`, `rollout-gated`, `deferred`, `placeholder`, and `unsupported`.

平台必须使用规范成熟度状态 `implemented`、`partial`、`rollout-gated`、`deferred`、`placeholder` 与 `unsupported` 来分类 package、capability、host 和 evidence 状态。

#### Scenario: Review uses canonical status / 审查使用规范状态

- **WHEN** a governance record describes remote runtime, update management, semantic indexing, multi-agent orchestration, host promotion, or enterprise distribution status
- **THEN** it assigns one canonical maturity state and includes a short rationale, owner package, and release-risk severity
- **中文** 当治理记录描述 remote runtime、update management、semantic indexing、多 agent orchestration、host promotion 或 enterprise distribution 状态时，必须分配一个规范成熟度状态，并包含简短理由、owner package 与发布风险严重度。

#### Scenario: Placeholder is not product-ready / 占位不等于产品就绪

- **WHEN** a capability is backed only by deterministic in-memory or static placeholder behavior
- **THEN** governance classifies the capability as `placeholder` or `rollout-gated` rather than `implemented` for product readiness
- **中文** 当某能力仅由确定性内存或静态占位行为支撑时，治理必须把该能力按产品就绪分类为 `placeholder` 或 `rollout-gated`，而不是 `implemented`。

### Requirement: Governance Records / 治理记录

The platform SHALL expose structured governance records for risk-bearing capabilities, including status, owner, evidence ids, missing evidence, promotion gate, and suggested next action.

平台必须为有风险能力暴露结构化治理记录，包含状态、owner、evidence ids、缺失证据、推广门禁和建议下一步。

#### Scenario: Governance record is machine-readable / 治理记录可机器读取

- **WHEN** diagnostics or readiness tooling emits a governance finding
- **THEN** the finding includes a stable id, affected package or capability, canonical maturity state, severity, evidence references, and redaction metadata
- **中文** 当 diagnostics 或 readiness tooling 输出治理发现时，该发现必须包含稳定 id、受影响 package 或 capability、规范成熟度状态、严重度、证据引用和 redaction metadata。

#### Scenario: Missing evidence is explicit / 缺失证据显式化

- **WHEN** a capability is marked `partial`, `rollout-gated`, `deferred`, or `placeholder`
- **THEN** the governance record lists the evidence required to promote it and the package or host surface responsible for producing that evidence
- **中文** 当某能力标记为 `partial`、`rollout-gated`、`deferred` 或 `placeholder` 时，治理记录必须列出推广所需证据，以及负责产出该证据的 package 或 host surface。

### Requirement: Promotion Gates / 推广门禁

The platform SHALL prevent roadmap or release readiness from treating gated capabilities as product-ready until their governance records cite accepted evidence.

平台必须阻止 roadmap 或 release readiness 在缺少已验收证据前把受门禁控制的能力视为产品就绪。

#### Scenario: Host promotion requires CLI evidence / Host 推广需要 CLI 证据

- **WHEN** a VSCode, server, SDK, browser/native, team, or enterprise workflow is proposed as product-ready
- **THEN** governance requires CLI-proven protocol behavior, policy/audit evidence, deterministic tests, and documented CLI behavior before promotion
- **中文** 当 VSCode、server、SDK、browser/native、team 或 enterprise workflow 被声明为产品就绪时，治理必须要求 CLI 已验证的 protocol 行为、policy/audit evidence、确定性测试和已记录 CLI 行为，然后才能推广。

#### Scenario: Release readiness rejects conflicting claims / 发布就绪拒绝冲突声明

- **WHEN** release metadata claims a capability is implemented but governance evidence classifies it as `placeholder`, `deferred`, or missing required evidence
- **THEN** readiness reports a release-blocking diagnostic unless the claim is downgraded or evidence is attached
- **中文** 当 release metadata 声称某能力已实现，但治理证据将其分类为 `placeholder`、`deferred` 或缺少必需证据时，readiness 必须报告 release-blocking diagnostic，除非该声明被降级或补充证据。

### Requirement: Stable Runtime Kernel First Governance Gate / 稳定 Runtime Kernel 优先治理门禁

The platform governance program SHALL treat stable runtime kernel governance as the first required child governance track before host expansion, plugin ecosystem promotion, multi-agent write execution, remote runtime, or enterprise distribution work can be promoted.

平台治理 program 必须将稳定 runtime kernel 治理作为第一个必需专项治理轨道，然后才能推广 host 扩张、插件生态、多 agent 写执行、remote runtime 或企业级分发工作。

#### Scenario: Kernel boundary is governed before expansion / 扩张前治理内核边界

- **WHEN** a roadmap, proposal, or readiness claim promotes VSCode/server/SDK hosts, plugin marketplace, coordinator/worker writes, remote execution, or enterprise distribution
- **THEN** governance requires accepted evidence for runtime kernel ownership, allowed responsibilities, forbidden dependencies, owner-package boundaries, policy handoff, scheduler handoff, event emission, and central-file pressure
- **中文** 当 roadmap、proposal 或 readiness claim 推广 VSCode/server/SDK hosts、插件市场、coordinator/worker 写入、remote execution 或企业级分发时，治理必须要求 runtime kernel ownership、允许职责、禁止依赖、owner-package boundaries、policy handoff、scheduler handoff、event emission 与中心文件压力的已验收证据。

#### Scenario: Kernel exception is explicit / 内核例外显式化

- **WHEN** a change temporarily keeps subsystem logic inside runtime for compatibility
- **THEN** governance records the exception owner, reason, extraction target, expiration trigger, severity, and release-gate impact
- **中文** 当变更为兼容性暂时将子系统逻辑留在 runtime 内时，治理必须记录例外 owner、原因、抽取目标、过期触发条件、严重度与发布门禁影响。

### Requirement: Placeholder Ownership / 占位实现归属

Every deterministic placeholder used for runtime assembly SHALL declare its intended consumers, blocked product claims, replacement trigger, and acceptance evidence required for promotion.

每个用于 runtime 组装的确定性占位实现都必须声明预期消费方、被阻止的产品声明、替换触发条件，以及推广所需验收证据。

#### Scenario: Placeholder implementation is allowed for tests / 测试允许使用占位实现

- **WHEN** testing fakes or platform assembly instantiate a placeholder implementation
- **THEN** governance records it as allowed for deterministic assembly while also marking any real product capability claim as gated
- **中文** 当测试 fake 或平台组装实例化占位实现时，治理必须记录它可用于确定性组装，同时将任何真实产品能力声明标记为 gated。

#### Scenario: Placeholder replacement has trigger / 占位替换有触发条件

- **WHEN** a placeholder-backed capability appears in the roadmap or diagnostics
- **THEN** governance includes the trigger that replaces it, such as real network transport, signed update catalog, semantic provider evidence, or host adapter acceptance
- **中文** 当占位支撑的能力出现在路线图或 diagnostics 中时，治理必须包含替换触发条件，例如真实网络 transport、签名更新目录、semantic provider evidence 或 host adapter acceptance。

### Requirement: Kernel And Extensibility Governance Principles / 内核与扩展性治理原则

The platform SHALL govern DeepSeek as a small runtime kernel with stable UAPI contracts, VFS-like context references, bounded pipes, scoped agents, mandatory policy gates, introspection diagnostics, and governed modules.

平台必须将 DeepSeek 治理为一个小 runtime kernel，配套稳定 UAPI contracts、VFS-like context references、有界 pipes、scoped agents、强制 policy gates、introspection diagnostics 与受治理 modules。

#### Scenario: Governance classifies kernel boundary risk / 治理分类内核边界风险

- **WHEN** a change adds runtime logic for context retrieval, prompt assembly, plugin execution, MCP transport, memory storage, host rendering, code intelligence, or provider-specific serialization
- **THEN** governance requires the proposal to justify why the logic belongs in `runtime` instead of the owner package, or report a kernel-boundary risk
- **中文** 当变更向 runtime 增加 context retrieval、prompt assembly、plugin execution、MCP transport、memory storage、host rendering、code intelligence 或 provider-specific serialization 逻辑时，治理必须要求 proposal 说明该逻辑为何属于 `runtime` 而不是 owner package，或报告 kernel-boundary risk。

#### Scenario: Governance records extensibility safety / 治理记录扩展安全性

- **WHEN** a plugin, MCP server, extension, skill, hook, subagent, or future host adapter contributes behavior
- **THEN** governance records its manifest, permissions, policy boundary, public contract path, diagnostics surface, disable/unload semantics, and evidence requirements
- **中文** 当 plugin、MCP server、extension、skill、hook、subagent 或未来 host adapter 贡献行为时，治理必须记录其 manifest、permissions、policy boundary、public contract path、diagnostics surface、禁用/卸载语义和证据要求。

### Requirement: Central File Pressure Governance / 中心文件压力治理

The platform SHALL report governance diagnostics when central runtime, app entrypoint, or package export files exceed configured size or ownership thresholds.

当中心 runtime、app entrypoint 或 package export 文件超过配置的规模或 ownership 阈值时，平台必须报告治理诊断。

#### Scenario: Central file growth is visible / 中心文件增长可见

- **WHEN** `agent-loop.ts`, app entrypoints, package `index.ts` files, or lint-framework central files grow beyond configured thresholds
- **THEN** governance diagnostics identify the file, owner packages that should absorb extracted logic, and whether the issue is informational, warning, or release-blocking
- **中文** 当 `agent-loop.ts`、app entrypoints、package `index.ts` 文件或 lint-framework 中心文件超过配置阈值时，治理诊断必须识别该文件、应吸收拆分逻辑的 owner packages，以及该问题是 informational、warning 还是 release-blocking。

### Requirement: Umbrella Governance Closure Gate / 总纲治理关闭门禁

The platform governance umbrella change SHALL remain open until required child governance tracks are completed, validated, and linked as closure evidence, or explicitly deferred with release-risk rationale.

平台治理总纲变更必须保持打开，直到必需专项治理轨道完成、校验并作为关闭证据链接，或带发布风险理由显式延期。

#### Scenario: Child governance remains open / 专项治理仍打开

- **WHEN** required child governance tracks are incomplete or lack validation evidence
- **THEN** the umbrella governance change is not archived
- **中文** 当必需专项治理轨道未完成或缺少校验证据时，不得归档治理总纲变更。

#### Scenario: Deferred child requires evidence / 延期专项需要证据

- **WHEN** a required child governance track is deferred
- **THEN** governance records the deferral reason, owner, risk severity, follow-up change, and release-gate impact
- **中文** 当必需专项治理轨道被延期时，治理必须记录延期原因、owner、风险严重度、后续变更与发布门禁影响。

#### Scenario: Closure evidence is linked / 关闭证据被链接

- **WHEN** the umbrella governance change is ready to archive
- **THEN** it cites completed child changes, validation evidence, and any accepted deferral records
- **中文** 当治理总纲变更准备归档时，必须引用已完成专项变更、校验证据与任何已接受延期记录。
