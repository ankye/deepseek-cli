# config Specification

## Purpose
TBD - created by archiving change implement-persistent-config-and-auth. Update Purpose after archive.
## Requirements
### Requirement: Persistent Config Service / 持久化配置服务

The config capability SHALL provide a host-neutral service for loading, validating, resolving, redacting, and saving DeepSeek CLI configuration across built-in defaults, user config, workspace config, environment values, and CLI overrides.

config capability 必须提供 host-neutral service，用于跨 built-in defaults、user config、workspace config、environment values 和 CLI overrides 加载、校验、解析、脱敏和保存 DeepSeek CLI 配置。

#### Scenario: Config resolves with stable precedence / 配置按稳定优先级解析

- **WHEN** the same config key appears in defaults, user config, workspace config, environment, and CLI overrides
- **THEN** the resolved value uses CLI overrides first, then environment, then workspace config, then user config, then defaults, and records source metadata for every resolved key
- **中文** 当同一个 config key 同时出现在 defaults、user config、workspace config、environment 和 CLI overrides 中时，解析结果必须按 CLI overrides、environment、workspace config、user config、defaults 的顺序取值，并记录每个 resolved key 的 source metadata。

#### Scenario: Config validation reports structured diagnostics / 配置校验报告结构化诊断

- **WHEN** config contains unknown keys, invalid values, deprecated keys, incompatible schema versions, or secret-like raw values
- **THEN** the config service returns structured diagnostics with severity, key path, source, redaction metadata, and suggested actions
- **中文** 当 config 包含 unknown keys、invalid values、deprecated keys、incompatible schema versions 或 secret-like raw values 时，config service 必须返回包含 severity、key path、source、redaction metadata 和 suggested actions 的 structured diagnostics。

### Requirement: Config Persistence Format / 配置持久化格式

The config capability SHALL persist user and workspace config documents with schema version, profile id, source path metadata, redaction metadata, and migration metadata.

config capability 必须持久化包含 schema version、profile id、source path metadata、redaction metadata 和 migration metadata 的 user 与 workspace config documents。

#### Scenario: Config write is atomic / 配置写入是原子的

- **WHEN** user or workspace config is saved
- **THEN** the write uses platform atomic write behavior, preserves schema version metadata, and fails with a structured error instead of producing a partial config document
- **中文** 当保存 user 或 workspace config 时，写入必须使用 platform atomic write behavior，保留 schema version metadata，并在失败时返回 structured error，而不是产生 partial config document。

#### Scenario: Raw secrets are rejected from config / 原始密钥被配置拒绝

- **WHEN** a config write attempts to persist a raw API key, token, password, secret, or credential-like value
- **THEN** the config service rejects or redacts the value and directs the caller to credential-auth-management for credential reference storage
- **中文** 当 config write 试图持久化 raw API key、token、password、secret 或 credential-like value 时，config service 必须拒绝或脱敏该值，并引导调用方使用 credential-auth-management 存储 credential reference。

### Requirement: Config Command Projection / 配置命令投影

The config capability SHALL expose command-safe projections for CLI, VSCode, server, JSON, and replay consumers without exposing host-specific filesystem or UI objects.

config capability 必须为 CLI、VSCode、server、JSON 和 replay consumers 暴露 command-safe projections，且不暴露 host-specific filesystem 或 UI objects。

#### Scenario: Config command renders redacted values / 配置命令渲染脱敏值

- **WHEN** `deepseek config` displays resolved or persisted config
- **THEN** output includes key, redacted value, source, profile, schema version, diagnostics, and suggested actions without printing raw secrets
- **中文** 当 `deepseek config` 显示 resolved 或 persisted config 时，输出必须包含 key、redacted value、source、profile、schema version、diagnostics 和 suggested actions，且不得打印 raw secrets。

#### Scenario: Config command writes scoped values / 配置命令写入限定范围的值

- **WHEN** `deepseek config set` writes a user-level or workspace-level value
- **THEN** the command declares scope, validates schema, writes through the config service, and returns a structured command result with source metadata
- **中文** 当 `deepseek config set` 写入 user-level 或 workspace-level value 时，command 必须声明 scope、校验 schema、通过 config service 写入，并返回带 source metadata 的 structured command result。

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
