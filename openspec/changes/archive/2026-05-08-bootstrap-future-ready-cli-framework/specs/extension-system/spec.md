## ADDED Requirements

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
