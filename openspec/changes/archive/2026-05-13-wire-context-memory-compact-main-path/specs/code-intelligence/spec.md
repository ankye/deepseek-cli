## ADDED Requirements

### Requirement: References And Definitions Context Evidence / 引用与定义上下文证据

Code intelligence SHALL expose references and definitions as bounded context evidence suitable for runtime projection, cache invalidation, and replay.

Code intelligence 必须将 references 与 definitions 暴露为有界 context evidence，适用于 runtime projection、cache invalidation 与 replay。

#### Scenario: Reference evidence carries provenance / 引用证据携带来源

- **WHEN** code intelligence returns references or definitions for a symbol relevant to a turn
- **THEN** each evidence item includes symbol name, relation kind, path metadata, line metadata, provider metadata, dependency fingerprints, and redaction metadata
- **中文** 当 code intelligence 为当前回合相关 symbol 返回 references 或 definitions 时，每个 evidence item 必须包含 symbol name、relation kind、path metadata、line metadata、provider metadata、dependency fingerprints 与 redaction metadata。

#### Scenario: Analyzer miss is degraded evidence / Analyzer 未命中作为降级证据

- **WHEN** the analyzer cannot resolve references or definitions for a requested symbol
- **THEN** code intelligence returns structured degraded evidence instead of throwing through the runtime projection path
- **中文** 当 analyzer 无法解析请求 symbol 的 references 或 definitions 时，code intelligence 必须返回结构化 degraded evidence，而不是沿 runtime projection path 抛出异常。
