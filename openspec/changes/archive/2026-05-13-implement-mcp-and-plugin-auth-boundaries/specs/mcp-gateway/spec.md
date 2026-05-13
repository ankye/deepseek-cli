## ADDED Requirements

### Requirement: MCP Credential Scope Authorization / MCP 凭证作用域授权

The MCP gateway SHALL authorize declared credential requirements before dispatching MCP tool calls, resource reads, prompt materialization, or real transport operations that require credential-backed access.

MCP gateway 必须在 dispatch 需要 credential-backed access 的 MCP tool calls、resource reads、prompt materialization 或 real transport operations 前，授权 declared credential requirements。

#### Scenario: Tool call with declared credential is authorized / 带声明凭证的工具调用被授权

- **WHEN** an MCP tool declares a credential requirement and a caller invokes that tool
- **THEN** the gateway checks the matching scoped grant before handler or transport dispatch and includes authorization evidence in the `McpToolCallResult`
- **中文** 当 MCP tool 声明 credential requirement 且 caller 调用该 tool 时，gateway 必须在 handler 或 transport dispatch 前检查匹配的 scoped grant，并在 `McpToolCallResult` 中包含 authorization evidence。

#### Scenario: Missing MCP grant fails closed / 缺少 MCP Grant 时安全失败

- **WHEN** an MCP resource read or tool call requires a credential but no matching grant exists
- **THEN** the gateway returns a rejected result with typed auth diagnostics, redaction metadata, audit fingerprint, and no handler, adapter, process, network, or credential resolver invocation
- **中文** 当 MCP resource read 或 tool call 需要 credential 但不存在匹配 grant 时，gateway 必须返回 rejected result，包含 typed auth diagnostics、redaction metadata、audit fingerprint，且不得调用 handler、adapter、process、network 或 credential resolver。

### Requirement: MCP Auth Evidence Preserves Pit Coverage / MCP 认证证据保留坑位覆盖

MCP auth diagnostics SHALL cite relevant reference pit fixtures for plugin/MCP precedence, credential scope denial, real transport opt-in, environment snapshotting, and diagnostic redaction when those risks are exercised.

MCP auth diagnostics 在触发 plugin/MCP precedence、credential scope denial、real transport opt-in、environment snapshotting 与 diagnostic redaction 风险时，必须引用相关 reference pit fixtures。

#### Scenario: Scope denial cites credential pit / 作用域拒绝引用凭证坑位

- **WHEN** an MCP server requests a credential outside its declared scope
- **THEN** the gateway diagnostic cites a credential-scope pit fixture id and records the denial without exposing raw secret, raw environment, or raw transport output
- **中文** 当 MCP server 请求超出 declared scope 的 credential 时，gateway diagnostic 必须引用 credential-scope pit fixture id，并记录 denial，且不暴露 raw secret、raw environment 或 raw transport output。
