## ADDED Requirements

### Requirement: CLI Index Provider Command Is Local And Safe / CLI Index Provider 命令本地且安全

The CLI SHALL expose local `index-provider status` and `index-provider set` commands that inspect and persist provider manifest intent without executing semantic providers, live model calls, vector databases, code analyzers, or credential resolvers.

CLI 必须暴露本地 `index-provider status` 与 `index-provider set` 命令，用于检查和持久化 provider manifest intent，且不得执行 semantic providers、live model calls、vector databases、code analyzers 或 credential resolvers。

#### Scenario: Status renders effective provider diagnostics / Status 渲染 Effective Provider Diagnostics
- **WHEN** a user runs `deepseek index-provider status`
- **THEN** the CLI renders manifest source, provider count, requested statuses, effective statuses, implementation evidence, and validation diagnostic codes in text and structured modes
- **中文** 当用户运行 `deepseek index-provider status` 时，CLI 必须在 text 与 structured modes 渲染 manifest source、provider count、requested statuses、effective statuses、implementation evidence 与 validation diagnostic codes。

#### Scenario: Set previews normalized result / Set 预览归一化结果
- **WHEN** a user runs `deepseek index-provider set zvec enabled`
- **THEN** the CLI writes safe provider intent and outputs the normalized result showing `zvec` requested as `enabled` while effective status remains `deferred` until implementation evidence exists
- **中文** 当用户运行 `deepseek index-provider set zvec enabled` 时，CLI 必须写入安全 provider intent，并输出 normalized result，显示 `zvec` requested 为 `enabled`，但在 implementation evidence 存在前 effective status 仍为 `deferred`。
