## ADDED Requirements

### Requirement: Extension Credential Scope Diagnostics / 扩展凭证作用域诊断

Credential auth management SHALL expose metadata-only diagnostics for provider, plugin, MCP connector, skill, and extension credential scopes without resolving raw credential values.

Credential auth management 必须为 provider、plugin、MCP connector、skill 和 extension credential scopes 暴露 metadata-only diagnostics，且不解析 raw credential values。

#### Scenario: Scope diagnostic is metadata-only / 作用域诊断仅含元数据
- **WHEN** CLI extension management requests credential scope diagnostics
- **THEN** the credential service returns reference id, scope, source class, availability, storage status, audit metadata, redaction metadata, and suggested actions without raw secret values
- **中文** 当 CLI extension management 请求 credential scope diagnostics 时，credential service 必须返回 reference id、scope、source class、availability、storage status、audit metadata、redaction metadata 和 suggested actions，且不包含 raw secret values。

#### Scenario: Connector scope denial is typed / Connector 作用域拒绝有类型
- **WHEN** an MCP or plugin connector requests a credential reference outside its declared permissions
- **THEN** credential diagnostics report a typed scope-denied result with audit metadata and do not call `resolve`
- **中文** 当 MCP 或 plugin connector 请求超出声明 permissions 的 credential reference 时，credential diagnostics 必须报告 typed scope-denied result 与 audit metadata，且不调用 `resolve`。

### Requirement: Extension Auth Redaction Pit Evidence / 扩展认证脱敏坑位证据

Credential diagnostics used by extension management SHALL cite environment snapshot and diagnostic redaction pit fixtures when serializing credential presence or unavailable storage evidence.

Extension management 使用的 credential diagnostics 在序列化 credential presence 或 unavailable storage evidence 时，必须引用 environment snapshot 与 diagnostic redaction 坑位 fixtures。

#### Scenario: Env presence cites immutable snapshot pit / 环境存在性引用不可变快照坑位
- **WHEN** credential diagnostics observe environment credential presence
- **THEN** output records only presence metadata and cites `pit.env-snapshot.immutable-startup`
- **中文** 当 credential diagnostics 观察到环境凭证存在性时，输出必须只记录 presence metadata，并引用 `pit.env-snapshot.immutable-startup`。

#### Scenario: Credential diagnostics are safe to serialize / 凭证诊断可安全序列化
- **WHEN** tests serialize extension auth diagnostics
- **THEN** the result excludes raw credential values and cites `pit.diagnostic-redaction.support-bundle`
- **中文** 当测试序列化 extension auth diagnostics 时，结果必须排除 raw credential values，并引用 `pit.diagnostic-redaction.support-bundle`。
