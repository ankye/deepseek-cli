## ADDED Requirements

### Requirement: MCP Test Evidence For Extension Management / 面向扩展管理的 MCP 测试证据

MCP gateway test flows SHALL produce governed, deterministic evidence that can be rendered by CLI extension management without giving MCP servers direct execution authority.

MCP gateway test flows 必须产生受治理且确定性的 evidence，供 CLI extension management 渲染，同时不赋予 MCP servers 直接执行权。

#### Scenario: Extension MCP test uses gateway results / Extension MCP 测试使用 Gateway 结果
- **WHEN** CLI extension management tests an MCP manifest
- **THEN** it uses `McpGateway` validation, connection, list, tool call, or resource read results and renders schema version, health, diagnostics, redaction, audit, and replay fingerprint fields
- **中文** 当 CLI extension management 测试 MCP manifest 时，必须使用 `McpGateway` validation、connection、list、tool call 或 resource read results，并渲染 schema version、health、diagnostics、redaction、audit 和 replay fingerprint fields。

#### Scenario: Real transport remains explicit / 真实传输保持显式
- **WHEN** an MCP manifest uses stdio, HTTP, WebSocket, or IDE transport without explicit opt-in
- **THEN** extension management output reports typed fail-closed diagnostics and does not spawn processes, use network, or call host APIs
- **中文** 当 MCP manifest 使用 stdio、HTTP、WebSocket 或 IDE transport 且没有显式 opt-in 时，extension management output 必须报告 typed fail-closed diagnostics，且不启动进程、不使用网络、不调用 host APIs。

### Requirement: MCP Plugin Precedence Pit Evidence / MCP 插件优先级坑位证据

MCP and plugin contribution summaries SHALL preserve source, trust, namespace, and policy precedence evidence so future managed policy can deny enterprise-conflicting contributions without ambiguity.

MCP 与 plugin contribution summaries 必须保留 source、trust、namespace 和 policy precedence evidence，使未来 managed policy 能无歧义地拒绝与 enterprise 冲突的 contributions。

#### Scenario: Precedence evidence is recorded / 优先级证据被记录
- **WHEN** extension management lists MCP and plugin contributions that could overlap by namespace or command id
- **THEN** the record includes source and trust ordering metadata and cites `pit.mcp-plugin-precedence.enterprise-deny`
- **中文** 当 extension management 列出可能按 namespace 或 command id 重叠的 MCP 与 plugin contributions 时，record 必须包含 source 和 trust ordering metadata，并引用 `pit.mcp-plugin-precedence.enterprise-deny`。
