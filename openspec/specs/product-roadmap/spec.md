# product-roadmap Specification

## Purpose
TBD - created by archiving change define-product-roadmap. Update Purpose after archive.
## Requirements
### Requirement: Canonical Product Roadmap / 规范产品路线图

The project SHALL maintain a canonical product roadmap that orders DeepSeek CLI capabilities into staged roadmap nodes from foundation through enterprise ecosystem maturity.

项目必须维护 canonical product roadmap，将 DeepSeek CLI 能力按 staged roadmap nodes 排序，从 foundation 到 enterprise ecosystem maturity。

#### Scenario: Roadmap drives next work / 路线图驱动下一步工作

- **WHEN** the team decides what to build next
- **THEN** the roadmap identifies the active node, required dependencies, launch gate, owner packages, and acceptance criteria
- **中文** 当团队决定下一步建设内容时，路线图必须标识当前节点、必需依赖、发布门禁、责任包和验收标准。

#### Scenario: Roadmap is source controlled / 路线图进入版本控制

- **WHEN** roadmap scope changes
- **THEN** changes are reviewed through OpenSpec and reflected in `docs/product/product-roadmap.md`
- **中文** 当路线图范围发生变化时，变更必须通过 OpenSpec 评审，并同步反映到 `docs/product/product-roadmap.md`。

### Requirement: Reference-Informed Capability Mapping / 参考驱动能力映射

The roadmap SHALL map reference-source product domains to DeepSeek-owned architecture areas without copying reference implementation boundaries or source code.

路线图必须把 reference-source product domains 映射到 DeepSeek-owned architecture areas，且不得复制参考实现边界或源码。

#### Scenario: Reference capability is mapped / 参考能力被映射

- **WHEN** a capability appears in the reference source such as tools, commands, skills, plugins, MCP, hooks, tasks, remote, server, IDE, voice, vim, keybindings, sync, memory, policy, or update
- **THEN** the roadmap maps it to a DeepSeek roadmap node and platform owner area
- **中文** 当参考源码中出现 tools、commands、skills、plugins、MCP、hooks、tasks、remote、server、IDE、voice、vim、keybindings、sync、memory、policy 或 update 等能力时，路线图必须把它映射到 DeepSeek 的路线图节点和平台责任域。

#### Scenario: Reference code is not imported / 不导入参考代码

- **WHEN** roadmap artifacts mention reference-source evidence
- **THEN** they summarize capability domains and do not include copied implementation code
- **中文** 当路线图工件提到参考源码证据时，只能总结能力领域，不得包含复制的实现代码。

### Requirement: Roadmap Node Metadata / 路线图节点元数据

Every product roadmap node SHALL declare product scope, platform scope, owner packages, prerequisites, acceptance gates, regression levels, launch gate, risk class, data/privacy class, host surfaces, protocol impact, feature flag, migration/rollback policy, and follow-up OpenSpec candidates.

每个 product roadmap node 必须声明 product scope、platform scope、owner packages、prerequisites、acceptance gates、regression levels、launch gate、risk class、data/privacy class、host surfaces、protocol impact、feature flag、migration/rollback policy 和 follow-up OpenSpec candidates。

#### Scenario: Future OpenSpec declares roadmap node / 后续 OpenSpec 声明路线图节点

- **WHEN** a future feature proposal is created
- **THEN** it declares the roadmap node, launch gate, owner packages, dependencies, required test levels, risk class, data/privacy class, host surfaces, protocol impact, feature flag, and migration/rollback policy
- **中文** 当未来创建 feature proposal 时，必须声明路线图节点、发布门禁、责任包、依赖、必需测试等级、risk class、data/privacy class、host surfaces、protocol impact、feature flag 和 migration/rollback policy。

#### Scenario: Node cannot launch without gates / 节点缺少门禁不得发布

- **WHEN** a roadmap node is marked complete
- **THEN** its required acceptance gates and regression evidence exist before archive or release tagging
- **中文** 当路线图节点被标记完成时，必须先具备对应验收门禁和回归证据，才能 archive 或打 release tag。

#### Scenario: Metadata exposes privacy and rollout risk / 元数据暴露隐私与发布风险

- **WHEN** a roadmap node touches credentials, memory, telemetry, diagnostics, protocol schemas, persisted state, or external connectors
- **THEN** the node declares data/privacy class, rollout controls, migration/rollback behavior, and required redaction evidence
- **中文** 当路线图节点涉及 credentials、memory、telemetry、diagnostics、protocol schemas、persisted state 或 external connectors 时，该节点必须声明 data/privacy class、rollout controls、migration/rollback behavior 和必需 redaction evidence。

### Requirement: Staged Competitive Parity / 分阶段竞品对齐

The roadmap SHALL stage competitive parity across foundation, MVP coding agent, context/safety, extensibility, IDE/server, multi-agent engineering, product UX/collaboration, and enterprise/ecosystem nodes.

路线图必须把 competitive parity 分阶段推进，覆盖 foundation、MVP coding agent、context/safety、extensibility、IDE/server、multi-agent engineering、product UX/collaboration 和 enterprise/ecosystem nodes。

#### Scenario: Parity is phased / 对齐分阶段推进

- **WHEN** a competitor capability is identified
- **THEN** it is assigned to the earliest safe roadmap node rather than forcing immediate implementation
- **中文** 当识别到竞品能力时，必须把它分配到最早安全可承载的路线图节点，而不是强制立即实现。

#### Scenario: Product UX waits for platform readiness / 产品体验等待平台就绪

- **WHEN** a product UX capability depends on protocol, session, safety, remote, or extension maturity
- **THEN** the roadmap places it after those platform dependencies
- **中文** 当产品 UX 能力依赖 protocol、session、safety、remote 或 extension 成熟度时，路线图必须把它放在这些平台依赖之后。

### Requirement: Explicit Readiness And Governance Landings / 显式可用性与治理落点

The roadmap SHALL explicitly place local readiness, personal credentials, observability/privacy, code intelligence, public SDK/control API, model capability governance, and host UX refinements into roadmap nodes instead of leaving them as implied subfeatures.

路线图必须显式安排 local readiness、personal credentials、observability/privacy、code intelligence、public SDK/control API、model capability governance 和 host UX refinements 的节点落点，不能把它们隐含在大功能下面。

#### Scenario: R1 includes local readiness / R1 包含本地可用性

- **WHEN** R1 MVP Coding Agent is scoped
- **THEN** it includes init, config/settings validation, credential setup, logout, doctor diagnostics, privacy settings, and install verification acceptance
- **中文** 当定义 R1 MVP Coding Agent 范围时，必须包含 init、config/settings validation、credential setup、logout、doctor diagnostics、privacy settings 和 install verification 的验收。

#### Scenario: R2 includes code intelligence and privacy diagnostics / R2 包含代码智能与隐私诊断

- **WHEN** R2 Context And Safety is scoped
- **THEN** it includes code intelligence evidence, diagnostic bundle redaction, privacy opt-out, and no-raw-secret persistence checks
- **中文** 当定义 R2 Context And Safety 范围时，必须包含 code intelligence evidence、diagnostic bundle redaction、privacy opt-out 和 no-raw-secret persistence checks。

#### Scenario: R4 includes public SDK/control API / R4 包含公共 SDK/control API

- **WHEN** R4 IDE And Server is scoped
- **THEN** it includes versioned public runtime SDK/control API schemas and versioning fixtures
- **中文** 当定义 R4 IDE And Server 范围时，必须包含版本化 public runtime SDK/control API schemas 和 versioning fixtures。

