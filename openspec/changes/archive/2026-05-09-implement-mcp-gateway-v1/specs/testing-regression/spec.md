## ADDED Requirements

### Requirement: MCP Gateway Regression Coverage / MCP Gateway 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and lint coverage for MCP gateway v1 without requiring real MCP servers, network access, process spawning, live credentials, plugin marketplaces, or host-specific APIs.

regression framework 必须为 MCP gateway v1 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 lint 覆盖，且不要求 real MCP servers、network access、process spawning、live credentials、plugin marketplaces 或 host-specific APIs。

#### Scenario: Golden replay includes MCP invocation / golden replay 包含 MCP invocation

- **WHEN** a golden trace includes MCP server connection, tool discovery, tool invocation, resource read, prompt listing, and failure isolation evidence
- **THEN** replay asserts stable schema versions, server ids, namespace, target ids, terminal status, diagnostics, redaction metadata, and replay fingerprints
- **中文** 当 golden trace 包含 MCP server connection、tool discovery、tool invocation、resource read、prompt listing 和 failure isolation evidence 时，replay 必须断言 stable schema versions、server ids、namespace、target ids、terminal status、diagnostics、redaction metadata 和 replay fingerprints。

#### Scenario: Matrix covers trust and transport modes / matrix 覆盖 trust 与 transport modes

- **WHEN** matrix tests run
- **THEN** they cover trusted fake server, workspace server, untrusted server, disabled server, malformed manifest, namespace collision, unsupported schema, unavailable real transport, timeout, unknown tool, unknown resource, and redaction behavior
- **中文** 当 matrix tests 运行时，必须覆盖 trusted fake server、workspace server、untrusted server、disabled server、malformed manifest、namespace collision、unsupported schema、unavailable real transport、timeout、unknown tool、unknown resource 和 redaction behavior。

#### Scenario: Compatibility requires MCP schemas / compatibility 要求 MCP schemas

- **WHEN** compatibility tests inspect MCP manifests, server summaries, tool summaries, resource summaries, prompt summaries, tool call results, resource read results, or diagnostics
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 MCP manifests、server summaries、tool summaries、resource summaries、prompt summaries、tool call results、resource read results 或 diagnostics 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

#### Scenario: Lint rejects legacy MCP APIs / lint 拒绝旧 MCP APIs

- **WHEN** MCP contracts or implementations reintroduce generic pre-v1 APIs
- **THEN** architecture lint fails with a stable MCP gateway rule id
- **中文** 当 MCP contracts 或 implementations 重新引入泛化 pre-v1 APIs 时，architecture lint 必须以稳定 MCP gateway rule id 失败。
