## ADDED Requirements

### Requirement: Provider Diagnostics Are Explicit / Provider 诊断显式

Index provider boundary SHALL expose a bounded diagnostics summary that lists configured PageIndex, ZVec, and code-index providers with status, scope, ranking modes, diagnostics, and redaction metadata.

Index provider boundary 必须暴露有界 diagnostics summary，列出已配置的 PageIndex、ZVec 与 code-index providers，并包含 status、scope、ranking modes、diagnostics 与 redaction metadata。

#### Scenario: PageIndex-only diagnostics are serializable / PageIndex-only 诊断可序列化
- **WHEN** no semantic or vector provider implementation is configured
- **THEN** the diagnostics summary reports PageIndex deterministic text recall as `enabled`, ZVec and code-index as `deferred`, and serializes without functions, SDK instances, host handles, or raw secrets
- **中文** 当没有配置 semantic 或 vector provider implementation 时，diagnostics summary 必须报告 PageIndex deterministic text recall 为 `enabled`，ZVec 与 code-index 为 `deferred`，并且序列化时不包含 functions、SDK instances、host handles 或 raw secrets。

#### Scenario: Deferred providers do not add unsupported capability / Deferred Provider 不增加未支持能力
- **WHEN** diagnostics reports a provider with status `deferred`, `disabled`, or `unavailable`
- **THEN** the summary includes a typed diagnostic and suggested action without claiming semantic confidence, vector ranking, embedding availability, or code semantic search support
- **中文** 当 diagnostics 报告某个 provider 的状态为 `deferred`、`disabled` 或 `unavailable` 时，summary 必须包含 typed diagnostic 与 suggested action，不得声称 semantic confidence、vector ranking、embedding availability 或 code semantic search support。
