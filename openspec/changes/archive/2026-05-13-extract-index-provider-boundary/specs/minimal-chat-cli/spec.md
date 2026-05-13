## ADDED Requirements

### Requirement: Chat PageIndex Uses Shared Index Provider Boundary / Chat PageIndex 使用共享 Index Provider 边界

The chat CLI SHALL keep slash commands, terminal rendering, and workspace persistence in the CLI host while routing deterministic PageIndex DTO normalization and text recall through the shared index provider boundary.

Chat CLI 必须将 slash commands、terminal rendering 与 workspace persistence 保留在 CLI host，同时通过 shared index provider boundary 路由 deterministic PageIndex DTO normalization 与 text recall。

#### Scenario: Recall behavior stays local but shared / Recall 行为保持本地但共享
- **WHEN** the user runs `/palette recall <query>`
- **THEN** the CLI keeps the slash command local and uses shared PageIndex provider primitives for page filtering, scoring, result metadata, and bounded freshness evidence
- **中文** 当用户运行 `/palette recall <query>` 时，CLI 必须保持 slash command 本地执行，并使用 shared PageIndex provider primitives 处理 page filtering、scoring、result metadata 与有界 freshness evidence。

#### Scenario: CLI host does not own semantic provider logic / CLI Host 不拥有 Semantic Provider 逻辑
- **WHEN** ZVec, code-index, or embedding providers are configured later
- **THEN** CLI reads typed provider status/results through contracts instead of importing provider SDKs or implementing vector ranking in the host adapter
- **中文** 当未来配置 ZVec、code-index 或 embedding providers 时，CLI 必须通过 contracts 读取类型化 provider status/results，而不是在 host adapter 中导入 provider SDKs 或实现 vector ranking。
