# mcp-gateway Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: MCP Gateway Boundary

The platform SHALL define an MCP gateway that adapts external MCP servers into platform capabilities, resources, prompts, commands, and context providers through explicit trust, policy, timeout, and audit boundaries.

平台必须定义 MCP gateway，通过显式 trust、policy、timeout 和 audit boundaries，把外部 MCP servers 适配为平台 capabilities、resources、prompts、commands 和 context providers。

#### Scenario: MCP tool becomes capability

- **WHEN** an enabled MCP server exposes a tool
- **THEN** the MCP gateway registers it as a namespaced capability with source, transport, permission, timeout, schema, and audit metadata

#### Scenario: MCP prompt becomes command or skill input

- **WHEN** an enabled MCP server exposes a prompt
- **THEN** the MCP gateway converts it into a governed command, skill input, or context provider according to manifest and policy metadata

### Requirement: MCP Transport and Connection Management

The MCP gateway SHALL model stdio, HTTP, WebSocket, in-process, IDE-provided, and future transports with connection lifecycle, health, reconnection, cancellation, timeout, and backpressure semantics.

MCP gateway 必须建模 stdio、HTTP、WebSocket、in-process、IDE-provided 和未来 transports，并包含 connection lifecycle、health、reconnection、cancellation、timeout 和 backpressure semantics。

#### Scenario: Unhealthy MCP server is isolated

- **WHEN** an MCP connection fails health checks or violates timeout/backpressure policy
- **THEN** the gateway marks the server unhealthy and prevents failures from breaking the base runtime

### Requirement: MCP Resource Governance

The MCP gateway SHALL treat MCP resources as explicit external resources with URI identity, source trust, read permissions, redaction class, cache policy, and provenance.

MCP gateway 必须把 MCP resources 作为显式 external resources 处理，包含 URI identity、source trust、read permissions、redaction class、cache policy 和 provenance。

#### Scenario: Read MCP resource

- **WHEN** a model, skill, command, or user requests an MCP resource
- **THEN** the request is authorized, fetched through the gateway, cached according to resource policy, and represented as a context node or capability result

### Requirement: MCP Security and Namespacing

The MCP gateway SHALL namespace all external capabilities, isolate server-provided instructions from system authority, and require policy approval for privileged server actions.

MCP gateway 必须对所有 external capabilities 做 namespace 隔离，将 server-provided instructions 与 system authority 隔离，并对 privileged server actions 要求 policy approval。

#### Scenario: Server instruction is non-authoritative

- **WHEN** an external server provides instructions or descriptions
- **THEN** they are marked as untrusted external context and cannot override platform policy, system instructions, or sandbox boundaries

### Requirement: MCP Calls Use Governed Invocation

The MCP gateway SHALL normalize MCP tools, resource reads, prompts, commands, and context providers into governed capability invocations when they are fetched, projected into runtime context, or executed.

MCP gateway 必须在 MCP tools、resource reads、prompts、commands 和 context providers 被 fetch、project into runtime context 或 execute 时，将其规范化为 governed capability invocations。

#### Scenario: External MCP tool is governed

- **WHEN** an MCP tool is called
- **THEN** the gateway creates an envelope with server id, namespace, transport, trust, permissions, timeout, resource policy, redaction, audit, and replay metadata before dispatch

#### Scenario: MCP resource read is governed

- **WHEN** a model, skill, command, hook, agent, or user requests an MCP resource
- **THEN** the request is authorized and traced through the governed execution pipeline rather than treated as untracked context

