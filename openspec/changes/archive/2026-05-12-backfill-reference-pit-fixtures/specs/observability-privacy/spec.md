## ADDED Requirements

### Requirement: Diagnostic Redaction Pit Fixtures / 诊断脱敏坑位 Fixtures

Observability and diagnostic bundle behavior SHALL include deterministic fixtures for env, proxy, auth header, MCP credential, plugin metadata, file path, and trace payload redaction.

observability 与 diagnostic bundle behavior 必须包含针对 env、proxy、auth header、MCP credential、plugin metadata、file path 和 trace payload redaction 的确定性 fixtures。

#### Scenario: Support bundle does not leak secrets / 支持包不泄漏 Secrets

- **WHEN** diagnostic records contain API keys, bearer tokens, env-style credentials, credential-like fields, plugin metadata, or MCP credential material
- **THEN** local diagnostic bundles and external export denial evidence contain only redacted values and redaction summaries
- **中文** 当 diagnostic records 包含 API keys、bearer tokens、env-style credentials、credential-like fields、plugin metadata 或 MCP credential material 时，local diagnostic bundles 与 external export denial evidence 只能包含脱敏值和 redaction summaries。

#### Scenario: Redaction evidence is reviewable / 脱敏证据可审查

- **WHEN** redaction occurs in an observability record or bundle
- **THEN** the output includes redacted field paths, secret-like field paths, value counts, and highest privacy class without exposing raw secret material
- **中文** 当 observability record 或 bundle 发生脱敏时，输出必须包含 redacted field paths、secret-like field paths、value counts 和 highest privacy class，且不暴露 raw secret material。
