## ADDED Requirements

### Requirement: Credential Roadmap Staging / 凭证路线图分阶段

Credential and auth management SHALL stage personal provider credentials in R0/R1, MCP and plugin connector credentials in R3, remote/server credentials in R4, and enterprise-managed credentials in R7.

credential and auth management 必须将 personal provider credentials 放在 R0/R1，将 MCP 和 plugin connector credentials 放在 R3，将 remote/server credentials 放在 R4，将 enterprise-managed credentials 放在 R7。

#### Scenario: Personal credential is required before live provider launch / live provider 发布前需要个人凭证

- **WHEN** a roadmap node enables live provider execution
- **THEN** it declares scoped credential reference setup, redaction, rotation metadata, and no-raw-secret trace evidence
- **中文** 当路线图节点启用 live provider execution 时，必须声明 scoped credential reference setup、redaction、rotation metadata 和 no-raw-secret trace evidence。

#### Scenario: Connector credential waits for extension governance / connector 凭证等待扩展治理

- **WHEN** MCP, plugin, skill, or external connector auth is proposed
- **THEN** it declares R3 extension governance dependencies, permission scope, host-mediated auth flow, and audit evidence
- **中文** 当提出 MCP、plugin、skill 或 external connector auth 时，必须声明 R3 extension governance dependencies、permission scope、host-mediated auth flow 和 audit evidence。
