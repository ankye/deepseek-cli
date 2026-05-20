# extension-system Specification

## Purpose
Define extension system requirements for extension lifecycle, authentication boundaries, contribution projection, and promotion beyond current placeholders.

定义 extension system 对 extension lifecycle、authentication boundaries、contribution projection 与超越当前 placeholders 的推广要求。

## Requirements
### Requirement: Manifest-Driven Extension System

The system SHALL define an extension manifest format for id, version, source, publisher metadata, contribution points, permissions, side-effect levels, host compatibility, activation conditions, configuration schema, and integrity metadata.

系统必须定义 extension manifest 格式，覆盖 id、version、source、publisher metadata、contribution points、permissions、side-effect levels、host compatibility、activation conditions、configuration schema 和 integrity metadata。

#### Scenario: Load valid extension manifest

- **WHEN** the extension loader discovers a valid manifest from an enabled source
- **THEN** it validates identity, version, contributions, permissions, compatibility, and integrity metadata before registration

#### Scenario: Reject invalid extension manifest

- **WHEN** an extension manifest is missing required identity, compatibility, contribution, or permission metadata
- **THEN** the extension loader rejects it with a structured validation error

### Requirement: Extension Sources and Trust

The extension system SHALL distinguish built-in, user, workspace, and future catalog sources, and SHALL require explicit trust or policy approval before enabling untrusted or side-effecting extensions.

extension system 必须区分 built-in、user、workspace 和 future catalog sources，并且必须在启用 untrusted 或 side-effecting extensions 前要求显式 trust 或 policy approval。

#### Scenario: Untrusted workspace extension is disabled by default

- **WHEN** a workspace extension is discovered without established trust
- **THEN** it remains disabled until trust policy or user approval enables it

#### Scenario: Trusted built-in extension loads automatically

- **WHEN** a built-in extension is shipped with the framework and matches the compatibility range
- **THEN** it can be enabled by default according to configuration and policy

### Requirement: Contribution Points

The extension system SHALL support typed contribution points for tools, commands, skills, agent definitions, hooks, MCP connectors, resources, renderers, context providers, memory providers, cache providers, policy fragments, workflow templates, model profiles, output/rendering styles, and host capabilities.

extension system 必须支持 typed contribution points，覆盖 tools、commands、skills、agent definitions、hooks、MCP connectors、resources、renderers、context providers、memory providers、cache providers、policy fragments、workflow templates、model profiles、output/rendering styles 和 host capabilities。

#### Scenario: Register tool contribution

- **WHEN** an enabled extension contributes a tool
- **THEN** the loader registers it as a typed capability with the capability registry

#### Scenario: Register context provider contribution

- **WHEN** an enabled extension contributes a context provider
- **THEN** the loader exposes it through the context engine boundary without requiring CLI-specific imports

#### Scenario: Register command contribution

- **WHEN** an enabled extension contributes a command
- **THEN** the loader passes it to the command system for validation, enablement, projection, and invocation ownership

#### Scenario: Register agent contribution

- **WHEN** an enabled extension contributes an agent definition
- **THEN** the loader passes the definition to the agent management layer for validation, enablement, and lifecycle ownership

### Requirement: Extension Loading Boundary

The extension system SHALL convert validated contributions into shared package contracts and SHALL NOT allow extensions to mutate runtime internals directly.

extension system 必须把校验后的 contributions 转换为共享 package contracts，并且不能允许 extensions 直接修改 runtime internals。

#### Scenario: Extension contribution uses shared contracts

- **WHEN** an extension contributes behavior to the runtime
- **THEN** it does so through capability, command, skill, hook, MCP, agent definition, context, memory, cache, policy, workflow template, model profile, renderer, or host protocol contracts

#### Scenario: Side-effecting contribution uses policy and sandbox

- **WHEN** an extension contribution can mutate filesystem, process, network, environment, or workspace state
- **THEN** its execution is routed through policy, approval, sandbox, and audit boundaries

### Requirement: MCP and External Resource Adapter Model

The extension system SHALL model MCP connectors and external resources as explicit contributions with permissions, timeouts, transport metadata, and audit boundaries.

extension system 必须把 MCP connectors 和 external resources 建模为显式 contributions，并包含 permissions、timeouts、transport metadata 和 audit boundaries。

#### Scenario: MCP connector contribution is registered

- **WHEN** an enabled extension contributes an MCP connector
- **THEN** the connector is represented as typed capabilities and resources with declared transport and permission metadata

### Requirement: Host-Agnostic Extension Surface

Extensions SHALL be usable by CLI, VSCode, tests, and future server modes through shared contracts, with host-specific rendering and approval handled by application adapters.

extensions 必须通过共享 contracts 被 CLI、VSCode、测试和未来 server modes 使用，host-specific rendering 和 approval 由 application adapters 处理。

#### Scenario: Extension does not depend on CLI rendering

- **WHEN** an extension contributes a renderer or UI hint
- **THEN** it declares host-agnostic rendering metadata
- **AND** the CLI or VSCode adapter decides how to display it

### Requirement: Extension Roadmap Sequencing / 扩展系统路线图排序

The extension system SHALL align skills, commands, hooks, MCP, plugins, plugin lockfiles, marketplaces, signed packages, and contribution rendering with roadmap nodes.

extension system 必须让 skills、commands、hooks、MCP、plugins、plugin lockfiles、marketplaces、signed packages 和 contribution rendering 与 roadmap nodes 对齐。

#### Scenario: Extension feature declares node / 扩展功能声明节点

- **WHEN** a skill, hook, MCP, plugin, marketplace, or contribution feature is proposed
- **THEN** the proposal declares whether it belongs to R3 extensibility, R6 product UX/collaboration, or R7 enterprise/ecosystem
- **中文** 当提出 skill、hook、MCP、plugin、marketplace 或 contribution 功能时，proposal 必须声明它属于 R3 extensibility、R6 product UX/collaboration 还是 R7 enterprise/ecosystem。

### Requirement: Extension Contribution Summaries / 扩展贡献摘要

The extension system SHALL expose contribution summaries for CLI management that normalize plugins, skills, MCP connectors, commands, hooks, renderer hints, and future contribution points as manifest metadata rather than execution authority.

Extension system 必须为 CLI management 暴露 contribution summaries，将 plugins、skills、MCP connectors、commands、hooks、renderer hints 和未来 contribution points 归一化为 manifest metadata，而不是 execution authority。

#### Scenario: Contribution summary is inert / 贡献摘要是惰性元数据
- **WHEN** CLI extension management lists contributions
- **THEN** each contribution record includes manifest id, source, contribution point, target id, trust, permissions, provenance, and `pit.legacy-contribution-normalization.manifest-boundary` without executing the contribution
- **中文** 当 CLI extension management 列出 contributions 时，每条 contribution record 必须包含 manifest id、source、contribution point、target id、trust、permissions、provenance 和 `pit.legacy-contribution-normalization.manifest-boundary`，且不执行该 contribution。

#### Scenario: Host rendering remains adapter-owned / Host 渲染仍归适配器所有
- **WHEN** an extension declares renderer hints
- **THEN** CLI management records the hint as host-agnostic metadata and the CLI adapter decides whether and how to render it
- **中文** 当 extension 声明 renderer hints 时，CLI management 必须把 hint 记录为 host-agnostic metadata，并由 CLI adapter 决定是否以及如何渲染。

### Requirement: Extension Contributions Feed Composition / 扩展贡献进入组合层

Extension contribution summaries SHALL feed the composition layer through manifest metadata only and SHALL NOT grant execution authority.

Extension contribution summaries 必须只通过 manifest metadata 输入 composition layer，且不得授予执行权。

#### Scenario: Extension command contribution is normalized / 扩展命令贡献被归一化
- **WHEN** an extension contributes a command, skill, hook, MCP connector, renderer hint, or workflow template
- **THEN** the composition layer records the contribution owner, source, permissions, target id, and `pit.legacy-contribution-normalization.manifest-boundary` before any host projects it
- **中文** 当 extension 贡献 command、skill、hook、MCP connector、renderer hint 或 workflow template 时，composition layer 必须在任何 host 投影前记录 contribution owner、source、permissions、target id 和 `pit.legacy-contribution-normalization.manifest-boundary`。

#### Scenario: Renderer hint is host-only / Renderer Hint 只属于 Host
- **WHEN** an extension contributes a renderer hint
- **THEN** composition marks it host-visible only and excludes it from model-visible projection
- **中文** 当 extension 贡献 renderer hint 时，composition 必须将其标记为仅 host-visible，并从 model-visible projection 排除。

### Requirement: First-Party Contributions Feed Extension Summaries / 一方贡献进入扩展摘要

The extension system SHALL expose first-party plugin contributions as extension contribution summaries that preserve manifest id, plugin id, version, source, trust, permissions, side effects, target id, host support, and provenance.

extension system 必须将一方 plugin contributions 暴露为 extension contribution summaries，并保留 manifest id、plugin id、version、source、trust、permissions、side effects、target id、host support 与 provenance。

#### Scenario: Extension list includes first-party contributions / Extension List 包含一方贡献

- **WHEN** CLI or a future host lists extension contributions
- **THEN** first-party plugin commands, palette entries, result-list providers, keymaps, renderer hints, context providers, and memory/cache metadata appear as inert contribution summaries
- **AND** each summary includes plugin provenance and the manifest-boundary pit fixture id
- **中文** 当 CLI 或未来 host 列出 extension contributions 时，一方 plugin commands、palette entries、result-list providers、keymaps、renderer hints、context providers 与 memory/cache metadata 必须作为惰性 contribution summaries 出现；每条 summary 必须包含 plugin provenance 与 manifest-boundary pit fixture id。

#### Scenario: Host rendering remains adapter-owned / Host 渲染仍归适配器

- **WHEN** a first-party plugin declares a renderer hint for TUI, palette, JSON, JSONL, or VSCode
- **THEN** the extension system records the hint as host-agnostic metadata and the host adapter decides how to render it
- **中文** 当一方插件声明 TUI、palette、JSON、JSONL 或 VSCode 的 renderer hint 时，extension system 必须将 hint 记录为 host-agnostic metadata，并由 host adapter 决定如何渲染。

### Requirement: First-Party Activation Checks / 一方贡献激活检查

The extension system SHALL run the same validation, compatibility, permission, credential, trust, and policy checks for first-party plugin contributions as for other extension contributions, while allowing built-in trusted contributions to be enabled by the release profile.

extension system 必须对一方 plugin contributions 运行与其他 extension contributions 相同的 validation、compatibility、permission、credential、trust 与 policy checks，同时允许 built-in trusted contributions 按 release profile 启用。

#### Scenario: Incompatible first-party contribution degrades / 不兼容一方贡献降级

- **WHEN** a first-party contribution declares an incompatible platform, host, schema, or package compatibility range
- **THEN** activation returns typed degraded or disabled evidence and does not register the contribution with the owning subsystem
- **中文** 当一方 contribution 声明了不兼容 platform、host、schema 或 package compatibility range 时，activation 必须返回 typed degraded 或 disabled evidence，且不得将该 contribution 注册给 owning subsystem。

#### Scenario: Credential-backed contribution requires grant / 凭证型贡献需要 Grant

- **WHEN** a first-party contribution declares a credential-backed operation
- **THEN** activation checks scoped credential grants before registration and reports typed auth-denied evidence when the grant is missing
- **中文** 当一方 contribution 声明 credential-backed operation 时，activation 必须在 registration 前检查 scoped credential grants，grant 缺失时报告 typed auth-denied evidence。
