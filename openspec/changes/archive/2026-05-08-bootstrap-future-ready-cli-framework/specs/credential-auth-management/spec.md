## ADDED Requirements

### Requirement: Credential and Auth Boundary

The platform SHALL define credential and authentication management as a host-agnostic service for provider API keys, OAuth tokens, local credentials, enterprise credentials, and external connector credentials.

平台必须把 credential and authentication management 定义为 host-agnostic service，管理 provider API keys、OAuth tokens、local credentials、enterprise credentials 和 external connector credentials。

#### Scenario: Model gateway requests credential reference

- **WHEN** a model adapter needs credentials
- **THEN** it requests a scoped credential reference from the credential service instead of reading environment variables or files directly

#### Scenario: Host performs auth flow through adapter

- **WHEN** authentication requires browser, device-code, editor, or terminal interaction
- **THEN** the host adapter performs the UI flow and returns a structured credential result through shared contracts

### Requirement: Secret Storage and Redaction

The credential service SHALL support secure storage extension points, secret references, redaction rules, rotation metadata, expiration metadata, and audit records.

credential service 必须支持 secure storage extension points、secret references、redaction rules、rotation metadata、expiration metadata 和 audit records。

#### Scenario: Secret value does not enter session trace

- **WHEN** a credential is used by a model provider, MCP connector, plugin installer, or external resource
- **THEN** session, audit, protocol, and runtime bus traces record secret references and redacted summaries instead of raw secret values

### Requirement: Credential Scope and Policy

Credential access SHALL be scoped by provider, workspace, user, host, plugin, skill, connector, and capability permissions.

credential access 必须按 provider、workspace、user、host、plugin、skill、connector 和 capability permissions 进行 scope 管控。

#### Scenario: Plugin cannot read provider credential

- **WHEN** a plugin-contributed capability requests access to a model provider credential outside its declared permission scope
- **THEN** the credential service denies the request and records an audit event
