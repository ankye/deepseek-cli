## ADDED Requirements

### Requirement: Context Memory Compact Main Path Regression / 上下文记忆压缩主路径回归

The regression suite SHALL cover memory projection, compact boundary replay, tool-result evidence redaction, and code-intelligence references/definitions fallback for CLI-first runtime turns.

Regression suite 必须覆盖 CLI-first runtime turns 的 memory projection、compact boundary replay、tool-result evidence redaction 与 code-intelligence references/definitions fallback。

#### Scenario: Memory and compact evidence replay / 记忆与压缩证据 replay

- **WHEN** a deterministic runtime turn includes memory candidates and compact pressure
- **THEN** regression tests assert ordered memory projection evidence, compact boundary fingerprints, redaction metadata, and stable replay records
- **中文** 当 deterministic runtime turn 包含 memory candidates 与 compact pressure 时，regression tests 必须断言有序 memory projection evidence、compact boundary fingerprints、redaction metadata 与 stable replay records。

#### Scenario: Tool and code evidence remain redacted / 工具与代码证据保持脱敏

- **WHEN** a deterministic runtime turn records tool-result evidence and code-intelligence references/definitions
- **THEN** tests assert bounded summaries, no raw secret-like stdout/stderr, structured fallback diagnostics, and deterministic fingerprints
- **中文** 当 deterministic runtime turn 记录 tool-result evidence 与 code-intelligence references/definitions 时，tests 必须断言 bounded summaries、无 raw secret-like stdout/stderr、structured fallback diagnostics 与 deterministic fingerprints。
