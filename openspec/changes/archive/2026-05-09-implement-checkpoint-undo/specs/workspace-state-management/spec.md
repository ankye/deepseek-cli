## ADDED Requirements

### Requirement: Checkpoint And Undo Lifecycle / Checkpoint 与 Undo 生命周期

Workspace state management SHALL own checkpoint creation, checkpoint restore, and latest-eligible undo for applied workspace edit transactions.

workspace state management 必须为已应用的 workspace edit transactions 拥有 checkpoint creation、checkpoint restore 与 latest-eligible undo 生命周期。

#### Scenario: Transaction returns checkpoint reference / transaction 返回 checkpoint reference

- **WHEN** workspace state records an applied edit transaction with rollback content
- **THEN** it returns a checkpoint reference that can be used by tools, runtime events, and session evidence
- **中文** 当 workspace state 记录包含 rollback content 的已应用 edit transaction 时，必须返回可供 tools、runtime events 和 session evidence 使用的 checkpoint reference。

#### Scenario: Undo uses platform write boundary / undo 使用平台写入边界

- **WHEN** workspace state restores or undoes a checkpoint
- **THEN** it writes through the injected platform filesystem boundary and records restore diagnostics
- **中文** 当 workspace state restore 或 undo checkpoint 时，必须通过注入的平台 filesystem boundary 写入，并记录 restore diagnostics。
