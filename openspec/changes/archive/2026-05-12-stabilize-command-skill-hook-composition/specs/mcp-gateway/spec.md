## ADDED Requirements

### Requirement: MCP Prompt And Tool Composition Projection / MCP Prompt 与 Tool 组合投影

MCP prompt and tool summaries exposed to composition SHALL remain inert metadata until the MCP gateway executes a governed call or resource read.

暴露给 composition 的 MCP prompt 与 tool summaries 必须保持惰性 metadata，直到 MCP gateway 执行受治理 call 或 resource read。

#### Scenario: MCP prompt projection is inert / MCP Prompt 投影惰性
- **WHEN** MCP prompts are projected into command composition
- **THEN** records include server id, namespace, qualified name, trust, permissions, redaction, and provenance without fetching resources or invoking tools
- **中文** 当 MCP prompts 被投影到 command composition 时，records 必须包含 server id、namespace、qualified name、trust、permissions、redaction 和 provenance，且不获取 resources 或调用 tools。

#### Scenario: MCP tool is not model-visible command by default / MCP Tool 默认不是模型可见命令
- **WHEN** an MCP tool summary is normalized into composition
- **THEN** model-visible projection excludes it unless the capability registry or MCP gateway owner exposes a governed callable wrapper
- **中文** 当 MCP tool summary 被归一化到 composition 时，model-visible projection 必须排除它，除非 capability registry 或 MCP gateway owner 暴露受治理 callable wrapper。
