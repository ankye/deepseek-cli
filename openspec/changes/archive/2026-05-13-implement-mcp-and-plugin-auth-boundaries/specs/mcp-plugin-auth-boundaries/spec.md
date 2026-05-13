## ADDED Requirements

### Requirement: Scoped Extension Credential Grants / 作用域化扩展凭证授权

The platform SHALL define scoped credential grant records for extension owners, including MCP servers, plugin contributions, skills, hooks, and future external connectors, without exposing raw credential values outside credential-auth-management.

平台必须为 extension owners 定义 scoped credential grant records，覆盖 MCP servers、plugin contributions、skills、hooks 与未来 external connectors，且不得在 credential-auth-management 之外暴露 raw credential values。

#### Scenario: Grant carries owner and operation scope / Grant 携带 owner 与 operation scope

- **WHEN** a credential grant is created for an extension owner
- **THEN** it includes schema version, grant id, credential reference id, owner kind, owner id, allowed operations, trust scope, workspace/session scope, expiration or revocation metadata, redaction metadata, and replay fingerprint
- **中文** 当为 extension owner 创建 credential grant 时，必须包含 schema version、grant id、credential reference id、owner kind、owner id、allowed operations、trust scope、workspace/session scope、expiration 或 revocation metadata、redaction metadata 与 replay fingerprint。

#### Scenario: Grant does not contain raw secret / Grant 不包含原始密钥

- **WHEN** a grant is serialized to CLI output, JSONL, protocol records, audit records, lockfiles, or test fixtures
- **THEN** the record contains only credential references and redacted summaries, never raw credential values
- **中文** 当 grant 被序列化到 CLI output、JSONL、protocol records、audit records、lockfiles 或 test fixtures 时，记录只能包含 credential references 与 redacted summaries，绝不能包含 raw credential values。

### Requirement: Extension Credential Authorization / 扩展凭证授权

The platform SHALL authorize MCP/plugin credential use through a typed, fail-closed authorization result before extension-owned code, handlers, adapters, or transports can access credential-backed operations.

平台必须在 extension-owned code、handlers、adapters 或 transports 访问 credential-backed operations 前，通过 typed、fail-closed authorization result 授权 MCP/plugin credential use。

#### Scenario: Matching grant authorizes operation / 匹配 Grant 授权操作

- **WHEN** an MCP server or plugin contribution requests an operation that matches its declared credential requirement and a non-expired grant with matching owner, operation, trust, and workspace scope exists
- **THEN** authorization returns an allowed result with grant reference metadata, audit metadata, redaction metadata, and replay fingerprint
- **中文** 当 MCP server 或 plugin contribution 请求的 operation 匹配其 declared credential requirement，且存在 owner、operation、trust 与 workspace scope 匹配且未过期的 grant 时，authorization 必须返回 allowed result，包含 grant reference metadata、audit metadata、redaction metadata 与 replay fingerprint。

#### Scenario: Scope mismatch denies before resolve / Scope 不匹配时解析前拒绝

- **WHEN** an extension owner requests a credential outside declared permissions, outside grant scope, with a revoked grant, or with mismatched trust metadata
- **THEN** authorization returns a typed denied result and no raw credential resolver is called
- **中文** 当 extension owner 请求超出 declared permissions、超出 grant scope、使用已撤销 grant 或 trust metadata 不匹配的 credential 时，authorization 必须返回 typed denied result，且不得调用 raw credential resolver。

### Requirement: Auth Evidence Is CLI And Replay Safe / 认证证据对 CLI 与 Replay 安全

MCP/plugin auth boundary results SHALL be represented as bounded evidence that CLI, protocol, audit, and regression replay can consume without host-specific state.

MCP/plugin auth boundary results 必须表示为有界 evidence，使 CLI、protocol、audit 与 regression replay 可以在没有 host-specific state 的情况下消费。

#### Scenario: Denial evidence is structured / 拒绝证据结构化

- **WHEN** an MCP/plugin credential request is denied
- **THEN** the evidence includes typed reason, owner metadata, required operations, available grant summary, redaction metadata, pit fixture ids when applicable, audit fingerprint, and replay fingerprint without raw secret values
- **中文** 当 MCP/plugin credential request 被拒绝时，evidence 必须包含 typed reason、owner metadata、required operations、available grant summary、redaction metadata、适用时的 pit fixture ids、audit fingerprint 与 replay fingerprint，且不包含 raw secret values。

#### Scenario: CLI text and JSONL share evidence / CLI Text 与 JSONL 共享证据

- **WHEN** CLI extension/auth commands render auth readiness or denial
- **THEN** text output and JSONL output derive from the same structured evidence records and preserve redaction metadata
- **中文** 当 CLI extension/auth commands 渲染 auth readiness 或 denial 时，text output 与 JSONL output 必须来自同一 structured evidence records，并保留 redaction metadata。
