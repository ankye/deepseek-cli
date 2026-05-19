## ADDED Requirements

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
