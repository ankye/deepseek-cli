# plugin-system Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Plugin Package Model

The platform SHALL define plugins as distributable packages that bundle extensions, skills, tools, agents, hooks, MCP connectors, resources, renderers, workflow templates, model profiles, and configuration fragments without becoming a privileged runtime boundary.

平台必须把 plugins 定义为可分发 packages，用于打包 extensions、skills、tools、agents、hooks、MCP connectors、resources、renderers、workflow templates、model profiles 和 configuration fragments，但 plugin 本身不能成为特权 runtime boundary。

#### Scenario: Plugin contributes multiple package items

- **WHEN** a plugin package is validated and enabled
- **THEN** each contribution is converted into the corresponding platform contract and registered with its owning subsystem

#### Scenario: Plugin cannot mutate runtime internals

- **WHEN** a plugin package loads
- **THEN** it can only affect runtime through declared contribution points, policy-approved commands, and governed platform contracts

### Requirement: Plugin Manifest, Integrity, and Lockfile

The plugin system SHALL define plugin manifests with identity, version, publisher, source, integrity metadata, dependency metadata, contribution declarations, permissions, compatibility ranges, activation conditions, and optional install options, and SHALL support a lockfile for reproducible installs.

plugin system 必须定义 plugin manifest，包含 identity、version、publisher、source、integrity metadata、dependency metadata、contribution declarations、permissions、compatibility ranges、activation conditions 和可选 install options，并且必须支持 lockfile 以实现可复现安装。

#### Scenario: Install locked plugin version

- **WHEN** a plugin is installed from a lockfile entry
- **THEN** the plugin manager resolves the exact version, source, integrity hash, dependency set, and compatibility metadata before activation

#### Scenario: Reject integrity mismatch

- **WHEN** a downloaded or cached plugin artifact does not match declared integrity metadata
- **THEN** the plugin system rejects the artifact and records an audit event

### Requirement: Plugin Sources, Marketplace, and Installation Scopes

The plugin system SHALL model built-in, local directory, workspace, user, enterprise-managed, registry, and future marketplace sources with explicit installation scopes and trust levels.

plugin system 必须建模 built-in、local directory、workspace、user、enterprise-managed、registry 和未来 marketplace sources，并为它们定义显式 installation scopes 与 trust levels。

#### Scenario: Managed plugin overrides user preference

- **WHEN** an enterprise-managed policy requires or blocks a plugin
- **THEN** the plugin system applies the managed policy before user or workspace enablement settings

#### Scenario: Workspace plugin requires trust

- **WHEN** a workspace plugin is discovered
- **THEN** it remains disabled until workspace trust, policy, and versioning checks allow it

### Requirement: Plugin Lifecycle Management

The plugin system SHALL support discovery, validation, install, enable, disable, update, rollback, uninstall, cache refresh, orphan detection, dependency resolution, and startup health checks.

plugin system 必须支持 discovery、validation、install、enable、disable、update、rollback、uninstall、cache refresh、orphan detection、dependency resolution 和 startup health checks。

#### Scenario: Startup health check quarantines plugin

- **WHEN** a plugin fails validation, dependency resolution, versioning checks, or policy checks during startup
- **THEN** it is quarantined or disabled without preventing the base runtime from starting

#### Scenario: Plugin update has rollback path

- **WHEN** a plugin update is applied
- **THEN** the previous enabled version remains recoverable according to retention and compatibility policy

### Requirement: Plugin Permission Diff and Audit

The plugin system SHALL present and record permission diffs when installing, enabling, or updating plugins, and SHALL maintain audit records for plugin lifecycle actions and contribution activation.

plugin system 必须在 install、enable 或 update plugins 时呈现并记录 permission diff，并且必须为 plugin lifecycle actions 和 contribution activation 维护 audit records。

#### Scenario: Plugin update requests broader permission

- **WHEN** a plugin update adds filesystem, process, network, memory, cache, model, host, or workspace permissions
- **THEN** the plugin system requires policy approval before enabling the updated contribution set

#### Scenario: Contribution is traceable to plugin

- **WHEN** a plugin-contributed capability, skill, hook, agent, connector, or renderer is used
- **THEN** audit metadata identifies the plugin id, plugin version, source, trust level, and contribution id

### Requirement: Headless and Host-Agnostic Plugin Operations

The plugin system SHALL expose plugin operations through shared protocol contracts so CLI, VSCode, tests, CI, and future server modes can manage plugins without depending on terminal UI flows.

plugin system 必须通过共享 protocol contracts 暴露 plugin operations，使 CLI、VSCode、tests、CI 和未来 server modes 能管理 plugins，而不依赖 terminal UI flows。

#### Scenario: Headless plugin validation

- **WHEN** a headless caller validates a plugin package
- **THEN** it receives structured validation results, warnings, permission summaries, and compatibility decisions

#### Scenario: Plugin management UI is an adapter

- **WHEN** CLI or VSCode renders plugin management
- **THEN** it uses shared plugin protocol events and host renderers instead of embedding plugin lifecycle logic in the host UI

### Requirement: Plugin Contributions Are Not Execution Authority

The plugin system SHALL treat plugin packages as contribution containers, not privileged execution boundaries, and SHALL normalize every executable plugin contribution into its owning subsystem and governed execution pipeline.

plugin system 必须把 plugin packages 作为 contribution containers，而不是特权 execution boundaries，并且必须将每个 executable plugin contribution 规范化到其 owning subsystem 和 governed execution pipeline。

#### Scenario: Plugin contributes executable tool

- **WHEN** a plugin contributes a tool, skill, hook, command, MCP connector, workflow template, model profile, renderer, context provider, memory/cache provider, or agent definition
- **THEN** the owning subsystem validates and registers the contribution, and any execution uses the governed execution envelope rather than plugin-private execution

#### Scenario: Plugin lifecycle is scheduled work

- **WHEN** a plugin install, update, migration, rollback, health check, or uninstall runs
- **THEN** the action is represented as governed executable work with permission diff, resource locks, policy decision, audit, and replay metadata

