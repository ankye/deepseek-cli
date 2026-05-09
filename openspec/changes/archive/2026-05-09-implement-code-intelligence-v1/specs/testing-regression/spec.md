## ADDED Requirements

### Requirement: Code Intelligence Regression Coverage / 代码智能回归覆盖

The regression framework SHALL cover code intelligence local analyzer behavior with unit, contract, integration, golden, and matrix tests that do not require a live IDE, LSP server, or external network.

regression framework 必须用 unit、contract、integration、golden 和 matrix tests 覆盖 code intelligence local analyzer 行为，且不要求 live IDE、LSP server 或外部网络。

#### Scenario: Golden replay includes code evidence / golden replay 包含代码证据

- **WHEN** a golden trace includes diagnostic or symbol context nodes
- **THEN** replay asserts stable schema, redaction, provider metadata, and no raw secret-like content
- **中文** 当 golden trace 包含 diagnostic 或 symbol context nodes 时，replay 必须断言稳定 schema、redaction、provider metadata，以及没有 raw secret-like content。
