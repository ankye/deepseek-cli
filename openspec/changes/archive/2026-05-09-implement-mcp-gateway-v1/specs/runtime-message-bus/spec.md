## ADDED Requirements

### Requirement: MCP Gateway Event Evidence / MCP Gateway 事件证据

The runtime message bus SHALL be able to carry redacted, replayable MCP gateway evidence for server validation, connection status, discovery, tool invocation, resource reads, prompt projection, failure isolation, and terminal status.

runtime message bus 必须能够承载脱敏、可 replay 的 MCP gateway evidence，覆盖 server validation、connection status、discovery、tool invocation、resource reads、prompt projection、failure isolation 和 terminal status。

#### Scenario: MCP call records are replayable / MCP call records 可 replay

- **WHEN** MCP gateway v1 calls a deterministic tool or reads a deterministic resource
- **THEN** emitted or captured records include schema version, server id, namespace, target name or URI, status, redaction metadata, diagnostics, trace metadata, and replay fingerprint without raw secret-like content
- **中文** 当 MCP gateway v1 调用 deterministic tool 或读取 deterministic resource 时，发出或捕获的 records 必须包含 schema version、server id、namespace、target name 或 URI、status、redaction metadata、diagnostics、trace metadata 和 replay fingerprint，且不包含 raw secret-like content。

#### Scenario: MCP evidence does not mutate bus state / MCP evidence 不修改 bus 状态

- **WHEN** MCP gateway returns discovery, prompt, resource, or tool-call evidence
- **THEN** the bus records the evidence as replayable metadata only, and no runtime state mutation happens through the bus record itself
- **中文** 当 MCP gateway 返回 discovery、prompt、resource 或 tool-call evidence 时，bus 只能将其记录为 replayable metadata，不能通过 bus record 本身修改 runtime state。
