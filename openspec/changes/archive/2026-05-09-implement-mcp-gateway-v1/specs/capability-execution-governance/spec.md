## ADDED Requirements

### Requirement: MCP Gateway Governed Boundary / MCP Gateway 受治理边界

MCP executable calls and resource reads SHALL carry governed metadata before they are consumed by runtime, skills, hooks, commands, agents, plugins, hosts, or future servers.

MCP executable calls 和 resource reads 在被 runtime、skills、hooks、commands、agents、plugins、hosts 或未来 servers 消费前，必须携带受治理 metadata。

#### Scenario: MCP call declares governance metadata / MCP call 声明治理元数据

- **WHEN** an MCP tool call or resource read request is created
- **THEN** it declares schema version, caller, server id, namespace, trust, permissions, timeout, redaction, transport, audit metadata, trace metadata when present, and replay policy before handler dispatch
- **中文** 当 MCP tool call 或 resource read request 被创建时，它必须在 handler dispatch 前声明 schema version、caller、server id、namespace、trust、permissions、timeout、redaction、transport、audit metadata、可选 trace metadata 和 replay policy。

#### Scenario: MCP direct bypass fails lint / MCP 直接绕过触发 lint

- **WHEN** a host adapter, feature package, provider package, skill, hook, plugin, or extension package calls MCP execution primitives outside the runtime/governed owner path
- **THEN** architecture lint fails with a stable governed execution rule id
- **中文** 当 host adapter、feature package、provider package、skill、hook、plugin 或 extension package 在 runtime/governed owner path 外调用 MCP execution primitives 时，architecture lint 必须以稳定 governed execution rule id 失败。
