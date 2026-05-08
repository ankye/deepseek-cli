# context-engine Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Context Graph Nodes

The system SHALL represent runtime context as context nodes with id, type, source, priority, lifecycle, visibility, token estimate, redaction policy, and dependency metadata.

#### Scenario: Add user message context node

- **WHEN** the runtime receives a user input
- **THEN** the context engine stores it as a context node with user-message metadata

### Requirement: Context Projection

The context engine SHALL project context nodes into a model request context according to purpose, model, and budget constraints.

context engine 必须根据 purpose、model 和 budget constraints 将 context nodes 投影为 model request context。

#### Scenario: Project context for model request

- **WHEN** the runtime prepares a model request
- **THEN** the context engine returns an ordered projection of context nodes for that request

### Requirement: Context Lifecycle

The context engine SHALL distinguish turn, session, project, and global lifecycle scopes for context nodes.

context engine 必须区分 context nodes 的 turn、session、project 和 global lifecycle scopes。

#### Scenario: Preserve session context

- **WHEN** a new turn begins in the same session
- **THEN** session-lifecycle context remains eligible for projection

### Requirement: Future Compaction Boundary

The context engine SHALL expose extension points for compaction, retrieval, and rehydration without requiring runtime loop changes.

context engine 必须暴露 compaction、retrieval 和 rehydration 扩展点，且不要求修改 runtime loop。

#### Scenario: Add compaction strategy later

- **WHEN** a compaction strategy is registered in a future change
- **THEN** it can operate through the context engine projection boundary

### Requirement: Memory Reference Nodes

The context engine SHALL represent selected memory entries as context nodes or memory references with provenance and redaction metadata.

context engine 必须将被选中的 memory entries 表示为带 provenance 和 redaction metadata 的 context nodes 或 memory references。

#### Scenario: Project memory reference

- **WHEN** memory manager returns eligible memory for a turn
- **THEN** context projection can include memory reference nodes without copying unmanaged memory state into prompt assembly

