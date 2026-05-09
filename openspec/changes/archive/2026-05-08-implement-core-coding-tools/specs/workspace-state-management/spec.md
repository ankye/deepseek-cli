## ADDED Requirements

### Requirement: Core Tool Workspace Edit Transactions / 核心工具 Workspace Edit 事务

Workspace mutations from core coding tools SHALL be represented as workspace edit transactions with target paths, preconditions, pre-edit snapshots, applied changes, rollback metadata, and post-edit evidence.

来自 core coding tools 的 workspace mutations 必须表示为 workspace edit transactions，包含 target paths、preconditions、pre-edit snapshots、applied changes、rollback metadata 和 post-edit evidence。

#### Scenario: Write tool records transaction / 写入工具记录事务

- **WHEN** a write or edit tool mutates a workspace file
- **THEN** workspace state records affected path, previous snapshot metadata, new content metadata, policy decision reference, and rollback metadata
- **中文** 当 write 或 edit tool 修改 workspace file 时，workspace state 必须记录 affected path、previous snapshot metadata、new content metadata、policy decision reference 和 rollback metadata。

#### Scenario: Failed mutation leaves state unchanged / 失败修改不改变状态

- **WHEN** a write or edit precondition fails
- **THEN** no workspace mutation is persisted and the transaction records structured failure evidence
- **中文** 当 write 或 edit precondition 失败时，不得持久化任何 workspace mutation，transaction 必须记录 structured failure evidence。
