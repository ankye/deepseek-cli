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

