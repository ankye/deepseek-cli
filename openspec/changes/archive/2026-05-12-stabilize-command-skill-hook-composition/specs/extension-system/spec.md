## ADDED Requirements

### Requirement: Extension Contributions Feed Composition / 扩展贡献进入组合层

Extension contribution summaries SHALL feed the composition layer through manifest metadata only and SHALL NOT grant execution authority.

Extension contribution summaries 必须只通过 manifest metadata 输入 composition layer，且不得授予执行权。

#### Scenario: Extension command contribution is normalized / 扩展命令贡献被归一化
- **WHEN** an extension contributes a command, skill, hook, MCP connector, renderer hint, or workflow template
- **THEN** the composition layer records the contribution owner, source, permissions, target id, and `pit.legacy-contribution-normalization.manifest-boundary` before any host projects it
- **中文** 当 extension 贡献 command、skill、hook、MCP connector、renderer hint 或 workflow template 时，composition layer 必须在任何 host 投影前记录 contribution owner、source、permissions、target id 和 `pit.legacy-contribution-normalization.manifest-boundary`。

#### Scenario: Renderer hint is host-only / Renderer Hint 只属于 Host
- **WHEN** an extension contributes a renderer hint
- **THEN** composition marks it host-visible only and excludes it from model-visible projection
- **中文** 当 extension 贡献 renderer hint 时，composition 必须将其标记为仅 host-visible，并从 model-visible projection 排除。
