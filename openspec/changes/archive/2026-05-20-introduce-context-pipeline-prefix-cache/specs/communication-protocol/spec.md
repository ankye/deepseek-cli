## ADDED Requirements

### Requirement: Pipeline Metadata In Protocol Envelopes / 协议信封中的管道 Metadata

The host/runtime protocol SHALL carry context pipeline fingerprints, per-layer prefix hashes, cache evidence summaries, and redaction metadata as additive envelope metadata.

Host/runtime protocol 必须将 context pipeline fingerprints、按层 prefix hashes、cache evidence summaries 与 redaction metadata 作为 additive envelope metadata 携带。

#### Scenario: Host observes cache stability without raw context / Host 不看原文也能观察缓存稳定性

- **WHEN** runtime projects a model request event to CLI, tests, or future hosts
- **THEN** the protocol envelope may include pipeline fingerprint and prefix hashes but does not include raw context block content unless explicitly permitted by redaction policy
- **中文** 当 runtime 将 model request event 投影给 CLI、tests 或未来 hosts 时，protocol envelope 可以包含 pipeline fingerprint 与 prefix hashes，但不得包含 raw context block content，除非 redaction policy 显式允许。

### Requirement: Pipeline Metadata Is Backward Compatible / 管道 Metadata 向后兼容

Pipeline protocol metadata SHALL be additive and optional for consumers that do not understand context pipeline fields.

Pipeline protocol metadata 必须是 additive，并且对不理解 context pipeline fields 的 consumer 可选。

#### Scenario: Older consumer ignores metadata / 旧 Consumer 忽略 Metadata

- **WHEN** a consumer reads a protocol envelope without pipeline support
- **THEN** it can ignore pipeline metadata while preserving existing event type, payload, and redaction semantics
- **中文** 当不支持 pipeline 的 consumer 读取 protocol envelope 时，必须能忽略 pipeline metadata，同时保留现有 event type、payload 与 redaction semantics。
