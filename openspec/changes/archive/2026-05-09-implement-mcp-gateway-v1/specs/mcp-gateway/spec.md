## MODIFIED Requirements

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

The MCP gateway SHALL model stdio, HTTP, WebSocket, in-process, IDE-provided, fake, and future transports with connection lifecycle, health, reconnection intent, cancellation, timeout, and backpressure semantics; v1 SHALL only execute deterministic fake or in-process handlers and SHALL fail closed for real transports.

MCP gateway 必须建模 stdio、HTTP、WebSocket、in-process、IDE-provided、fake 和未来 transports，并包含 connection lifecycle、health、reconnection intent、cancellation、timeout 和 backpressure semantics；v1 只能执行 deterministic fake 或 in-process handlers，并必须对真实 transports 安全失败。

#### Scenario: Unhealthy MCP server is isolated / 不健康 MCP server 被隔离

- **WHEN** an MCP connection fails health checks, violates timeout/backpressure policy, or has no deterministic v1 adapter
- **THEN** the gateway marks the server unhealthy or unavailable and prevents failures from breaking the base runtime
- **中文** 当 MCP connection 未通过 health checks、违反 timeout/backpressure policy 或没有 deterministic v1 adapter 时，gateway 必须将 server 标记为 unhealthy 或 unavailable，并防止失败破坏基础 runtime。

#### Scenario: Real transport fails closed in v1 / v1 真实传输安全失败

- **WHEN** a stdio, HTTP, WebSocket, or IDE-provided MCP server is connected in v1 without an approved deterministic adapter
- **THEN** discovery and invocation return typed `MCP_TRANSPORT_UNAVAILABLE` diagnostics instead of attempting process, network, or host API access
- **中文** 当 stdio、HTTP、WebSocket 或 IDE-provided MCP server 在 v1 中没有 approved deterministic adapter 时，discovery 与 invocation 必须返回 typed `MCP_TRANSPORT_UNAVAILABLE` diagnostics，而不是尝试 process、network 或 host API access。

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

## ADDED Requirements

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
