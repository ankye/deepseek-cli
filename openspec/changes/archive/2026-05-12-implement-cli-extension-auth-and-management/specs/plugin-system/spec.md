## ADDED Requirements

### Requirement: CLI-Consumable Plugin Lifecycle Evidence / CLI 可消费的插件生命周期证据

Plugin lifecycle operations SHALL expose permission diff, lockfile, integrity, audit, and redaction evidence in a shape that CLI and future hosts can render without invoking plugin internals.

Plugin lifecycle operations 必须暴露 permission diff、lockfile、integrity、audit 和 redaction evidence，使 CLI 和未来 hosts 能渲染，而不调用 plugin internals。

#### Scenario: CLI install evidence comes from plugin result / CLI 安装证据来自插件结果
- **WHEN** CLI installs a local plugin manifest
- **THEN** the CLI renders `PluginInstallResult.diff` and `PluginInstallResult.lockEntry` rather than recomputing permission changes from terminal state
- **中文** 当 CLI 安装本地 plugin manifest 时，CLI 必须渲染 `PluginInstallResult.diff` 与 `PluginInstallResult.lockEntry`，而不是从 terminal state 重新计算权限变化。

#### Scenario: Snapshot output is deterministic / Snapshot 输出确定
- **WHEN** CLI snapshots plugin lockfile state
- **THEN** entries are sorted by plugin id and safe to hash or replay
- **中文** 当 CLI snapshot plugin lockfile state 时，entries 必须按 plugin id 排序，并且可安全 hash 或 replay。

### Requirement: Plugin Permission Pit Evidence / 插件权限坑位证据

Plugin install, update, and apply-lockfile results SHALL identify permission expansion evidence with `pit.extension-permission-expansion.permission-diff` whenever permissions change from a baseline.

Plugin install、update 和 apply-lockfile results 只要相对 baseline 发生权限变化，就必须用 `pit.extension-permission-expansion.permission-diff` 标识 permission expansion evidence。

#### Scenario: Permission expansion pit is cited / 权限扩张坑位被引用
- **WHEN** a plugin manifest adds permissions compared with the previous lock entry
- **THEN** the lifecycle evidence includes exact added permissions and `pit.extension-permission-expansion.permission-diff`
- **中文** 当 plugin manifest 相比旧 lock entry 增加权限时，lifecycle evidence 必须包含精确 added permissions 和 `pit.extension-permission-expansion.permission-diff`。

#### Scenario: Removed permissions are explicit / 移除权限显式化
- **WHEN** a plugin manifest removes permissions compared with the previous lock entry
- **THEN** the lifecycle evidence includes exact removed permissions and keeps the audit trail addressable
- **中文** 当 plugin manifest 相比旧 lock entry 移除权限时，lifecycle evidence 必须包含精确 removed permissions，并保持 audit trail 可寻址。
