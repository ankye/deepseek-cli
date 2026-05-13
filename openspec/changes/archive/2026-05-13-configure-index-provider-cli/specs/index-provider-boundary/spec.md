## ADDED Requirements

### Requirement: Provider Intent Is CLI-Manageable / Provider Intent 可由 CLI 管理

Index provider boundary SHALL allow CLI host adapters to persist known provider intent while preserving shared manifest normalization as the only authority for effective provider status.

Index provider boundary 必须允许 CLI host adapters 持久化已知 provider intent，同时保持 shared manifest normalization 作为 effective provider status 的唯一权威。

#### Scenario: CLI set stores requested intent only / CLI Set 只存储 Requested Intent
- **WHEN** a user requests `zvec` or `code-index` status through the CLI
- **THEN** the stored manifest records requested provider intent and implementation evidence metadata, while the effective status is recomputed by the shared resolver
- **中文** 当用户通过 CLI 请求 `zvec` 或 `code-index` status 时，存储的 manifest 只记录 requested provider intent 与 implementation evidence metadata，effective status 必须由 shared resolver 重新计算。

#### Scenario: Unknown providers are rejected before persistence / 未知 Provider 持久化前被拒绝
- **WHEN** a CLI user provides an unknown provider id or unsupported status
- **THEN** the CLI returns a typed local failure and does not write provider config
- **中文** 当 CLI 用户提供 unknown provider id 或 unsupported status 时，CLI 必须返回 typed local failure，且不得写入 provider config。
