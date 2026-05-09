# workspace-state-management Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Workspace State Boundary

The platform SHALL define workspace state management for workspace identity, trusted roots, additional roots, repository metadata, file snapshots, diff state, edit transactions, generated artifacts, and attachment references.

平台必须定义 workspace state management，覆盖 workspace identity、trusted roots、additional roots、repository metadata、file snapshots、diff state、edit transactions、generated artifacts 和 attachment references。

#### Scenario: Workspace roots are explicit

- **WHEN** runtime starts or a host submits workspace context
- **THEN** workspace roots, additional roots, trust state, repository metadata, and host identity are represented as structured workspace state

#### Scenario: File snapshot is versioned

- **WHEN** a capability, host adapter, or workflow captures a file snapshot
- **THEN** the snapshot includes URI/path identity, content version metadata, provenance, redaction class, and invalidation metadata

### Requirement: Edit Transaction Model

Workspace edits SHALL be represented as explicit edit transactions with proposed changes, affected paths, preconditions, approval state, application result, rollback metadata, and post-edit evidence.

workspace edits 必须表示为显式 edit transactions，包含 proposed changes、affected paths、preconditions、approval state、application result、rollback metadata 和 post-edit evidence。

#### Scenario: Edit requires precondition check

- **WHEN** an edit transaction is applied
- **THEN** the workspace state manager verifies file versions, path permissions, policy decisions, locks, and host capabilities before mutation

#### Scenario: Failed edit preserves rollback metadata

- **WHEN** an edit transaction fails or is rejected
- **THEN** the transaction records structured failure details and preserves enough metadata for audit and safe retry decisions

### Requirement: Worktree and Overlay Direction

The workspace state manager SHALL define contracts for future isolated worktrees, overlay filesystems, branch/fork workspaces, and merge/conflict evidence without requiring them in the first implementation.

workspace state manager 必须为未来 isolated worktrees、overlay filesystems、branch/fork workspaces 和 merge/conflict evidence 定义 contracts，但第一版不要求完整实现。

#### Scenario: Agent task declares write scope

- **WHEN** an agent or workflow step is assigned a workspace task
- **THEN** it can declare read roots, write roots, excluded paths, isolation mode, and merge policy metadata

#### Scenario: Overlay result becomes patch artifact

- **WHEN** a future overlay or worktree task completes
- **THEN** its output can be represented as patch artifacts, conflict metadata, test evidence, and merge recommendations

### Requirement: Host Edit Application Coordination

Workspace state management SHALL coordinate with CLI filesystem adapters, VSCode workspace edits, platform abstraction, policy/sandbox, session store, code intelligence, and regression traces.

workspace state management 必须协调 CLI filesystem adapters、VSCode workspace edits、platform abstraction、policy/sandbox、session store、code intelligence 和 regression traces。

#### Scenario: VSCode applies approved edit

- **WHEN** VSCode applies an approved workspace edit through host APIs
- **THEN** the workspace state manager receives structured application results and records them in session, audit, and regression boundaries

#### Scenario: Regression replays edit transaction

- **WHEN** a golden trace replays a workspace edit transaction
- **THEN** deterministic file snapshots and fake platform adapters reproduce the expected edit events without mutating real files

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
