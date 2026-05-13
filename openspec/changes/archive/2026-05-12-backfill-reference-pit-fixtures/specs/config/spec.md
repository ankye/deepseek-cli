## ADDED Requirements

### Requirement: Config Precedence Pit Fixtures / 配置优先级坑位 Fixtures

Config resolution SHALL include deterministic fixtures for source precedence, provenance, secret rejection, and immutable startup snapshots.

config resolution 必须包含针对 source precedence、provenance、secret rejection 和 immutable startup snapshots 的确定性 fixtures。

#### Scenario: Source precedence remains visible / 来源优先级保持可见

- **WHEN** the same config key is provided by defaults, user, workspace, environment, and CLI sources
- **THEN** resolution selects the highest-priority source and records all shadowed sources with provenance
- **中文** 当同一个 config key 同时由 defaults、user、workspace、environment 和 CLI sources 提供时，resolution 必须选择最高优先级来源，并记录所有 shadowed sources 的 provenance。

#### Scenario: Environment is snapshotted / 环境配置被快照化

- **WHEN** the config service is constructed with environment and CLI values
- **THEN** later mutation of the original input objects cannot change subsequent resolved config values
- **中文** 当 config service 构造时接收 environment 与 CLI values 后，之后对原始 input objects 的修改不得改变后续 resolved config values。

#### Scenario: Raw secrets are rejected / Raw Secrets 被拒绝

- **WHEN** config documents or writes contain raw API keys, bearer tokens, passwords, or secret-like credential values
- **THEN** config validation rejects or redacts them and points callers to credential references
- **中文** 当 config documents 或 writes 包含 raw API keys、bearer tokens、passwords 或 secret-like credential values 时，config validation 必须拒绝或脱敏，并指引调用方使用 credential references。
