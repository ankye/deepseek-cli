## ADDED Requirements

### Requirement: MCP Family Profile Projection / MCP Family Profile 投影
The MCP gateway SHALL project MCP tools, resources, and prompts through catalog family profiles before they become model-visible.

MCP gateway 必须在 MCP tools、resources 与 prompts 成为 model-visible 前，通过 catalog family profiles 投影它们。

#### Scenario: MCP tool declares family / MCP Tool 声明 Family
- **WHEN** an MCP server exposes a tool
- **THEN** the gateway projection includes catalog family id, domain id, connector trust, risk class, permissions, timeout, redaction, and scorecard rubric id
- **中文** 当 MCP server 暴露 tool 时，gateway projection 必须包含 catalog family id、domain id、connector trust、risk class、permissions、timeout、redaction 与 scorecard rubric id。

### Requirement: Specialized MCP Profiles / 专用 MCP Profile
The MCP gateway SHALL support specialized profiles for browser, design, media, data, and generic tool/resource/prompt connectors without giving external servers system authority.

MCP gateway 必须支持 browser、design、media、data 与 generic tool/resource/prompt connectors 的专用 profiles，同时不得赋予外部 servers system authority。

#### Scenario: Design MCP maps to design families / Design MCP 映射到 Design Families
- **WHEN** a trusted design MCP server declares document, node query, batch edit, or export operations
- **THEN** the gateway maps them to `design.document-state`, `design.node-query`, `design.batch-edit`, or `design.export-snapshot`
- **中文** 当 trusted design MCP server 声明 document、node query、batch edit 或 export operations 时，gateway 必须将其映射到 `design.document-state`、`design.node-query`、`design.batch-edit` 或 `design.export-snapshot`。

### Requirement: MCP Family Score Evidence / MCP Family 评分证据
MCP family evidence SHALL include manifest validation, connection health, authorization, invocation result, redaction boundary, replay fingerprint, and connector profile.

MCP family evidence 必须包含 manifest validation、connection health、authorization、invocation result、redaction boundary、replay fingerprint 与 connector profile。

#### Scenario: Connected server alone does not score tool family / 仅连接 Server 不给 Tool Family 得分
- **WHEN** an MCP server connects but no declared tool is invoked successfully through the governed gateway
- **THEN** `mcp.server-lifecycle` may pass but `mcp.tool-call` remains unpassed
- **中文** 当 MCP server 已连接但没有 declared tool 通过受治理 gateway 成功调用时，`mcp.server-lifecycle` 可以通过，但 `mcp.tool-call` 不得通过。
