## ADDED Requirements

### Requirement: Plugin Credential Requirement Evidence / 插件凭证需求证据

The plugin system SHALL model plugin credential requirements as lifecycle and contribution metadata that can be diffed, audited, and rendered without creating or resolving raw credentials during install, apply-lockfile, verify, enable, or list operations.

Plugin system 必须将 plugin credential requirements 建模为 lifecycle 与 contribution metadata，可用于 diff、audit 与 rendering，且 install、apply-lockfile、verify、enable 或 list operations 期间不得创建或解析 raw credentials。

#### Scenario: Install returns auth requirement evidence / Install 返回认证需求证据

- **WHEN** a plugin manifest declares credential requirements
- **THEN** `install(manifest)` returns auth requirement evidence alongside permission diff and lock entry metadata without prompting for or resolving raw credentials
- **中文** 当 plugin manifest 声明 credential requirements 时，`install(manifest)` 必须在 permission diff 与 lock entry metadata 旁返回 auth requirement evidence，且不提示输入或解析 raw credentials。

#### Scenario: Apply lockfile preserves auth metadata / Apply Lockfile 保留认证元数据

- **WHEN** a plugin lockfile entry includes credential requirement metadata
- **THEN** `applyLockfile(lockfile)` preserves the metadata in deterministic lifecycle evidence and does not treat the credential as satisfied unless a scoped grant exists
- **中文** 当 plugin lockfile entry 包含 credential requirement metadata 时，`applyLockfile(lockfile)` 必须在 deterministic lifecycle evidence 中保留该 metadata，且除非存在 scoped grant，否则不得将 credential 视为已满足。

### Requirement: Plugin Contribution Activation Checks Credential Grants / 插件贡献激活检查凭证 Grant

Plugin-contributed commands, hooks, skills, MCP connectors, tools, workflow templates, and context providers SHALL check scoped credential grants before activation when they declare credential-backed operations.

Plugin-contributed commands、hooks、skills、MCP connectors、tools、workflow templates 与 context providers 在声明 credential-backed operations 时，必须在 activation 前检查 scoped credential grants。

#### Scenario: Contribution denied before activation / 贡献激活前被拒绝

- **WHEN** a plugin contribution declares a credential-backed operation but no matching scoped grant exists
- **THEN** activation returns typed auth-denied evidence and the owning subsystem is not asked to execute or register the credential-backed contribution
- **中文** 当 plugin contribution 声明 credential-backed operation 但不存在匹配 scoped grant 时，activation 必须返回 typed auth-denied evidence，且不得要求 owning subsystem 执行或注册该 credential-backed contribution。

#### Scenario: Permission and auth expansion are both visible / 权限与认证扩张均可见

- **WHEN** a plugin update adds permissions or credential requirements compared with the lockfile baseline
- **THEN** lifecycle evidence reports both permission diff and auth requirement diff with pit fixture ids, audit metadata, and replay fingerprint
- **中文** 当 plugin update 相比 lockfile baseline 增加 permissions 或 credential requirements 时，lifecycle evidence 必须同时报告 permission diff 与 auth requirement diff，并包含 pit fixture ids、audit metadata 与 replay fingerprint。
