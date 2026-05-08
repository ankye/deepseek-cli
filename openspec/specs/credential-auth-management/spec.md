# credential-auth-management Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
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

### Requirement: Provider Credential Injection

Model provider adapters SHALL obtain provider credentials only through injected platform credential resolution and SHALL NOT read raw environment variables, local secret files, host keychains, or editor secrets directly.

model provider adapters 必须只通过注入的 platform credential resolution 获取 provider credentials，不得直接读取 raw environment variables、local secret files、host keychains 或 editor secrets。

#### Scenario: DeepSeek credential is missing

- **WHEN** a DeepSeek provider request requires authentication and the injected credential resolver cannot provide a credential
- **THEN** the provider emits a typed missing-credential error with secret-safe redaction metadata

#### Scenario: Raw credential access is rejected

- **WHEN** provider source code reads `process.env`, filesystem secrets, or host credential APIs directly for model credentials
- **THEN** architecture lint fails with a stable credential-boundary rule id

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

### Requirement: Live Smoke Credential Loading / Live Smoke 凭证加载

Credential handling for live smoke SHALL load DeepSeek credentials from process environment or a local `.env` file as scoped secret references without adding `.env` contents to traces, test fixtures, or committed files.

live smoke 的 credential handling 必须从 process environment 或本地 `.env` 文件加载 DeepSeek credentials，并作为 scoped secret references 使用，不得把 `.env` 内容加入 traces、test fixtures 或 committed files。

#### Scenario: Environment credential is preferred / 优先使用环境凭证

- **WHEN** both process environment and `.env` contain a DeepSeek credential
- **THEN** the process environment value is used and represented as a secret credential reference
- **中文** 当 process environment 和 `.env` 都包含 DeepSeek credential 时，必须使用 process environment 值，并表示为 secret credential reference。

#### Scenario: Missing credential skips live smoke / 缺少凭证时跳过 live smoke

- **WHEN** live smoke is enabled but no DeepSeek credential is available
- **THEN** the smoke exits as skipped or unavailable without failing default deterministic tests
- **中文** 当 live smoke 已启用但没有 DeepSeek credential 时，smoke 必须以 skipped 或 unavailable 退出，且不影响默认 deterministic tests。

### Requirement: R1 Local Credential Reference / R1 本地凭证引用

Credential auth management SHALL support R1 local credential presence checks for `DEEPSEEK_API_KEY` and `DEEPSEEK_TOKEN` as secret references without raw value output.

credential auth management 必须支持 R1 local credential presence checks，将 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_TOKEN` 作为 secret references 处理，且不输出 raw value。

#### Scenario: Credential presence is redacted / 凭证存在性被脱敏

- **WHEN** readiness auth checks find a DeepSeek credential
- **THEN** the result includes credential reference id, source class, redaction class, and availability status without the raw credential value
- **中文** 当 readiness auth checks 找到 DeepSeek credential 时，结果必须包含 credential reference id、source class、redaction class 和 availability status，但不包含 raw credential value。

#### Scenario: Missing credential is actionable / 缺少凭证可操作

- **WHEN** readiness auth checks do not find a DeepSeek credential
- **THEN** the result reports a warning with setup instructions that do not require storing secrets in tracked files
- **中文** 当 readiness auth checks 未找到 DeepSeek credential 时，结果必须报告 warning，并提供不要求把 secrets 存入 tracked files 的 setup instructions。

