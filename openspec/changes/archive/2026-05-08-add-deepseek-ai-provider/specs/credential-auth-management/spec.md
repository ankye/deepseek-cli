## ADDED Requirements

### Requirement: Provider Credential Injection

Model provider adapters SHALL obtain provider credentials only through injected platform credential resolution and SHALL NOT read raw environment variables, local secret files, host keychains, or editor secrets directly.

model provider adapters 必须只通过注入的 platform credential resolution 获取 provider credentials，不得直接读取 raw environment variables、local secret files、host keychains 或 editor secrets。

#### Scenario: DeepSeek credential is missing

- **WHEN** a DeepSeek provider request requires authentication and the injected credential resolver cannot provide a credential
- **THEN** the provider emits a typed missing-credential error with secret-safe redaction metadata

#### Scenario: Raw credential access is rejected

- **WHEN** provider source code reads `process.env`, filesystem secrets, or host credential APIs directly for model credentials
- **THEN** architecture lint fails with a stable credential-boundary rule id
