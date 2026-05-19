## Why

The current first-party plugin pack proves the contribution model, but its plugin definitions, builders, validation helpers, and projections live in one implementation file. We need a product-grade plugin layout before adding file manager, jump navigator, and richer TUI plugins so built-in plugins can exercise the same extension path that third-party plugins will use later.

当前一方插件包已经验证了 contribution model，但 plugin definitions、builders、validation helpers 与 projections 集中在单个 implementation 文件中。为了继续加入文件管理器、跳转导航和更完整的 TUI 插件，需要先把内置插件整理成产品级插件目录，让 built-in plugins 使用未来三方插件也会复用的扩展路径。

## What Changes

- Add a dedicated plugin author API package for declarative plugin construction helpers, stable contribution builders, and compatibility metadata.
- 新增独立的 plugin author API package，用于声明式 plugin 构造 helper、稳定 contribution builder 与兼容性 metadata。
- Add `src/plugins/builtin` as the canonical built-in plugin workspace, with one directory per built-in plugin and shared helpers for official bundled plugins.
- 新增 `src/plugins/builtin` 作为标准内置插件 workspace，每个内置插件一个目录，并提供官方 bundled plugins 的共享 helper。
- Move first-party plugin manifest definitions out of the monolithic `first-party-dev-plugins` implementation while preserving existing public exports through a compatibility facade.
- 将一方 plugin manifest definitions 从单体 `first-party-dev-plugins` implementation 中迁出，同时通过兼容 facade 保持现有 public exports。
- Establish the plugin system boundary: plugin manifests and projections are inert metadata; real execution remains routed through owning subsystems and governed contracts.
- 明确 plugin system 边界：plugin manifests 与 projections 是惰性 metadata；真实执行仍通过 owner subsystems 与受治理 contracts 路由。
- Prepare the architecture for first-party file manager and jump navigator plugins without adding full executable file-management behavior in this refactor.
- 为一方文件管理器与跳转导航插件预留架构，但本次重构不落地完整可执行文件管理行为。

## Capabilities

### New Capabilities
- `plugin-author-api`: Stable plugin authoring API and builders exposed to built-in and future external plugins.

### Modified Capabilities
- `plugin-system`: Built-in plugins must be represented as normal plugin manifests loaded from the built-in plugin workspace and projected through inert normalized metadata.
- `first-party-dev-plugins`: The built-in development plugin pack must be modularized into one plugin directory per official plugin while preserving deterministic pack behavior and existing public exports.

## Impact

- Affected code: root workspace configuration, new `src/packages/plugin-api`, new `src/plugins/builtin`, existing `src/packages/first-party-dev-plugins`, and tests covering first-party plugin manifests/projections.
- Affected APIs: new `@deepseek/plugin-api` public package; existing `@deepseek/first-party-dev-plugins` exports remain source-compatible.
- Affected systems: command composition projection, TUI contribution projection, visible reasoning contribution projection, plugin manifest validation, architecture lint coverage via existing package boundary checks.
