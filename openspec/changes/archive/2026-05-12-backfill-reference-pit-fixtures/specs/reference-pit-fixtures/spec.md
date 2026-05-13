## ADDED Requirements

### Requirement: Reference Pit Fixture Catalog / 参考坑位 Fixture Catalog

The repository SHALL maintain a DeepSeek-owned catalog of reference-derived pit fixtures that identifies each pit, owner packages, risk class, required assertions, fixture status, and evidence location.

仓库必须维护 DeepSeek 自有的 reference-derived pit fixture catalog，标识每个坑位、owner packages、风险等级、必需断言、fixture 状态和证据位置。

#### Scenario: Catalog lists required pit families / Catalog 列出必需坑位族

- **WHEN** the reference pit catalog is loaded
- **THEN** it includes entries for permission bypass, headless trust, shell parser fallback, path canonicalization, MCP/plugin precedence, extension permission expansion, legacy contribution normalization, remote identity separation, env snapshot, and diagnostic redaction
- **中文** 当 reference pit catalog 被加载时，它必须包含 permission bypass、headless trust、shell parser fallback、path canonicalization、MCP/plugin precedence、extension permission expansion、legacy contribution normalization、remote identity separation、env snapshot 和 diagnostic redaction 条目。

#### Scenario: Catalog entries are auditable / Catalog 条目可审计

- **WHEN** a catalog entry is reviewed
- **THEN** it declares stable id, risk class, owner packages, fixture status, required assertion, and evidence path without raw reference implementation details
- **中文** 当 catalog entry 被审查时，它必须声明 stable id、risk class、owner packages、fixture status、required assertion 和 evidence path，且不包含参考实现源码细节。

### Requirement: Pit Coverage Is Executable / 坑位覆盖可执行

Reference pit fixtures SHALL be backed by deterministic executable tests rather than only documentation.

reference pit fixtures 必须由确定性可执行测试支撑，不能只有文档。

#### Scenario: Covered pits have tests / 已覆盖坑位具备测试

- **WHEN** a catalog entry is marked `covered` or `partial`
- **THEN** at least one unit, contract, integration, matrix, golden, or e2e test asserts the required behavior and references the fixture id
- **中文** 当 catalog entry 标记为 `covered` 或 `partial` 时，至少一个 unit、contract、integration、matrix、golden 或 e2e test 必须断言对应行为并引用 fixture id。

#### Scenario: Planned pits remain visible / 计划中坑位保持可见

- **WHEN** a pit cannot be fully covered before a future owner system exists
- **THEN** the catalog marks it `planned` with owner packages and expected evidence so it cannot disappear from future OpenSpecs
- **中文** 当某个坑位在未来 owner system 存在前无法完整覆盖时，catalog 必须将其标记为 `planned`，并声明 owner packages 与预期 evidence，避免从后续 OpenSpec 中消失。
