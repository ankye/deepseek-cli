## ADDED Requirements

### Requirement: VFS-Like Context References / VFS 风格上下文引用

The context engine SHALL govern files, memory, PageIndex recall, code intelligence, tool evidence, skill context, and future semantic recall as typed context references or immutable evidence blocks with shared metadata.

Context engine 必须将 files、memory、PageIndex recall、code intelligence、tool evidence、skill context 与未来 semantic recall 治理为类型化 context references 或不可变 evidence blocks，并使用共享 metadata。

#### Scenario: Context source is abstracted / Context 来源被抽象

- **WHEN** prompt assembly or runtime consumes projected context
- **THEN** it sees normalized context references with id, source, scope, hash or dependency fingerprints, freshness, token estimate, redaction, provenance, and lifecycle metadata rather than source-specific host objects
- **中文** 当 prompt assembly 或 runtime 消费 projected context 时，必须看到带 id、source、scope、hash 或 dependency fingerprints、freshness、token estimate、redaction、provenance 与 lifecycle metadata 的 normalized context references，而不是 source-specific host objects。

#### Scenario: Same evidence is deduplicated by identity / 相同证据按身份去重

- **WHEN** the same file, memory entry, recall record, symbol reference, or tool evidence appears through multiple providers
- **THEN** context projection deduplicates or links it by stable evidence identity and records provenance for all contributing sources
- **中文** 当同一 file、memory entry、recall record、symbol reference 或 tool evidence 通过多个 providers 出现时，context projection 必须按稳定 evidence identity 去重或链接，并记录所有贡献来源的 provenance。

### Requirement: Context Page-Cache Governance / Context Page-Cache 治理

Context projection SHALL support cache-friendly immutable context evidence and prefix-stability diagnostics.

Context projection 必须支持缓存友好的不可变 context evidence 与 prefix-stability diagnostics。

#### Scenario: Context block mutation creates new identity / Context Block 变化产生新身份

- **WHEN** projected context content, dependency fingerprints, redaction class, freshness, or cache policy changes
- **THEN** the projected evidence identity changes instead of mutating a previous stable identity
- **中文** 当 projected context content、dependency fingerprints、redaction class、freshness 或 cache policy 变化时，projected evidence identity 必须变化，而不是修改之前的稳定 identity。
