## ADDED Requirements

### Requirement: Platform Contracts As UAPI / Platform Contracts 作为 UAPI

`platform-contracts` SHALL be governed as a stable UAPI for cross-package DTOs, ids, envelopes, events, errors, manifests, and service interfaces.

`platform-contracts` 必须作为稳定 UAPI 治理，覆盖跨 package DTO、id、envelope、event、error、manifest 与 service interface。

#### Scenario: Contract change is classified / Contract 变更被分类

- **WHEN** an exported contract changes
- **THEN** governance classifies the change as additive, breaking, persisted, replay-affecting, host-facing, plugin-facing, or internal-only
- **中文** 当导出 contract 发生变化时，治理必须将该变更分类为 additive、breaking、persisted、replay-affecting、host-facing、plugin-facing 或 internal-only。

### Requirement: Breaking UAPI Migration / Breaking UAPI 迁移

Breaking or persisted UAPI changes SHALL include migration evidence or fail-closed version rejection.

Breaking 或 persisted UAPI 变更必须包含迁移证据，或具备 fail-closed version rejection。

#### Scenario: Persisted event field changes / Persisted Event 字段变化

- **WHEN** a persisted event, envelope, id, or error field is renamed, removed, retyped, or changes redaction semantics
- **THEN** the change includes version handling, migration tests, and replay evidence before release
- **中文** 当 persisted event、envelope、id 或 error 字段被重命名、删除、重定类型或改变 redaction semantics 时，发布前必须包含 version handling、migration tests 与 replay evidence。

### Requirement: Implementation-Free Contracts / 无实现 Contracts

`platform-contracts` SHALL NOT import host APIs, Node process/filesystem APIs, model SDKs, testing fakes, or implementation packages.

`platform-contracts` 不得导入 host APIs、Node process/filesystem APIs、model SDKs、testing fakes 或 implementation packages。

#### Scenario: Implementation import is rejected / 实现导入被拒绝

- **WHEN** a contract file imports implementation code or host-specific APIs
- **THEN** lint reports a UAPI boundary violation with file, import target, severity, and suggested owner package
- **中文** 当 contract 文件导入实现代码或 host-specific APIs 时，lint 必须报告包含文件、导入目标、严重度与建议责任包的 UAPI 边界违规。
