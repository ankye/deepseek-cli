## ADDED Requirements

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
