## MODIFIED Requirements

### Requirement: CLI Doctor Reports Provider Manifest Source / CLI Doctor 报告 Provider Manifest 来源

CLI diagnostics and readiness doctor SHALL report index provider manifest source, activation evidence status, and validation diagnostics from shared provider normalization without exposing raw secrets or executing provider SDKs.

CLI diagnostics 与 readiness doctor 必须从 shared provider normalization 报告 index provider manifest source、activation evidence status 与 validation diagnostics，且不得暴露 raw secrets 或执行 provider SDKs。

#### Scenario: Doctor includes manifest source metadata / Doctor 包含 Manifest Source Metadata
- **WHEN** a user runs `deepseek diagnostics doctor` or `deepseek readiness doctor`
- **THEN** provider diagnostics include manifest source scope, source id, provider count, effective statuses, requested statuses when downgraded, activation evidence statuses, and validation diagnostic codes
- **中文** 当用户运行 `deepseek diagnostics doctor` 或 `deepseek readiness doctor` 时，provider diagnostics 必须包含 manifest source scope、source id、provider count、effective statuses、降级时的 requested statuses、activation evidence statuses，以及 validation diagnostic codes。

#### Scenario: Doctor does not execute configured semantic providers / Doctor 不执行已配置 Semantic Providers
- **WHEN** a manifest requests ZVec, embedding, or code-index enablement
- **THEN** doctor output is produced from shared manifest normalization only and does not call vector databases, embedding providers, model providers, code analyzers, or credential resolvers for those providers
- **中文** 当 manifest 请求启用 ZVec、embedding 或 code-index 时，doctor output 必须只来自 shared manifest normalization，不得调用 vector databases、embedding providers、model providers、code analyzers 或这些 providers 的 credential resolvers。

#### Scenario: Doctor reports missing activation evidence / Doctor 报告缺失 Activation Evidence
- **WHEN** a semantic provider is requested as `enabled` but the shared resolver downgrades it because activation evidence is missing or unknown
- **THEN** doctor output includes the effective `deferred` status, requested `enabled` status, missing evidence kinds, and typed diagnostic codes without exposing provider credentials or SDK objects
- **中文** 当 semantic provider 被请求为 `enabled`，但 shared resolver 因 activation evidence 缺失或 unknown 而将其降级时，doctor output 必须包含 effective `deferred` status、requested `enabled` status、missing evidence kinds 与 typed diagnostic codes，且不得暴露 provider credentials 或 SDK objects。
