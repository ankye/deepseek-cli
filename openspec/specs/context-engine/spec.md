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

### Requirement: Concrete Projection Engine Contract / 具体 Projection Engine 契约

The context engine SHALL expose concrete ContextGraph projection contracts for candidate collection, eligibility filtering, ordering, budget fitting, and projection result creation.

context engine 必须为 candidate collection、eligibility filtering、ordering、budget fitting 和 projection result creation 暴露具体 ContextGraph projection contracts。

#### Scenario: Projection engine accepts typed request / Projection engine 接受类型化请求

- **WHEN** runtime asks for model context
- **THEN** the context engine accepts a typed projection request and returns a serializable projection result
- **中文** 当 runtime 请求 model context 时，context engine 必须接受 typed projection request 并返回 serializable projection result。

### Requirement: Context Node Metadata Completeness / Context Node 元数据完整

Context nodes SHALL include enough metadata for deterministic projection without inspecting host UI state or implementation objects.

context nodes 必须包含足够 metadata，以便在不检查 host UI state 或 implementation objects 的情况下进行 deterministic projection。

#### Scenario: Node metadata drives selection / 节点元数据驱动选择

- **WHEN** the projection engine evaluates a node
- **THEN** it uses node id, type, source, lifecycle, scope, priority, token estimate, content reference, redaction class, provenance, dependency fingerprints, and compatibility metadata
- **中文** 当 projection engine 评估节点时，必须使用 node id、type、source、lifecycle、scope、priority、token estimate、content reference、redaction class、provenance、dependency fingerprints 和 compatibility metadata。

### Requirement: Projection Output Does Not Expose Raw Internals / Projection 输出不暴露原始内部状态

The context engine SHALL return normalized projection slices and references instead of implementation-owned mutable state.

context engine 必须返回 normalized projection slices 与 references，而不是实现拥有的 mutable state。

#### Scenario: Result is immutable to callers / 结果对调用方不可变

- **WHEN** runtime or tests receive a projection result
- **THEN** they cannot mutate context engine internal node state through the returned object
- **中文** 当 runtime 或 tests 收到 projection result 时，不得通过返回对象修改 context engine 内部 node state。

### Requirement: Code Intelligence Node Consumption / 代码智能节点消费

Context projection SHALL accept code-intelligence context graph nodes and apply the same budget, ordering, redaction, cache, and exclusion rules as other context nodes.

context projection 必须接受 code-intelligence context graph nodes，并对其应用与其他 context nodes 相同的 budget、ordering、redaction、cache 和 exclusion rules。

#### Scenario: Diagnostic nodes project under budget / diagnostic node 在预算内投影

- **WHEN** candidate context includes code-intelligence diagnostic nodes within budget
- **THEN** projection may select them using normal priority and redaction rules
- **中文** 当 candidate context 包含预算内的 code-intelligence diagnostic nodes 时，projection 可以使用普通 priority 与 redaction rules 选择它们。
