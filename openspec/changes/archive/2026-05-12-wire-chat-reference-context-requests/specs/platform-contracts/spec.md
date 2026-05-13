## ADDED Requirements

### Requirement: Agent Loop Reference Context Contract / Agent Loop 引用上下文契约

Platform contracts SHALL define a host-agnostic agent loop reference context DTO for carrying selected CLI reference sets as structured metadata.

Platform contracts 必须定义 host-agnostic agent loop reference context DTO，用于以结构化 metadata 携带选中的 CLI reference sets。

#### Scenario: Reference context is serializable / 引用上下文可序列化

- **WHEN** a host submits an agent loop request with selected references
- **THEN** the request carries serializable reference set ids, item ids, target ids/kinds, labels, provenance, ordering, active item ids, counts, and redaction metadata
- **中文** 当 host 使用 selected references 提交 agent loop request 时，该 request 必须携带可序列化的 reference set ids、item ids、target ids/kinds、labels、provenance、ordering、active item ids、counts 和 redaction metadata。

#### Scenario: Reference context omits raw content / 引用上下文不包含原始内容

- **WHEN** reference context describes file, directory, symbol, diagnostic, diff, message, turn, or tool-evidence targets
- **THEN** it MUST NOT include raw file contents, raw diff hunks, raw message bodies, credentials, or unredacted secret values
- **中文** 当 reference context 描述 file、directory、symbol、diagnostic、diff、message、turn 或 tool-evidence targets 时，它不得包含 raw file contents、raw diff hunks、raw message bodies、credentials 或未脱敏 secret values。
