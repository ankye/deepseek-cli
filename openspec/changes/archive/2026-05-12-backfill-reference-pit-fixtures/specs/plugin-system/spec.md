## ADDED Requirements

### Requirement: Plugin Permission Expansion Pit Fixtures / 插件权限扩张坑位 Fixtures

Plugin install and lockfile behavior SHALL include deterministic fixtures that make permission expansion, integrity mismatch, and rollback metadata visible.

plugin install 与 lockfile 行为必须包含确定性 fixtures，使 permission expansion、integrity mismatch 和 rollback metadata 可见。

#### Scenario: Permission expansion is explicit / 权限扩张显式化

- **WHEN** a plugin install or reinstall adds permissions compared with the existing lock entry
- **THEN** the install result reports the precise added and removed permissions before callers treat the plugin as accepted
- **中文** 当 plugin install 或 reinstall 相比现有 lock entry 增加权限时，install result 必须在调用方将 plugin 视为已接受前报告精确的 added 和 removed permissions。

#### Scenario: Integrity mismatch is fail-closed / 完整性不匹配 Fail Closed

- **WHEN** a plugin manifest or lockfile entry conflicts with a previously locked integrity value
- **THEN** plugin management rejects the change without mutating the existing trusted lock entry
- **中文** 当 plugin manifest 或 lockfile entry 与先前锁定的 integrity value 冲突时，plugin management 必须拒绝该变更，且不修改现有 trusted lock entry。
