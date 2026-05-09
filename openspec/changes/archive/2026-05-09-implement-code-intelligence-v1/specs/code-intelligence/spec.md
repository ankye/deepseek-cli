## ADDED Requirements

### Requirement: Versioned Code Intelligence DTOs / 版本化代码智能 DTO

Code intelligence SHALL expose versioned DTOs for diagnostics, symbols, references, provider status, index metadata, context node conversion, and redaction metadata.

code intelligence 必须暴露版本化 DTO，覆盖 diagnostics、symbols、references、provider status、index metadata、context node conversion 和 redaction metadata。

#### Scenario: DTOs are serializable / DTO 可序列化

- **WHEN** diagnostics, symbols, references, or context node conversion results are emitted
- **THEN** they are JSON-serializable, schema-versioned, redaction-aware, and host-neutral
- **中文** 当 diagnostics、symbols、references 或 context node conversion results 被输出时，它们必须 JSON-serializable、schema-versioned、redaction-aware 且 host-neutral。

### Requirement: Code Intelligence Context Projection / 代码智能上下文投影

Code intelligence SHALL provide a method to create context graph nodes from analyzer evidence for a given session and workspace scope.

code intelligence 必须提供方法，为指定 session 与 workspace scope 从 analyzer evidence 创建 context graph nodes。

#### Scenario: Context nodes use shared projection path / context node 使用共享投影路径

- **WHEN** code intelligence evidence is attached to model context
- **THEN** it is represented as normal context graph nodes consumed by context-engine projection
- **中文** 当 code intelligence evidence 附加到 model context 时，必须表示为由 context-engine projection 消费的普通 context graph nodes。
