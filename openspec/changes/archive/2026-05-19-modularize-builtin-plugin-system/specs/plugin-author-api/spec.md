## ADDED Requirements

### Requirement: Declarative Plugin Author API / 声明式插件作者 API

The platform SHALL provide a `@deepseek/plugin-api` package that exposes stable declarative helpers for plugin authors to construct plugin manifests and contribution metadata without importing runtime, CLI host, or implementation-internal packages.

平台必须提供 `@deepseek/plugin-api` package，暴露稳定的声明式 helper，让插件作者可以构造 plugin manifests 与 contribution metadata，而无需导入 runtime、CLI host 或 implementation-internal packages。

#### Scenario: Built-in plugin uses author API / 内置插件使用作者 API
- **WHEN** a built-in plugin declares commands, palette entries, result-list providers, keymaps, renderer hints, or reasoning contributions
- **THEN** the declaration uses `@deepseek/plugin-api` helpers or types and produces a normal `PluginManifest`
- **中文** 当内置插件声明 commands、palette entries、result-list providers、keymaps、renderer hints 或 reasoning contributions 时，声明必须使用 `@deepseek/plugin-api` helpers 或 types，并产出普通 `PluginManifest`。

#### Scenario: API stays declarative / API 保持声明式
- **WHEN** plugin code imports `@deepseek/plugin-api`
- **THEN** it does not receive direct filesystem, process, model, TUI layout, runtime kernel, credential resolver, or host adapter execution handles
- **中文** 当 plugin code 导入 `@deepseek/plugin-api` 时，不得获得直接 filesystem、process、model、TUI layout、runtime kernel、credential resolver 或 host adapter execution handles。

### Requirement: Contribution Builders Preserve Owner Routing / Contribution Builder 保留 Owner 路由

The plugin author API SHALL provide contribution builders that require stable ids, owner subsystem metadata, permissions, side-effect metadata, target kinds, and projection metadata needed for governed owner routing.

plugin author API 必须提供 contribution builders，要求 stable ids、owner subsystem metadata、permissions、side-effect metadata、target kinds 与 projection metadata，以支持受治理 owner routing。

#### Scenario: Command contribution declares owner route / 命令贡献声明 Owner 路由
- **WHEN** a plugin command is built through the author API
- **THEN** the resulting command metadata includes a stable command id, owner subsystem, permissions, side-effect classification, input schema, output schema, and aliases
- **中文** 当 plugin command 通过 author API 构建时，结果 command metadata 必须包含 stable command id、owner subsystem、permissions、side-effect classification、input schema、output schema 与 aliases。

#### Scenario: TUI contribution remains inert / TUI 贡献保持惰性
- **WHEN** a plugin contributes a keymap, palette entry, result-list provider, renderer hint, or target resolver through the author API
- **THEN** the contribution is data-only metadata and does not include executable renderer code or host-private callbacks
- **中文** 当 plugin 通过 author API 贡献 keymap、palette entry、result-list provider、renderer hint 或 target resolver 时，该 contribution 必须是纯数据 metadata，不得包含 executable renderer code 或 host-private callbacks。

### Requirement: Author API Compatibility Metadata / 作者 API 兼容性元数据

The plugin author API SHALL expose API version metadata and compatibility helpers so built-in and future external plugins can declare the schema version they were authored against.

plugin author API 必须暴露 API version metadata 与 compatibility helpers，使内置插件和未来外部插件能够声明其编写时使用的 schema version。

#### Scenario: Manifest includes schema compatibility / Manifest 包含 Schema 兼容性
- **WHEN** a plugin manifest is created through the author API
- **THEN** the manifest contributions include schema version metadata that plugin-system validation and projection can consume deterministically
- **中文** 当 plugin manifest 通过 author API 创建时，manifest contributions 必须包含 plugin-system validation 与 projection 可确定消费的 schema version metadata。
