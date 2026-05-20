# future-capability-landings Specification

## Purpose
Define future capability landing requirements so planned hosts, servers, SDKs, remote runtime, and enterprise features remain gated by evidence.

定义 future capability landings 要求，确保 planned hosts、servers、SDKs、remote runtime 与 enterprise features 受 evidence 门禁约束。

## Requirements
### Requirement: Future Capability Landing Map

The platform SHALL define a landing map for deferred product capabilities so future voice, modal editing, keybindings, rich TUI, notifications, browser/native-host integration, plugin recommendation, team memory sync, daemon/server productization, full sandbox enforcement, and update UI work have clear ownership, package location, dependency boundaries, and activation conditions.

平台必须定义 deferred product capabilities 的 landing map，使未来 voice、modal editing、keybindings、rich TUI、notifications、browser/native-host integration、plugin recommendation、team memory sync、daemon/server productization、full sandbox enforcement 和 update UI 都有明确 ownership、package location、dependency boundaries 和 activation conditions。

#### Scenario: Deferred capability has an owner

- **WHEN** a future product capability is discussed or proposed
- **THEN** the landing map identifies its owning host adapter or platform service, expected source location, required contracts, forbidden dependencies, and promotion criteria

#### Scenario: Deferred capability does not enter runtime by default

- **WHEN** a deferred UX or integration capability is not needed by the headless runtime smoke path
- **THEN** it remains outside first implementation scope while preserving a contract-compatible landing point

### Requirement: Host UX Landing Zones

Host UX capabilities SHALL land in host adapter or host UI packages unless they require shared protocol, command, policy, session, or capability contracts.

host UX capabilities 必须落在 host adapter 或 host UI packages，除非它们需要共享 protocol、command、policy、session 或 capability contracts。

#### Scenario: Voice lands as host input adapter

- **WHEN** voice input, speech-to-text, push-to-talk, or audio capture is added
- **THEN** it lands under the relevant host input package and submits typed host input through `communication-protocol`
- **AND** it does not import runtime internals directly

#### Scenario: Modal editing and keybindings land in CLI host UI

- **WHEN** modal editing, vim-like input, keybindings, history search, or command palette behavior is added
- **THEN** it lands under the CLI host UI/input packages and invokes shared commands through `command-system`

#### Scenario: Rich TUI remains an adapter

- **WHEN** rich terminal UI, virtual scrolling, banners, tips, notifications, or status widgets are added
- **THEN** they render structured protocol/runtime events at the host edge without owning runtime lifecycle, policy, session, or capability execution

### Requirement: External Host Integration Landing Zones

Browser, native-host, desktop, mobile, web, and future IDE integrations SHALL land as host adapters or remote transports that use shared protocol and policy boundaries.

browser、native-host、desktop、mobile、web 和未来 IDE integrations 必须作为 host adapters 或 remote transports 落位，并使用共享 protocol 与 policy boundaries。

#### Scenario: Browser integration uses host adapter boundary

- **WHEN** browser or native-host integration is added
- **THEN** it lands under an application adapter or connector package, authenticates host identity, and communicates through `communication-protocol` or `remote-runtime-connectivity`

#### Scenario: Host integration cannot bypass approval

- **WHEN** an external host requests a side-effecting action
- **THEN** the request routes through policy, approval broker, sandbox, audit, and session boundaries

### Requirement: Recommendation and Discovery Landing Zones

Plugin recommendation, capability recommendation, tips, onboarding, and marketplace discovery SHALL land in discovery/recommendation services backed by plugin, extension, usage, observability, and policy contracts.

plugin recommendation、capability recommendation、tips、onboarding 和 marketplace discovery 必须落在 discovery/recommendation services，并由 plugin、extension、usage、observability 和 policy contracts 支撑。

#### Scenario: Plugin recommendation is policy-gated

- **WHEN** the system recommends a plugin or capability
- **THEN** the recommendation includes source, trust, reason, permission summary, policy state, dismissal state, and audit metadata

#### Scenario: Recommendation UI is host-rendered

- **WHEN** CLI or VSCode displays a recommendation
- **THEN** it renders a structured recommendation event without embedding recommendation policy in host UI code

### Requirement: Team and Enterprise Landing Zones

Team memory sync, enterprise managed settings, shared policy, shared plugin catalogs, and fleet update controls SHALL land as enterprise/team platform services that depend on memory, config, credential, policy, plugin, distribution, and remote connectivity contracts.

team memory sync、enterprise managed settings、shared policy、shared plugin catalogs 和 fleet update controls 必须作为 enterprise/team platform services 落位，并依赖 memory、config、credential、policy、plugin、distribution 和 remote connectivity contracts。

#### Scenario: Team memory sync uses governed memory

- **WHEN** team memory sync is added
- **THEN** it reads and writes through `memory-cache-management` with scope, provenance, redaction, conflict, trust, and audit metadata

#### Scenario: Managed settings override local config

- **WHEN** enterprise managed settings are present
- **THEN** the config layer applies managed precedence rules and records policy/audit metadata before user or workspace settings

### Requirement: Productization Landing Zones

Daemon/server productization, full sandbox enforcement, and update UI SHALL land on top of existing platform contracts without changing headless runtime semantics.

daemon/server productization、full sandbox enforcement 和 update UI 必须构建在现有平台 contracts 之上，不能改变 headless runtime semantics。

#### Scenario: Daemon uses remote runtime contracts

- **WHEN** a local daemon or server product mode is added
- **THEN** it uses `remote-runtime-connectivity`, `communication-protocol`, `session-store`, `credential-auth-management`, policy, observability, and distribution contracts

#### Scenario: Full sandbox enforcement replaces development adapter

- **WHEN** production-grade sandbox enforcement is added
- **THEN** it implements `SandboxRuntime` and `PlatformRuntime` contracts while preserving policy, audit, replay, and fake adapter behavior

#### Scenario: Update UI uses distribution events

- **WHEN** update UI, release channels, migration prompts, or compatibility banners are added
- **THEN** host adapters render structured `distribution-update-management` events and do not own compatibility decisions

### Requirement: Roadmap-Owned Future Landings / 路线图归属的未来能力落点

Future capability landing zones SHALL be owned by roadmap nodes with explicit prerequisites and phase targets.

future capability landing zones 必须由 roadmap nodes 管理，并声明明确 prerequisites 和 phase targets。

#### Scenario: Deferred UX has phase target / 延后 UX 能力声明阶段目标

- **WHEN** a deferred capability such as voice, vim/keybindings, rich TUI, browser/native host, recommendation UI, team memory sync, daemon/server, production sandbox matrix, or update UI is documented
- **THEN** it declares the roadmap node where it can be implemented and the platform prerequisites required first
- **中文** 当记录 voice、vim/keybindings、rich TUI、browser/native host、recommendation UI、team memory sync、daemon/server、production sandbox matrix 或 update UI 等延后能力时，必须声明可实现的路线图节点以及必须先完成的平台前置条件。

#### Scenario: Host UX refinements have explicit R6 landing / Host UX 细化能力有明确 R6 落点

- **WHEN** output styles, theme picker, status line, terminal title, command palette, first-run onboarding, feature tips, history search, or recommendation dismissal state is proposed
- **THEN** the roadmap places it under R6 host UX unless it is required for R1 local readiness, and it declares command/protocol event dependencies
- **中文** 当提出 output styles、theme picker、status line、terminal title、command palette、first-run onboarding、feature tips、history search 或 recommendation dismissal state 时，路线图必须将其放在 R6 host UX 下，除非它是 R1 local readiness 必需能力，并声明 command/protocol event dependencies。

### Requirement: CLI-Gated Future Host Landings / 受 CLI 门禁控制的未来 Host 落点

Future host landing zones SHALL remain reserved or skeletal until the corresponding CLI workflow has passed CLI-first product gates, unless the proposed work is limited to contracts, fixtures, or adapter seams needed to preserve architecture.

未来 host 落点必须保持预留或骨架状态，直到对应 CLI workflow 通过 CLI-first 产品门禁；除非 proposed work 仅限于维护架构所需的 contracts、fixtures 或 adapter seams。

#### Scenario: Deferred host remains a landing zone / 延后 host 保持落点状态

- **WHEN** browser/native host, team memory sync, local daemon/server, VSCode rich UI, public SDK, or update UI work is proposed before the related CLI workflow is proven
- **THEN** the proposal limits the work to landing-zone structure, shared contracts, compatibility fixtures, or protocol seams
- **中文** 当 browser/native host、team memory sync、local daemon/server、VSCode rich UI、public SDK 或 update UI 在相关 CLI workflow 被证明前提出时，proposal 必须把工作限制在 landing-zone structure、shared contracts、compatibility fixtures 或 protocol seams。

#### Scenario: CLI-proven UX can be projected / 已由 CLI 证明的 UX 可以投影

- **WHEN** a deferred host capability is activated after CLI acceptance
- **THEN** it reuses the CLI-proven command/protocol/policy semantics and adds only host-specific rendering, input, transport, or approval adapters
- **中文** 当一个 deferred host capability 在 CLI 验收后被激活时，它必须复用 CLI 已验证的 command/protocol/policy semantics，只增加 host-specific rendering、input、transport 或 approval adapters。

### Requirement: CLI UX Landings Move Earlier / CLI UX 落点前移

CLI UX capabilities that directly affect daily terminal use SHALL be eligible for earlier roadmap nodes than non-CLI host UX, provided they remain host-edge adapters over shared contracts.

直接影响终端日常使用的 CLI UX 能力，只要保持为共享契约之上的 host-edge adapters，就可以比非 CLI host UX 更早进入路线图节点。

#### Scenario: CLI UX is not deferred with all R6 work / CLI UX 不与全部 R6 工作一起延后

- **WHEN** CLI output style, permission prompts, command palette, history search, status line, onboarding, tips, or extension-management UX is needed to make the CLI daily-usable
- **THEN** the roadmap may place it in the CLI-first product track instead of deferring it to a broad R6 multi-host UX phase
- **中文** 当 CLI output style、permission prompts、command palette、history search、status line、onboarding、tips 或 extension-management UX 对 CLI 日常可用性必要时，路线图可以将其放入 CLI-first 产品主线，而不是延后到宽泛的 R6 多端 UX 阶段。
