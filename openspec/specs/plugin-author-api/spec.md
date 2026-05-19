# plugin-author-api Specification

## Purpose
TBD - created by archiving change modularize-builtin-plugin-system. Update Purpose after archive.
## Requirements
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

### Requirement: Complete Plugin Author API Surface / 完整插件作者 API 表面

The plugin author API SHALL expose stable builders and types for the complete platform-owned contribution catalog while remaining declarative by default.

plugin author API 必须为完整 platform-owned contribution catalog 暴露稳定 builders 与 types，同时默认保持声明式。

#### Scenario: Catalog builders are available / 目录 Builder 可用
- **WHEN** a plugin author imports `@deepseek/plugin-api`
- **THEN** the public API exposes builders or typed descriptors for manifest, command, action, target resolver, result-list provider, keymap, palette entry, render hint, hook, skill, tool, MCP connector, agent, context provider, memory/cache provider, workflow template, model profile, config fragment, diagnostics provider, and resource bundle contributions
- **中文** 当 plugin author 导入 `@deepseek/plugin-api` 时，public API 必须为 manifest、command、action、target resolver、result-list provider、keymap、palette entry、render hint、hook、skill、tool、MCP connector、agent、context provider、memory/cache provider、workflow template、model profile、config fragment、diagnostics provider 与 resource bundle contributions 暴露 builders 或 typed descriptors。

#### Scenario: Unsupported builders produce inactive descriptors / 未支持 Builder 产生非活动描述符
- **WHEN** a builder exists for a contribution whose owner subsystem is not available in the current release
- **THEN** it produces a recognized inactive descriptor with compatibility metadata rather than an executable contribution
- **中文** 当某个 builder 对应的 contribution owner subsystem 在当前 release 不可用时，它必须产生 recognized inactive descriptor 与 compatibility metadata，而不是 executable contribution。

### Requirement: Governed Runtime API Contract / 受治理 Runtime API 契约

The plugin author API SHALL define governed runtime API contracts separately from declarative authoring helpers, and these contracts SHALL route through owner subsystems.

plugin author API 必须将 governed runtime API contracts 与 declarative authoring helpers 分开定义，且这些 contracts 必须通过 owner subsystems 路由。

#### Scenario: Runtime API is owner-routed / Runtime API 通过 Owner 路由
- **WHEN** a trusted activated plugin requests workspace reads, context projection, command invocation, tool invocation, memory/cache access, MCP access, model access, session access, or diagnostics emission
- **THEN** the request is represented as an owner-routed governed request with permission, policy, approval where needed, audit, redaction, and replay metadata
- **中文** 当受信任且已激活 plugin 请求 workspace reads、context projection、command invocation、tool invocation、memory/cache access、MCP access、model access、session access 或 diagnostics emission 时，该请求必须表示为 owner-routed governed request，包含 permission、policy、必要时 approval、audit、redaction 与 replay metadata。

#### Scenario: Runtime API unavailable before activation / 激活前不可用 Runtime API
- **WHEN** a plugin is only discovered, validated, installed, or enabled but not activated
- **THEN** governed runtime API handles are unavailable and diagnostics report the missing activation state
- **中文** 当 plugin 仅处于 discovered、validated、installed 或 enabled 状态但未 activated 时，governed runtime API handles 不可用，diagnostics 必须报告缺失 activation state。

### Requirement: Plugin API Compatibility and Deprecation / 插件 API 兼容与废弃

The plugin author API SHALL version every public API level and provide compatibility diagnostics for deprecated, experimental, inactive, and unsupported APIs.

plugin author API 必须版本化每个 public API level，并为 deprecated、experimental、inactive 与 unsupported APIs 提供 compatibility diagnostics。

#### Scenario: Deprecated API warns before removal / 废弃 API 移除前告警
- **WHEN** a plugin uses a deprecated API level, builder, field, or contribution kind
- **THEN** validation reports the replacement path, earliest removal version, affected hosts, and whether activation is still allowed
- **中文** 当 plugin 使用 deprecated API level、builder、field 或 contribution kind 时，validation 必须报告 replacement path、earliest removal version、affected hosts 与 activation 是否仍允许。

#### Scenario: Experimental API requires explicit opt-in / 实验 API 需要显式启用
- **WHEN** a plugin uses an experimental API
- **THEN** activation requires explicit opt-in from source policy, workspace trust, user setting, or enterprise policy
- **中文** 当 plugin 使用 experimental API 时，activation 必须要求 source policy、workspace trust、user setting 或 enterprise policy 显式启用。
