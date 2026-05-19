## ADDED Requirements

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
