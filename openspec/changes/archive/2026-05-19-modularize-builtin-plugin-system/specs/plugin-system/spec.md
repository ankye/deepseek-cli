## ADDED Requirements

### Requirement: Built-In Plugin Workspace Registry / 内置插件 Workspace Registry

The plugin system SHALL support built-in plugin manifests discovered from the repository's built-in plugin workspace and normalize them through the same manifest, lifecycle, and projection contracts used for other plugin sources.

plugin system 必须支持从仓库内置 plugin workspace 发现 built-in plugin manifests，并通过与其他 plugin sources 相同的 manifest、lifecycle 与 projection contracts 进行归一化。

#### Scenario: Built-in workspace manifests apply deterministically / 内置 Workspace Manifest 确定性应用
- **WHEN** the built-in plugin registry returns bundled plugin manifests
- **THEN** the manifests are sorted by plugin id, declare `source=built-in`, include deterministic integrity metadata, and can be applied to plugin lockfile-compatible state without duplicate entries
- **中文** 当内置 plugin registry 返回 bundled plugin manifests 时，manifests 必须按 plugin id 排序，声明 `source=built-in`，包含确定性 integrity metadata，并可应用到 plugin lockfile-compatible state 且不产生重复条目。

#### Scenario: Built-in registry does not execute plugins / 内置 Registry 不执行插件
- **WHEN** a host requests built-in plugin manifests, command projections, TUI projections, reasoning projections, or diagnostics
- **THEN** the registry returns normalized metadata only and does not run command handlers, owner subsystem work, shell commands, filesystem mutation, model calls, MCP calls, hooks, or renderer callbacks
- **中文** 当 host 请求 built-in plugin manifests、command projections、TUI projections、reasoning projections 或 diagnostics 时，registry 只能返回归一化 metadata，不得运行 command handlers、owner subsystem work、shell commands、filesystem mutation、model calls、MCP calls、hooks 或 renderer callbacks。

### Requirement: Plugin Author API Boundary / 插件作者 API 边界

The plugin system SHALL accept manifests authored through `@deepseek/plugin-api` while preserving `platform-contracts` as the canonical DTO boundary and rejecting plugin contributions that bypass declared contribution points.

plugin system 必须接受通过 `@deepseek/plugin-api` 编写的 manifests，同时保持 `platform-contracts` 作为标准 DTO 边界，并拒绝绕过声明式 contribution points 的 plugin contributions。

#### Scenario: Author API output is normal manifest / 作者 API 输出普通 Manifest
- **WHEN** a plugin is defined through `@deepseek/plugin-api`
- **THEN** plugin-system validation treats the output as a normal `PluginManifest` and records provenance, permissions, integrity, source, and compatibility metadata
- **中文** 当 plugin 通过 `@deepseek/plugin-api` 定义时，plugin-system validation 必须将输出视为普通 `PluginManifest`，并记录 provenance、permissions、integrity、source 与 compatibility metadata。

#### Scenario: Undeclared executable handles are rejected / 未声明可执行句柄被拒绝
- **WHEN** a plugin contribution contains host-private callbacks, executable renderer functions, raw shell fragments, runtime kernel handles, or undeclared owner routes
- **THEN** validation returns deterministic diagnostics and the contribution is not projected as active
- **中文** 当 plugin contribution 包含 host-private callbacks、executable renderer functions、raw shell fragments、runtime kernel handles 或未声明 owner routes 时，validation 必须返回确定性 diagnostics，且该 contribution 不得被投影为 active。
