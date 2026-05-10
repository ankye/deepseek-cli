# mcp-gateway Specification

## Purpose

MCP gateway defines the governed boundary for adapting external MCP servers into DeepSeek capabilities, resources, prompts, and context inputs without allowing external servers to bypass platform policy, redaction, timeout, replay, or audit controls.

MCP gateway 定义将外部 MCP servers 适配为 DeepSeek capabilities、resources、prompts 与 context inputs 的受治理边界，防止外部 servers 绕过 platform policy、redaction、timeout、replay 或 audit controls。
## Requirements
### Requirement: MCP Gateway Boundary

The platform SHALL define an MCP gateway that adapts external MCP servers into platform capabilities, resources, prompts, commands, and context providers through explicit schema version, manifest validation, namespace, trust, policy, timeout, redaction, health, and audit boundaries.

平台必须定义 MCP gateway，通过显式 schema version、manifest validation、namespace、trust、policy、timeout、redaction、health 和 audit boundaries，把外部 MCP servers 适配为平台 capabilities、resources、prompts、commands 和 context providers。

#### Scenario: MCP server manifest is validated / MCP server manifest 被校验

- **WHEN** an MCP server manifest is registered
- **THEN** the gateway validates schema version, id, name, namespace, transport, trust, permissions, timeout, enabled state, redaction, and declared tools/resources/prompts before the server can be listed or called
- **中文** 当 MCP server manifest 被注册时，gateway 必须在 server 可被 listing 或 calling 前校验 schema version、id、name、namespace、transport、trust、permissions、timeout、enabled state、redaction 和 declared tools/resources/prompts。

#### Scenario: MCP tool becomes capability / MCP tool 成为能力

- **WHEN** an enabled trusted MCP server exposes a tool
- **THEN** the MCP gateway returns it as a namespaced tool summary with source, transport, permission, timeout, schema, redaction, and audit metadata
- **中文** 当 enabled 且 trusted 的 MCP server 暴露 tool 时，MCP gateway 必须将其作为 namespaced tool summary 返回，并包含 source、transport、permission、timeout、schema、redaction 和 audit metadata。

#### Scenario: MCP prompt becomes governed metadata / MCP prompt 成为受治理元数据

- **WHEN** an enabled MCP server exposes a prompt
- **THEN** the MCP gateway returns it as inert governed metadata for later command, skill input, or context-provider projection according to manifest and policy metadata
- **中文** 当 enabled MCP server 暴露 prompt 时，MCP gateway 必须将其作为 inert governed metadata 返回，供后续按 manifest 和 policy metadata 投影为 command、skill input 或 context provider。

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

### Requirement: MCP Resource Governance

The MCP gateway SHALL treat MCP resources as explicit external resources with URI identity, server id, namespace, source trust, read permissions, redaction class, cache policy, provenance, and replay fingerprint.

MCP gateway 必须把 MCP resources 作为显式 external resources 处理，包含 URI identity、server id、namespace、source trust、read permissions、redaction class、cache policy、provenance 和 replay fingerprint。

#### Scenario: Read MCP resource / 读取 MCP resource

- **WHEN** a model, skill, command, hook, agent, or user requests an MCP resource
- **THEN** the request is authorized by manifest metadata, fetched through the gateway, redacted, tagged with cache policy, and represented as a typed resource read result
- **中文** 当 model、skill、command、hook、agent 或 user 请求 MCP resource 时，该请求必须通过 manifest metadata 授权，经 gateway 获取、脱敏、标记 cache policy，并表示为 typed resource read result。

#### Scenario: Unknown resource fails closed / 未知 resource 安全失败

- **WHEN** a resource read request references an unknown server, disabled server, unhealthy server, untrusted server, or undeclared URI
- **THEN** the gateway returns a rejected result with deterministic diagnostics and no external access
- **中文** 当 resource read request 引用 unknown server、disabled server、unhealthy server、untrusted server 或 undeclared URI 时，gateway 必须返回 rejected result，包含 deterministic diagnostics，且不进行外部访问。

### Requirement: MCP Security and Namespacing

The MCP gateway SHALL namespace all external capabilities, isolate server-provided instructions from system authority, validate namespace syntax, and require declared permissions for privileged server actions.

MCP gateway 必须对所有 external capabilities 做 namespace 隔离，隔离 server-provided instructions 与 system authority，校验 namespace syntax，并要求 privileged server actions 声明 permissions。

#### Scenario: Server instruction is non-authoritative / server instruction 非权威

- **WHEN** an external server provides instructions, descriptions, prompts, or resource content
- **THEN** they are marked as untrusted or internal external context and cannot override platform policy, system instructions, or sandbox boundaries
- **中文** 当外部 server 提供 instructions、descriptions、prompts 或 resource content 时，它们必须被标记为 untrusted 或 internal external context，且不能覆盖 platform policy、system instructions 或 sandbox boundaries。

#### Scenario: Namespace collision is rejected / namespace 冲突被拒绝

- **WHEN** two enabled MCP servers declare the same namespace or a namespace with invalid syntax
- **THEN** the second registration is rejected with a deterministic diagnostic
- **中文** 当两个 enabled MCP servers 声明相同 namespace 或声明无效 syntax 的 namespace 时，第二个 registration 必须被拒绝，并返回 deterministic diagnostic。

### Requirement: MCP Calls Use Governed Invocation

The MCP gateway SHALL normalize MCP tools, resource reads, prompts, commands, and context providers into governed invocation or projection records when they are fetched, projected into runtime context, or executed.

MCP gateway 必须在 MCP tools、resource reads、prompts、commands 和 context providers 被 fetch、project into runtime context 或 execute 时，将其规范化为 governed invocation 或 projection records。

#### Scenario: External MCP tool is governed / 外部 MCP tool 受治理

- **WHEN** an MCP tool is called
- **THEN** the gateway creates a call result with schema version, server id, namespace, tool name, caller, transport, trust, permissions, timeout, redaction, diagnostics, audit metadata, and replay fingerprint before dispatching the deterministic handler
- **中文** 当 MCP tool 被调用时，gateway 必须在 dispatch deterministic handler 前创建 call result metadata，包含 schema version、server id、namespace、tool name、caller、transport、trust、permissions、timeout、redaction、diagnostics、audit metadata 和 replay fingerprint。

#### Scenario: MCP resource read is governed / MCP resource read 受治理

- **WHEN** a model, skill, command, hook, agent, or user requests an MCP resource
- **THEN** the request is authorized and traced through the governed gateway record rather than treated as untracked context
- **中文** 当 model、skill、command、hook、agent 或 user 请求 MCP resource 时，该请求必须通过受治理 gateway record 授权和追踪，而不能作为 untracked context 处理。

### Requirement: Canonical MCP Gateway V1 API / Canonical MCP Gateway V1 API

The MCP gateway SHALL expose only canonical v1 APIs for manifest validation, server connection, server listing, tool/resource/prompt listing, tool calls, and resource reads.

MCP gateway 必须只暴露 canonical v1 APIs，用于 manifest validation、server connection、server listing、tool/resource/prompt listing、tool calls 和 resource reads。

#### Scenario: Legacy MCP APIs are rejected / 旧 MCP APIs 被拒绝

- **WHEN** contracts or implementations reintroduce generic pre-v1 `connect`, `listTools(namespace)`, or `callTool(namespace, name, input)` APIs
- **THEN** architecture lint fails with a stable MCP gateway rule id
- **中文** 当 contracts 或 implementations 重新引入泛化 pre-v1 `connect`、`listTools(namespace)` 或 `callTool(namespace, name, input)` APIs 时，architecture lint 必须以稳定 MCP gateway rule id 失败。

#### Scenario: V1 request schema is required / V1 request schema 是必需的

- **WHEN** `callTool` or `readResource` receives a missing or unsupported schema version
- **THEN** the gateway returns a rejected typed result before handler dispatch
- **中文** 当 `callTool` 或 `readResource` 收到 missing 或 unsupported schema version 时，gateway 必须在 handler dispatch 前返回 rejected typed result。

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

