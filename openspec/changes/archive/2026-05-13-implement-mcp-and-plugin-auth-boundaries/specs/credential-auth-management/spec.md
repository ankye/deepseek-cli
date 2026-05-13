## ADDED Requirements

### Requirement: Extension Scoped Credential Grants / 扩展作用域凭证 Grant

Credential auth management SHALL create, list, revoke, diagnose, and authorize scoped credential grants for extension owners while keeping raw credential resolution behind credential storage adapters.

Credential auth management 必须为 extension owners 创建、列出、撤销、诊断并授权 scoped credential grants，同时将 raw credential resolution 保持在 credential storage adapters 之后。

#### Scenario: Grant creation returns metadata only / 创建 Grant 仅返回元数据

- **WHEN** a host-mediated auth flow creates a grant for an MCP server or plugin contribution
- **THEN** credential auth management stores only the necessary reference metadata and returns a grant record with credential reference id, owner scope, operation scope, redaction metadata, audit metadata, and replay fingerprint
- **中文** 当 host-mediated auth flow 为 MCP server 或 plugin contribution 创建 grant 时，credential auth management 必须只存储必要 reference metadata，并返回 grant record，包含 credential reference id、owner scope、operation scope、redaction metadata、audit metadata 与 replay fingerprint。

#### Scenario: Revoke grant prevents later authorization / 撤销 Grant 阻止后续授权

- **WHEN** a scoped grant is revoked
- **THEN** later authorization requests using that grant return typed revoked diagnostics and do not resolve raw credentials
- **中文** 当 scoped grant 被撤销时，后续使用该 grant 的 authorization requests 必须返回 typed revoked diagnostics，且不解析 raw credentials。

### Requirement: Extension Auth Diagnostics Remain Metadata-Only / 扩展认证诊断仅保留元数据

Credential auth diagnostics for MCP/plugin extension workflows SHALL report readiness, missing grants, denied scopes, storage availability, and suggested actions without resolving raw credential values.

MCP/plugin extension workflows 的 credential auth diagnostics 必须报告 readiness、missing grants、denied scopes、storage availability 与 suggested actions，且不解析 raw credential values。

#### Scenario: Diagnostic does not call resolve / 诊断不调用 Resolve

- **WHEN** CLI or a host requests extension auth readiness for a plugin or MCP manifest
- **THEN** credential auth management returns metadata-only diagnostics and does not call raw credential resolution
- **中文** 当 CLI 或 host 请求 plugin 或 MCP manifest 的 extension auth readiness 时，credential auth management 必须返回 metadata-only diagnostics，且不调用 raw credential resolution。
