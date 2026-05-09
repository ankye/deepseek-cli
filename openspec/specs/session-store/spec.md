# session-store Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Event-Sourced Session Log

The session store SHALL persist session activity as ordered events rather than terminal UI state.

session store 必须将 session activity 持久化为有序事件，而不是 terminal UI state。

#### Scenario: Persist runtime event

- **WHEN** the runtime emits a persistable session event
- **THEN** the session store records it with session id, event id, timestamp, and event payload

### Requirement: Resume Session

The session store SHALL provide a resume operation that reconstructs session state from stored events and snapshots.

#### Scenario: Resume existing session

- **WHEN** a caller resumes a known session id
- **THEN** the session store returns reconstructed session state for runtime use

### Requirement: Fork Session

The session store SHALL provide a fork operation that creates a new session derived from an existing session history.

#### Scenario: Fork from existing session

- **WHEN** a caller forks an existing session
- **THEN** the session store creates a new session id linked to the parent session

### Requirement: Checkpoint Contract

The session store SHALL support checkpoint metadata so future implementations can restore or compare known-good session states.

session store 必须支持 checkpoint metadata，使未来实现可以恢复或比较 known-good session states。

#### Scenario: Create checkpoint

- **WHEN** the runtime marks a checkpoint
- **THEN** the session store records checkpoint metadata associated with the current session position

### Requirement: Redaction and Encryption Extension Points

The session store SHALL define redaction and encryption boundaries for persisted events, even if the initial adapter uses development storage.

session store 必须为 persisted events 定义 redaction 和 encryption boundaries，即使初始 adapter 使用 development storage。

#### Scenario: Persist through redaction boundary

- **WHEN** a session event contains model, tool, or user content
- **THEN** the store passes the event through the configured redaction boundary before persistence

### Requirement: Replayable Session Events

The session store SHALL persist enough protocol, runtime, workflow, task, agent, memory reference, and audit metadata to support deterministic replay through the regression harness.

session store 必须持久化足够的 protocol、runtime、workflow、task、agent、memory reference 和 audit metadata，以支持 regression harness 的确定性 replay。

#### Scenario: Replay session through regression harness

- **WHEN** a stored session is replayed
- **THEN** the regression harness can reconstruct normalized event order and compare it with golden expectations

### Requirement: Concrete Session Metadata / 具体 Session 元数据

The session store SHALL define concrete persisted session metadata with schema version, session id, parent session id, fork point, creation metadata, and redaction metadata.

session store 必须定义具体的 persisted session metadata，包括 schema version、session id、parent session id、fork point、creation metadata 和 redaction metadata。

#### Scenario: Session creation records metadata / Session 创建记录元数据

- **WHEN** a session is created
- **THEN** the store records schema version, session id, creation metadata, lineage metadata, and redaction metadata
- **中文** 当 session 被创建时，store 必须记录 schema version、session id、creation metadata、lineage metadata 和 redaction metadata。

#### Scenario: Session metadata is serializable / Session 元数据可序列化

- **WHEN** session metadata is returned through contracts or persisted by the development store
- **THEN** it is JSON-serializable and contains no raw secret values
- **中文** 当 session metadata 通过 contracts 返回或由 development store 持久化时，它必须 JSON-serializable 且不包含 raw secret values。

### Requirement: Resume Result Semantics / Resume 结果语义

The session store SHALL provide a resume operation that returns reconstructed session metadata from stored events and snapshots.

session store 必须提供 resume operation，从 stored events 与 snapshots 返回 reconstructed session metadata。

#### Scenario: Resume existing event log / 恢复已有事件日志

- **WHEN** the store resumes a session with stored events
- **THEN** it returns session id, event count, latest sequence, lineage, metadata, snapshot reference when present, and a redacted preview
- **中文** 当 store 恢复包含 stored events 的 session 时，必须返回 session id、event count、latest sequence、lineage、metadata、存在时的 snapshot reference，以及 redacted preview。

#### Scenario: Resume unknown session fails / 恢复未知 session 失败

- **WHEN** the store resumes an unknown session id
- **THEN** it returns a typed not-found failure and does not fabricate empty session state
- **中文** 当 store 恢复未知 session id 时，必须返回 typed not-found failure，且不得伪造 empty session state。

### Requirement: Fork Result Semantics / Fork 结果语义

The session store SHALL provide a fork operation that creates a child session linked to a parent session and fork point.

session store 必须提供 fork operation，创建关联 parent session 与 fork point 的 child session。

#### Scenario: Fork existing session / 分叉已有 session

- **WHEN** the store forks an existing parent session
- **THEN** it creates a new session id, records parent id, fork point sequence, inherited event count, reason metadata, and a fork event
- **中文** 当 store 分叉已有 parent session 时，必须创建新 session id，并记录 parent id、fork point sequence、inherited event count、reason metadata 和 fork event。

#### Scenario: Fork unknown session fails / 分叉未知 session 失败

- **WHEN** the store forks an unknown parent session
- **THEN** it returns a typed not-found failure and does not create a child session
- **中文** 当 store 分叉未知 parent session 时，必须返回 typed not-found failure，且不得创建 child session。

### Requirement: Store Implementation Parity / Store 实现一致性

In-memory and development filesystem session stores SHALL implement compatible resume and fork-lite semantics.

in-memory 与 development filesystem session stores 必须实现兼容的 resume 与 fork-lite 语义。

#### Scenario: Contract tests run against both stores / 合同测试覆盖两种 store

- **WHEN** session-store contract tests run
- **THEN** in-memory and development filesystem stores both pass creation, append, resume, fork, unknown id, redaction, and serialization scenarios
- **中文** 当 session-store contract tests 运行时，in-memory 与 development filesystem stores 必须同时通过 creation、append、resume、fork、unknown id、redaction 和 serialization scenarios。
