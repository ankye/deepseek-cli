## 1. Contracts / 契约

- [x] 1.1 Add MCP gateway v1 schema version, server manifest, summaries, tool/resource/prompt declarations, request/result records, diagnostics, redaction, health, policy metadata, and replay fingerprints. / 增加 MCP gateway v1 schema version、server manifest、summaries、tool/resource/prompt declarations、request/result records、diagnostics、redaction、health、policy metadata 和 replay fingerprints。
- [x] 1.2 Replace the pre-v1 `McpGateway` API with canonical v1 validate, connect, list, call, and read APIs. / 用 canonical v1 validate、connect、list、call 和 read APIs 替换 pre-v1 `McpGateway` API。

## 2. MCP Gateway Implementation / MCP Gateway 实现

- [x] 2.1 Implement deterministic manifest validation, normalization, namespace collision rejection, and structured diagnostics. / 实现 deterministic manifest validation、normalization、namespace collision rejection 和 structured diagnostics。
- [x] 2.2 Implement deterministic fake/in-process server connection, health state, discovery for tools/resources/prompts, and fail-closed real transport diagnostics. / 实现 deterministic fake/in-process server connection、health state、tools/resources/prompts discovery，以及真实 transport 的 fail-closed diagnostics。
- [x] 2.3 Implement governed tool calls and resource reads with timeout containment, redaction, permission metadata, diagnostics, and replay fingerprints. / 实现受治理 tool calls 与 resource reads，包含 timeout containment、redaction、permission metadata、diagnostics 和 replay fingerprints。
- [x] 2.4 Add lint enforcement that rejects generic pre-v1 MCP `connect`, `listTools(namespace)`, and `callTool(namespace, name, input)` APIs. / 增加 lint enforcement，拒绝泛化 pre-v1 MCP `connect`、`listTools(namespace)` 和 `callTool(namespace, name, input)` APIs。

## 3. Tests / 测试

- [x] 3.1 Add package and contract tests for DTOs, manifest validation, canonical API enforcement, discovery, invocation, resource reads, failure isolation, timeout, inertness, and redaction. / 增加 package 与 contract tests，覆盖 DTO、manifest validation、canonical API enforcement、discovery、invocation、resource reads、failure isolation、timeout、inertness 和 redaction。
- [x] 3.2 Add integration and golden tests proving MCP gateway evidence is replayable and cannot mutate owner subsystems directly. / 增加 integration 与 golden tests，证明 MCP gateway evidence 可 replay 且不能直接修改 owner subsystems。
- [x] 3.3 Add compatibility and matrix tests for schema enforcement, malformed manifests, trust modes, disabled servers, namespace collisions, unavailable transports, unknown targets, timeout, and redaction. / 增加 compatibility 与 matrix tests，覆盖 schema enforcement、malformed manifests、trust modes、disabled servers、namespace collisions、unavailable transports、unknown targets、timeout 和 redaction。

## 4. Docs, Validation, Archive / 文档、校验与归档

- [x] 4.1 Update product/reference docs and roadmap implementation markers. / 更新 product/reference docs 与 roadmap implementation markers。
- [x] 4.2 Run typecheck, lint, tests, dependency boundaries, and OpenSpec validation. / 运行 typecheck、lint、tests、dependency boundaries 和 OpenSpec validation。
- [x] 4.3 Archive the completed OpenSpec change. / 归档完成的 OpenSpec change。
