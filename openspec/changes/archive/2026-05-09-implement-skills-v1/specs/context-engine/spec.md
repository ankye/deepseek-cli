## MODIFIED Requirements

### Requirement: Skill Context Projection / Skill 上下文投影

The context engine SHALL accept governed skill context segments as regular context evidence with source, provenance, compatibility, budget, and redaction metadata.

context engine 必须接受受治理的 skill context segments，把它们作为普通 context evidence，并带有 source、provenance、compatibility、budget 和 redaction metadata。

#### Scenario: Trusted skill segment enters projection / trusted skill segment 进入投影

- **WHEN** a trusted context-only skill produces bounded instruction or example segments for a session
- **THEN** the context engine can project those segments alongside file, memory, diagnostic, and tool evidence without a separate prompt injection path
- **中文** 当 trusted context-only skill 为某个 session 产生有界 instruction 或 example segments 时，context engine 可以将这些 segments 与 file、memory、diagnostic 和 tool evidence 一起投影，不新增独立 prompt injection path。

#### Scenario: Untrusted skill segment is excluded / untrusted skill segment 被排除

- **WHEN** an untrusted or disabled skill attempts to contribute context
- **THEN** the projection excludes the segment and records redacted exclusion metadata
- **中文** 当 untrusted 或 disabled skill 尝试贡献 context 时，projection 必须排除该 segment，并记录脱敏 exclusion metadata。
