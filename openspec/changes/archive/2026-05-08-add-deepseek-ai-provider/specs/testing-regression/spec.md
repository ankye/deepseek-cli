## ADDED Requirements

### Requirement: Deterministic Provider Regression

The testing framework SHALL include deterministic DeepSeek provider fixtures and tests for request construction, text normalization, reasoning normalization, tool-call normalization, usage/cache normalization, provider errors, missing credentials, missing transport, and no default network access.

测试框架必须包含 deterministic DeepSeek provider fixtures 和 tests，覆盖 request construction、text normalization、reasoning normalization、tool-call normalization、usage/cache normalization、provider errors、missing credentials、missing transport 和 no default network access。

#### Scenario: Provider tests use fake transport

- **WHEN** default tests exercise the DeepSeek provider
- **THEN** they use injected fake transport fixtures and never require a live DeepSeek API key or network access

#### Scenario: Golden provider trace is stable

- **WHEN** a DeepSeek provider fixture is replayed
- **THEN** normalized model events match a stable golden trace except for declared nondeterministic provider ids when present

#### Scenario: Lint covers provider boundaries

- **WHEN** architecture lint runs
- **THEN** it includes negative tests for direct credential access and direct governed execution from provider code
