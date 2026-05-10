## MODIFIED Requirements

### Requirement: MCP Transport and Connection Management

The MCP gateway SHALL model stdio, HTTP, WebSocket, in-process, IDE-provided, fake, and future transports with connection lifecycle, health, reconnection intent, cancellation, timeout, and backpressure semantics; v1 SHALL only execute deterministic fake or in-process handlers UNLESS a caller has explicitly opted into a real transport via `registerRealTransport(kind, factory)` (or an equivalent env / CLI flag such as `MCP_REAL_TRANSPORT=1` / `--enable-real-mcp`). Until opt-in, stdio, HTTP, WebSocket, and IDE-provided transports SHALL fail closed exactly as they do today.

MCP gateway 必须建模 stdio、HTTP、WebSocket、in-process、IDE-provided、fake 和未来 transports，并包含 connection lifecycle、health、reconnection intent、cancellation、timeout 和 backpressure semantics；v1 默认仍然只执行 deterministic fake 或 in-process handlers —— **除非**调用方通过 `registerRealTransport(kind, factory)`（或等价的 env/CLI flag，如 `MCP_REAL_TRANSPORT=1` / `--enable-real-mcp`）显式 opt-in。未 opt-in 前，stdio、HTTP、WebSocket、IDE-provided transports 必须完全保持「安全失败」的现有行为。

#### Scenario: Unhealthy MCP server is isolated / 不健康 MCP server 被隔离

- **WHEN** an MCP connection fails health checks, violates timeout/backpressure policy, or has no deterministic v1 adapter
- **THEN** the gateway marks the server unhealthy or unavailable and prevents failures from breaking the base runtime
- **中文** 当 MCP connection 未通过 health checks、违反 timeout/backpressure policy 或没有 deterministic v1 adapter 时，gateway 必须将 server 标记为 unhealthy 或 unavailable，并防止失败破坏基础 runtime。

#### Scenario: Real transport fails closed without opt-in / 未 opt-in 时真实传输安全失败

- **WHEN** a stdio, HTTP, WebSocket, or IDE-provided MCP server is connected without an approved deterministic adapter AND no real transport factory has been registered for that transport kind
- **THEN** discovery and invocation return typed `MCP_TRANSPORT_UNAVAILABLE` diagnostics instead of attempting process, network, or host API access
- **中文** 当 stdio、HTTP、WebSocket、IDE-provided MCP server 连接时没有 approved deterministic adapter，且该 transport kind 没有注册真实 transport factory，discovery 与 invocation 必须返回 typed `MCP_TRANSPORT_UNAVAILABLE` diagnostics，且不进行 process/network/host API 访问。

## ADDED Requirements

### Requirement: Opt-In Real MCP Transport / 显式启用真实 MCP 通道

The MCP gateway SHALL expose `registerRealTransport(kind: McpTransportKind, factory)` so that the runtime, tests, or a CLI flag can enable real (non-fake, non-in-process) MCP connectivity on demand. Registration SHALL be explicit and auditable: runtime SHALL emit a typed observability event (for example `kernel.observability.degraded` with `mcp.real-transport.enabled=true`) when any real transport factory is registered for the active session.

MCP gateway 必须暴露 `registerRealTransport(kind, factory)`，让 runtime、测试或 CLI flag 按需启用真实（非 fake、非 in-process）MCP 通道。注册必须是显式、可审计的：任何 session 内注册真实 transport factory 时，runtime 必须发一个 typed observability 事件（例如 `kernel.observability.degraded`，payload `mcp.real-transport.enabled=true`）。

#### Scenario: Real stdio transport serves registered manifest / 真实 stdio 通道服务已注册 manifest

- **WHEN** a caller registers a real stdio transport factory and then connects an MCP server whose `transport.kind === "stdio"` without supplying an adapter
- **THEN** the gateway invokes the factory, retains the returned adapter and disposer, marks the server `connected`, and routes subsequent `tools/call` and `resources/read` requests through the adapter
- **中文** 当调用方注册真实 stdio transport factory 后连接一个 `transport.kind === "stdio"` 的 MCP server 且未传入 adapter，gateway 必须调用 factory、保留返回的 adapter 与 dispose、把 server 标记为 `connected`，并通过 adapter 路由后续 `tools/call` 与 `resources/read`。

#### Scenario: Subprocess is isolated and cleanly disposed / 子进程隔离并干净关闭

- **WHEN** a real stdio MCP adapter is created
- **THEN** the adapter launches the server via the platform's process abstraction using argument arrays (no shell expansion), enforces the manifest `timeoutMs` per request, and on dispose sends a `shutdown` notification, then `SIGTERM`, then `SIGKILL` after a 2-second grace window
- **中文** 当创建真实 stdio MCP adapter 时，adapter 必须通过平台进程抽象用参数数组（无 shell 展开）启动 server，每次请求执行 manifest `timeoutMs`，dispose 时先发 `shutdown` 通知，再 `SIGTERM`，2 秒内未退则 `SIGKILL`。

#### Scenario: Opt-in activation is audit-logged / opt-in 激活有审计

- **WHEN** the runtime observes `MCP_REAL_TRANSPORT=1` or the CLI `--enable-real-mcp` flag
- **THEN** it registers the real transport factory and emits a typed observability event naming the enabled transport kind so operators can see the downgrade from fail-closed defaults
- **中文** 当 runtime 观察到 `MCP_REAL_TRANSPORT=1` 或 CLI `--enable-real-mcp` flag 时，必须注册真实 transport factory 并发出 typed observability 事件，标明已启用的 transport kind，操作者可看到默认 fail-closed 行为被松绑。

#### Scenario: Real transport call produces typed diagnostics on failure / 真实通道失败产生 typed diagnostic

- **WHEN** a real stdio MCP tool call times out, the server returns a JSON-RPC error, or the subprocess exits unexpectedly
- **THEN** the gateway returns a rejected `McpToolCallResult` with a typed diagnostic code (`MCP_TOOL_TIMEOUT`, `MCP_TOOL_REAL_FAILED`, or `MCP_SERVER_EXITED`) and does not propagate raw subprocess output beyond the adapter's redaction boundary
- **中文** 当真实 stdio MCP tool call 超时、server 返回 JSON-RPC error 或子进程异常退出时，gateway 必须返回 rejected `McpToolCallResult`，带 typed diagnostic（`MCP_TOOL_TIMEOUT`、`MCP_TOOL_REAL_FAILED` 或 `MCP_SERVER_EXITED`），且不得越过 adapter 的 redaction 边界传递原始子进程输出。
