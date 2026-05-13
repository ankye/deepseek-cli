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

### Requirement: CLI-First Roadmap Sequencing / CLI 优先路线排序

The canonical product roadmap SHALL sequence user-facing product work so the CLI becomes the first polished daily-use surface before IDE, server, SDK, browser/native, team collaboration, or enterprise product surfaces become product priorities.

规范产品路线图必须对用户可见产品工作进行排序，使 CLI 先成为第一个成熟的日常使用界面，然后 IDE、server、SDK、browser/native、team collaboration 或 enterprise 产品面才成为产品优先级。

#### Scenario: Immediate sequence favors CLI / 近期顺序优先 CLI

- **WHEN** the roadmap lists immediate recommended OpenSpecs
- **THEN** CLI interaction, CLI approvals/permissions, CLI diagnostics, CLI packaging, CLI extension management, and CLI release readiness are prioritized before R4 host expansion unless a shared platform blocker must be fixed first
- **中文** 当路线图列出近期推荐 OpenSpec 时，必须优先 CLI interaction、CLI approvals/permissions、CLI diagnostics、CLI packaging、CLI extension management 和 CLI release readiness，再推进 R4 host expansion，除非必须先修复共享平台阻塞点。

#### Scenario: Roadmap explains deferred hosts / 路线图解释延后 host

- **WHEN** VSCode, server, SDK, browser/native, team sync, or enterprise surfaces appear in the roadmap
- **THEN** the roadmap identifies them as follow-on projections or later phases gated by CLI acceptance evidence and shared protocol stability
- **中文** 当路线图出现 VSCode、server、SDK、browser/native、team sync 或 enterprise surfaces 时，必须说明它们是由 CLI 验收证据和共享协议稳定性门禁控制的后续投影或后续阶段。

### Requirement: CLI Evidence Before Cross-Host Parity / 跨端对齐前必须具备 CLI 证据

The roadmap SHALL require CLI evidence before a capability is considered ready for cross-host parity work.

路线图必须要求一个能力在进入跨端对齐前先具备 CLI 证据。

#### Scenario: Cross-host roadmap item cites CLI proof / 跨端路线项引用 CLI 证明

- **WHEN** a roadmap node or future OpenSpec promotes a CLI capability to another host
- **THEN** it references the CLI smoke, golden replay, policy/audit trace, protocol fixture, and docs evidence that define the product behavior being projected
- **中文** 当路线图节点或未来 OpenSpec 将 CLI 能力推广到另一个 host 时，必须引用定义该产品行为的 CLI smoke、golden replay、policy/audit trace、protocol fixture 和文档证据。

#### Scenario: CLI-first does not weaken contracts / CLI-first 不削弱契约

- **WHEN** the roadmap prioritizes CLI work
- **THEN** it still requires package boundaries, shared contracts, protocol events, host-agnostic runtime execution, and deterministic regression gates
- **中文** 当路线图优先 CLI 工作时，仍必须要求 package boundaries、shared contracts、protocol events、host-agnostic runtime execution 和 deterministic regression gates。

### Requirement: Roadmap Tracks Directory And Pit Coverage / 路线图跟踪目录与坑位覆盖

The roadmap SHALL require future product-facing OpenSpecs to record directory plans, reference capability coverage, and reference pit fixture coverage so large CLI features do not rely on memory or implicit intent.

路线图必须要求后续面向产品的 OpenSpec 记录目录计划、参考能力覆盖和参考坑位 fixture 覆盖，使大型 CLI 功能不依赖记忆或隐含意图。

#### Scenario: Future OpenSpec includes scale metadata / 后续 OpenSpec 包含规模元数据

- **WHEN** a future OpenSpec proposes a large CLI-facing capability
- **THEN** its metadata includes owner packages, new folders, public exports, private modules, fixture/test locations, file-size split triggers, mapped reference capability areas, and applicable reference pit fixtures
- **中文** 当后续 OpenSpec 提出大型 CLI-facing capability 时，其 metadata 必须包含 owner packages、新目录、公开导出、私有模块、fixture/test 位置、文件体量拆分触发条件、映射的参考能力域，以及适用的参考坑位 fixtures。

### Requirement: Large CLI OpenSpecs Include Interaction Impact / 大型 CLI OpenSpec 包含交互影响

The product roadmap SHALL require large CLI-facing OpenSpecs to declare terminal capability impact, vi-inspired composition impact, and request/turn revert impact when they affect input, rendering, navigation, command ergonomics, multi-file context, recovery, or extension UX.

产品路线图必须要求大型 CLI-facing OpenSpec 在影响 input、rendering、navigation、command ergonomics、多文件上下文、recovery 或 extension UX 时声明 terminal capability impact、vi-inspired composition impact 和 request/turn revert impact。

#### Scenario: Host UX proposal includes terminal impact / Host UX 提案包含终端影响

- **WHEN** a future roadmap item or OpenSpec changes CLI input, rendering, prompts, approvals, diagnostics, result navigation, or command surfaces
- **THEN** it identifies affected terminal profiles, input strategies, renderer profiles, fallback behavior, fixtures, and parity evidence
- **中文** 当后续 roadmap item 或 OpenSpec 修改 CLI input、rendering、prompts、approvals、diagnostics、result navigation 或 command surfaces 时，必须标识受影响的 terminal profiles、input strategies、renderer profiles、fallback behavior、fixtures 和 parity evidence。

#### Scenario: Multi-file workflow includes composition impact / 多文件工作流包含组合模型影响

- **WHEN** a future CLI capability adds file references, search results, diagnostics, code intelligence results, diffs, sessions, tasks, or extension-provided objects
- **THEN** it states how those objects participate in reference sets, result lists, jump history, actions, targets, command palette entries, keymaps, and plugin contribution contracts
- **中文** 当后续 CLI capability 增加 file references、search results、diagnostics、code intelligence results、diffs、sessions、tasks 或 extension-provided objects 时，必须说明这些对象如何参与 reference sets、result lists、jump history、actions、targets、command palette entries、keymaps 和 plugin contribution contracts。

#### Scenario: Recovery workflow includes revert impact / 恢复工作流包含回退影响

- **WHEN** a future CLI capability adds or changes workspace mutations, session turns, context projection, checkpointing, tool evidence, or recovery commands
- **THEN** it states whether request/turn-scoped revert applies, what can be restored automatically, what must be reported as stale or non-reversible, and which evidence proves original history remains immutable
- **中文** 当后续 CLI capability 增加或修改 workspace mutations、session turns、context projection、checkpointing、tool evidence 或 recovery commands 时，必须说明 request/turn-scoped revert 是否适用、哪些内容可自动恢复、哪些内容必须报告为 stale 或 non-reversible，以及哪些 evidence 证明原始历史保持不可变。
