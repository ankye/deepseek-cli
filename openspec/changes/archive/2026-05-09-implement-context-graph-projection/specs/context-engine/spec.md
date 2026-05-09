## ADDED Requirements

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
