## ADDED Requirements

### Requirement: MCP Family Tools Are Concrete Connectors / MCP Family 工具是真实 Connector
The MCP gateway SHALL expose `mcp.server-lifecycle`, `mcp.tool-call`, `mcp.resource-read`, and `mcp.prompt` through governed executable capabilities with deterministic fake-server tests.

MCP gateway 必须通过受治理 executable capabilities 暴露 `mcp.server-lifecycle`、`mcp.tool-call`、`mcp.resource-read` 与 `mcp.prompt`，并提供 deterministic fake-server tests。

#### Scenario: Fake MCP tool call scores tool-call only after invocation / Fake MCP 调用后才给 Tool-Call 评分
- **WHEN** a fake MCP server connects but no tool is invoked
- **THEN** lifecycle evidence may pass, but `mcp.tool-call` task evidence remains zero
- **中文** 当 fake MCP server 已连接但没有调用工具时，lifecycle evidence 可以通过，但 `mcp.tool-call` task evidence 必须保持零分。

### Requirement: Specialized Connector Profiles Map To Families / 专用 Connector Profile 映射到 Families
Browser, design, media, and data connector profiles SHALL map external operations into canonical tool family metadata before model projection.

browser、design、media 与 data connector profiles 必须在 model projection 前把外部 operations 映射为 canonical tool family metadata。

#### Scenario: Browser screenshot projection has family metadata / Browser Screenshot 投影带 Family 元数据
- **WHEN** a browser connector exposes screenshot capture
- **THEN** the projected capability uses `browser.screenshot` metadata and bounded artifact output
- **中文** 当 browser connector 暴露 screenshot capture 时，投影 capability 必须使用 `browser.screenshot` metadata，并输出有界 artifact。
