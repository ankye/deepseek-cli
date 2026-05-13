## ADDED Requirements

### Requirement: Turn Evidence Cache Records / 回合证据缓存记录

The memory/cache system SHALL define bounded, redacted turn evidence records for tool results, compact boundaries, and memory projection fingerprints.

Memory/cache system 必须为 tool results、compact boundaries 与 memory projection fingerprints 定义有界、脱敏的 turn evidence records。

#### Scenario: Tool evidence cache entry is bounded / 工具证据缓存条目有界

- **WHEN** runtime stores tool-result evidence for replay or future context projection
- **THEN** the cache entry includes namespace, stable key, source capability id, status, bounded summary, replay hash, dependency fingerprints, redaction metadata, and compatibility metadata
- **中文** 当 runtime 为 replay 或后续 context projection 存储 tool-result evidence 时，cache entry 必须包含 namespace、stable key、source capability id、status、bounded summary、replay hash、dependency fingerprints、redaction metadata 与 compatibility metadata。

#### Scenario: Compact boundary has deterministic fingerprint / 压缩边界有确定性指纹

- **WHEN** runtime records a compact boundary
- **THEN** the boundary metadata includes a deterministic fingerprint derived from projection fingerprint, session id, turn id, selected/excluded counts, and budget pressure
- **中文** 当 runtime 记录 compact boundary 时，boundary metadata 必须包含由 projection fingerprint、session id、turn id、selected/excluded counts 与 budget pressure 派生的 deterministic fingerprint。

### Requirement: Memory Candidate Fingerprints / 记忆候选指纹

Memory candidate factories SHALL produce deterministic fingerprints from memory id, scope, lifecycle, owner, redaction class, compatibility metadata, and content hash without exposing raw memory content.

Memory candidate factories 必须根据 memory id、scope、lifecycle、owner、redaction class、compatibility metadata 与 content hash 产生 deterministic fingerprints，且不得暴露 raw memory content。

#### Scenario: Same memory candidate has same fingerprint / 相同记忆候选指纹一致

- **WHEN** the same memory entry is converted into a projection candidate twice without content or metadata changes
- **THEN** both conversions produce the same dependency fingerprint
- **中文** 当同一 memory entry 在 content 或 metadata 未变化时被两次转换为 projection candidate，两次转换必须产生相同 dependency fingerprint。

#### Scenario: Memory content change changes fingerprint / 记忆内容变化改变指纹

- **WHEN** a memory entry keeps the same id and scope but changes content
- **THEN** its candidate dependency fingerprint changes so projection cache cannot reuse stale memory context
- **中文** 当某条 memory entry 保持相同 id 与 scope 但 content 变化时，其 candidate dependency fingerprint 必须变化，使 projection cache 不能复用陈旧 memory context。
