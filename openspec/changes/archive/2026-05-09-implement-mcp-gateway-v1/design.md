## Context

MCP currently exists as a package and an architecture landing zone, but the implementation exposes only a minimal fake API. That is enough for early integration tests, but it is not enough for a future-ready external capability boundary because external MCP servers can contribute tools, resources, prompts, and instructions that cross trust, network, credential, and policy boundaries.

MCP 当前已经有 package 与架构落点，但实现只暴露了最小 fake API。这足以支撑早期 integration tests，但不足以成为面向未来的外部能力边界，因为外部 MCP servers 会贡献 tools、resources、prompts 和 instructions，并跨越 trust、network、credential 与 policy boundaries。

This change follows the same direction used by skills v1 and hooks v1: remove generic pre-v1 APIs, define canonical versioned DTOs, keep v1 deterministic, and use tests/lint to enforce the boundary.

本变更沿用 skills v1 与 hooks v1 的方向：移除泛化 pre-v1 APIs，定义 canonical versioned DTOs，保持 v1 deterministic，并用 tests/lint 强制边界。

## Goals / Non-Goals

**Goals:**

- Create canonical MCP gateway v1 contracts and implementation. / 创建 canonical MCP gateway v1 契约与实现。
- Treat MCP servers as external contributions with explicit manifest validation, namespace, trust, permissions, transport declaration, timeout, redaction, health, and audit metadata. / 将 MCP servers 作为外部贡献处理，并显式声明 manifest validation、namespace、trust、permissions、transport declaration、timeout、redaction、health 和 audit metadata。
- Support deterministic fake/in-process tools, resources, and prompts for package, contract, integration, golden, compatibility, and matrix tests. / 支持 deterministic fake/in-process tools、resources 和 prompts，用于 package、contract、integration、golden、compatibility 和 matrix tests。
- Record replayable invocation/resource evidence with redacted payloads and stable fingerprints. / 记录可 replay 的 invocation/resource evidence，包含脱敏 payload 与稳定 fingerprints。
- Enforce that MCP executable calls remain owned by `mcp-gateway` or the governed runtime path. / 强制 MCP executable calls 由 `mcp-gateway` 或受治理 runtime path 拥有。

**Non-Goals:**

- No real stdio/HTTP/WebSocket MCP transport execution in this OpenSpec. / 本 OpenSpec 不实现真实 stdio/HTTP/WebSocket MCP 传输执行。
- No OAuth/device-code or plugin credential flow; that is `implement-mcp-and-plugin-auth-boundaries`. / 不实现 OAuth/device-code 或 plugin credential flow；该部分属于 `implement-mcp-and-plugin-auth-boundaries`。
- No full plugin packaging or lockfile support; that is `implement-plugin-lockfile-v1`. / 不实现完整 plugin packaging 或 lockfile；该部分属于 `implement-plugin-lockfile-v1`。
- No MCP server mode for exposing DeepSeek as an MCP server. / 不实现将 DeepSeek 暴露为 MCP server 的 server mode。

## Decisions

### 1. Canonical v1 API replaces pre-v1 generic methods

`McpGateway` will expose `validateManifest`, `connectServer`, `listServers`, `listTools`, `listResources`, `listPrompts`, `callTool`, and `readResource`. The old `connect(manifest)`, `listTools(namespace)`, and `callTool(namespace, name, input)` signatures are removed.

`McpGateway` 将暴露 `validateManifest`、`connectServer`、`listServers`、`listTools`、`listResources`、`listPrompts`、`callTool` 和 `readResource`。旧的 `connect(manifest)`、`listTools(namespace)` 和 `callTool(namespace, name, input)` 签名会被移除。

Rationale: DeepSeek has no production compatibility burden, so the codebase should fail fast when old shortcuts reappear. This mirrors skills/hooks v1 and keeps all call sites explicit about schema version, server id, namespace, caller, trace, timeout, and redaction.

理由：DeepSeek 没有生产兼容负担，所以旧 shortcut 重新出现时应快速失败。这与 skills/hooks v1 一致，并让所有调用点显式声明 schema version、server id、namespace、caller、trace、timeout 和 redaction。

### 2. Real transports are declared, not executed

The manifest supports `stdio`, `http`, `websocket`, `in-process`, `ide`, and `fake`, but v1 only executes fake/in-process adapter handlers registered in memory. Non-deterministic real transports fail closed with `MCP_TRANSPORT_UNAVAILABLE`.

manifest 支持 `stdio`、`http`、`websocket`、`in-process`、`ide` 和 `fake`，但 v1 只执行内存中注册的 fake/in-process adapter handlers。非 deterministic 的真实传输以 `MCP_TRANSPORT_UNAVAILABLE` 安全失败。

Rationale: the first MCP version should prove governance, replay, and safety before adding process/network lifecycle complexity.

理由：第一版 MCP 应先证明治理、回放与安全，再引入 process/network lifecycle 复杂度。

### 3. Discovery is metadata-only; calls are governed evidence

Tool/resource/prompt discovery returns summaries and never executes external work. `callTool` and `readResource` return typed result records with permission, policy metadata, redaction, diagnostics, and replay fingerprints. v1 does not mutate global runtime state through MCP records.

tool/resource/prompt discovery 只返回 summary，不执行外部工作。`callTool` 与 `readResource` 返回 typed result records，包含 permission、policy metadata、redaction、diagnostics 和 replay fingerprints。v1 不通过 MCP records 修改全局 runtime state。

Rationale: discovery can be projected into model/tool registries later, but executable work must remain auditable and replayable.

理由：discovery 后续可以投影到 model/tool registries，但 executable work 必须保持可审计、可 replay。

### 4. Namespaces are part of security, not display labels

Manifest namespace validation is strict and stable. Tool names are exposed as `namespace.toolName` in summary metadata while requests use `serverId` plus local tool/resource name to avoid ambiguous routing.

manifest namespace validation 严格且稳定。tool name 在 summary metadata 中暴露为 `namespace.toolName`，而 request 使用 `serverId` 加本地 tool/resource name，避免路由歧义。

Rationale: external servers must not collide with built-ins or each other, and user-visible labels cannot be trusted as authority.

理由：外部 servers 不得与 built-ins 或彼此冲突，且用户可见 label 不能作为 authority。

### 5. Lint enforces no pre-v1 MCP API

Add an MCP-specific lint rule to reject `McpGateway.connect`, `listTools(namespace: string)`, and `callTool(namespace, name, input)` style contracts/implementations. Update governed execution conventions to only allow canonical v1 methods.

增加 MCP-specific lint rule，拒绝 `McpGateway.connect`、`listTools(namespace: string)` 和 `callTool(namespace, name, input)` 风格的契约/实现。更新 governed execution conventions，只允许 canonical v1 methods。

Rationale: tests catch behavior, lint catches architecture drift before review.

理由：tests 捕获行为问题，lint 在 review 前捕获架构漂移。

## Risks / Trade-offs

- [Risk] v1 does not connect to real MCP servers yet. / [风险] v1 还不能连接真实 MCP servers。  
  Mitigation: keep transport metadata explicit and add deterministic failure diagnostics so later real transports can plug in without changing contracts. / 缓解：保持 transport metadata 显式，并增加 deterministic failure diagnostics，使后续真实传输可在不改变契约的情况下接入。

- [Risk] fake/in-process handlers could become a bypass if used outside owner/runtime paths. / [风险] fake/in-process handlers 如果在 owner/runtime paths 外使用，可能成为绕过路径。  
  Mitigation: governed execution lint allows MCP calls only inside `mcp-gateway`, `runtime`, deterministic fakes, and tests. / 缓解：governed execution lint 只允许 `mcp-gateway`、`runtime`、deterministic fakes 与 tests 调用 MCP。

- [Risk] strict namespace validation may reject some existing MCP ecosystem naming patterns. / [风险] 严格 namespace validation 可能拒绝某些现有 MCP 生态命名模式。  
  Mitigation: normalize at configuration/plugin install time in later OpenSpecs, not at runtime execution time. / 缓解：后续在 configuration/plugin install 阶段 normalize，而不是在 runtime execution 阶段放宽。

## Migration Plan

There is no production migration. Tests and deterministic fakes move directly from pre-v1 calls to v1 APIs.

没有生产迁移。测试和 deterministic fakes 直接从 pre-v1 calls 切换到 v1 APIs。

## Open Questions

- Which real MCP transport should be implemented first: stdio or HTTP? / 第一个真实 MCP transport 应先实现 stdio 还是 HTTP？
- Should MCP prompt projection become a command-system contribution or a context-engine contribution first? / MCP prompt projection 应先成为 command-system contribution 还是 context-engine contribution？
