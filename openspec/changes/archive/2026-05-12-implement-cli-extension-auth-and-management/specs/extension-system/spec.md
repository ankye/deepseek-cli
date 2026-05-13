## ADDED Requirements

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
