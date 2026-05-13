## MODIFIED Requirements

### Requirement: CLI Index Provider Command Is Local And Safe / CLI Index Provider 命令本地且安全

The CLI SHALL expose local `index-provider status` and `index-provider set` commands that inspect and persist provider manifest intent without executing semantic providers, live model calls, vector databases, code analyzers, or credential resolvers, and text output SHALL explain activation evidence status for configured providers.

CLI 必须暴露本地 `index-provider status` 与 `index-provider set` 命令，用于检查和持久化 provider manifest intent，且不得执行 semantic providers、live model calls、vector databases、code analyzers 或 credential resolvers；text output 必须解释已配置 providers 的 activation evidence status。

#### Scenario: Status renders effective provider diagnostics / Status 渲染 Effective Provider Diagnostics
- **WHEN** a user runs `deepseek index-provider status`
- **THEN** the CLI renders manifest source, provider count, requested statuses, effective statuses, implementation evidence, activation evidence statuses, and validation diagnostic codes in text and structured modes
- **中文** 当用户运行 `deepseek index-provider status` 时，CLI 必须在 text 与 structured modes 渲染 manifest source、provider count、requested statuses、effective statuses、implementation evidence、activation evidence statuses 与 validation diagnostic codes。

#### Scenario: Set previews normalized result / Set 预览归一化结果
- **WHEN** a user runs `deepseek index-provider set zvec enabled`
- **THEN** the CLI writes safe provider intent and outputs the normalized result showing `zvec` requested as `enabled` while effective status remains `deferred` until implementation evidence and activation evidence exist
- **中文** 当用户运行 `deepseek index-provider set zvec enabled` 时，CLI 必须写入安全 provider intent，并输出 normalized result，显示 `zvec` requested 为 `enabled`，但在 implementation evidence 与 activation evidence 存在前 effective status 仍为 `deferred`。

#### Scenario: Text output explains missing activation evidence / Text Output 解释缺失 Activation Evidence
- **WHEN** `index-provider status` or `index-provider set` text output includes a semantic provider that is deferred because activation evidence is missing
- **THEN** the output includes the missing activation evidence kinds and typed diagnostic codes without raw secrets, SDK objects, ANSI, cursor state, or live provider calls
- **中文** 当 `index-provider status` 或 `index-provider set` text output 包含因 activation evidence 缺失而 deferred 的 semantic provider 时，输出必须包含缺失的 activation evidence kinds 与 typed diagnostic codes，且不得包含 raw secrets、SDK objects、ANSI、cursor state 或 live provider calls。

## MODIFIED Requirements

### Requirement: CLI Doctor Reports Provider Manifest Source / CLI Doctor 报告 Provider Manifest 来源

CLI diagnostics and readiness doctor SHALL report index provider manifest source, activation evidence status, and validation diagnostics from shared provider normalization without exposing raw secrets or executing provider SDKs; text output SHALL include the same missing-evidence reason that structured output carries.

CLI diagnostics 与 readiness doctor 必须从 shared provider normalization 报告 index provider manifest source、activation evidence status 与 validation diagnostics，且不得暴露 raw secrets 或执行 provider SDKs；text output 必须包含 structured output 携带的同一 missing-evidence reason。

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
- **THEN** doctor output includes the effective `deferred` status, requested `enabled` status, missing evidence kinds, and typed diagnostic codes in text and structured modes without exposing provider credentials or SDK objects
- **中文** 当 semantic provider 被请求为 `enabled`，但 shared resolver 因 activation evidence 缺失或 unknown 而将其降级时，doctor output 必须在 text 与 structured modes 包含 effective `deferred` status、requested `enabled` status、missing evidence kinds 与 typed diagnostic codes，且不得暴露 provider credentials 或 SDK objects。
