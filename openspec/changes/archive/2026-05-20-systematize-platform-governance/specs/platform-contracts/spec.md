## ADDED Requirements

### Requirement: Platform Contracts As UAPI / Platform Contracts 作为 UAPI

`@deepseek/platform-contracts` SHALL be governed as the stable user-facing API between packages, hosts, runtime services, replay, tests, and future SDK/server surfaces.

`@deepseek/platform-contracts` 必须作为 packages、hosts、runtime services、replay、tests 与未来 SDK/server surfaces 之间的稳定 user-facing API 来治理。

#### Scenario: Cross-package contract change is classified / 跨包契约变更被分类

- **WHEN** a change modifies exported DTOs, ids, envelopes, event kinds, errors, manifests, or service interfaces
- **THEN** it classifies the change as additive, persisted-schema additive, breaking, or migration-required and records compatibility evidence
- **中文** 当变更修改导出的 DTO、id、envelope、event kind、error、manifest 或 service interface 时，必须将其分类为 additive、persisted-schema additive、breaking 或 migration-required，并记录兼容性证据。

#### Scenario: Contracts stay implementation-free / 契约保持无实现

- **WHEN** boundary checks inspect `platform-contracts`
- **THEN** imports from Node filesystem/process APIs, VSCode APIs, provider SDKs, app packages, testing fakes, or implementation packages are rejected
- **中文** 当 boundary checks 检查 `platform-contracts` 时，来自 Node filesystem/process APIs、VSCode APIs、provider SDKs、app packages、testing fakes 或 implementation packages 的导入必须被拒绝。

### Requirement: Contract Migration Evidence / 契约迁移证据

Breaking or persisted schema changes SHALL include deterministic migration, rollback, or fail-closed rejection evidence.

Breaking 或 persisted schema 变更必须包含确定性的迁移、回滚或 fail-closed rejection 证据。

#### Scenario: Persisted event schema changes / 持久化事件 Schema 变化

- **WHEN** a persisted runtime event, protocol envelope, session record, or replay record changes shape
- **THEN** versioning tests cover old-shape rejection or migration and new-shape replay
- **中文** 当 persisted runtime event、protocol envelope、session record 或 replay record 改变形态时，versioning tests 必须覆盖旧形态拒绝或迁移，以及新形态 replay。
