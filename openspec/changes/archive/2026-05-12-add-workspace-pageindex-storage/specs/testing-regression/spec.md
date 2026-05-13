## ADDED Requirements

### Requirement: Chat Workspace PageIndex Regression Coverage / Chat Workspace PageIndex 回归覆盖

Regression tests SHALL cover workspace PageIndex persistence, cross-session workspace recall, storage failure behavior, bounded serialization, and continued global-scope deferral.

回归测试必须覆盖 workspace PageIndex persistence、跨 session workspace recall、storage failure behavior、有界 serialization，以及 global-scope 继续 deferred。

#### Scenario: Workspace recall across sessions is tested / 跨 Session Workspace Recall 被测试

- **WHEN** CLI host tests run one chat session that records a PageIndex page and a later chat session in the same workspace runs `/palette recall --scope workspace <query>`
- **THEN** tests assert workspace recall returns `turn` result items with `scope=workspace`, no model request is emitted for the slash-only session, and structured output contains no ANSI controls
- **中文** 当 CLI host tests 先运行一个记录 PageIndex page 的 chat session，再在同一 workspace 的后续 chat session 运行 `/palette recall --scope workspace <query>` 时，测试必须断言 workspace recall 返回带 `scope=workspace` 的 `turn` result items、slash-only session 不发出 model request，并且 structured output 不包含 ANSI controls。

#### Scenario: Workspace persistence boundary is tested / Workspace 持久化边界被测试

- **WHEN** CLI host tests record prompt or assistant text longer than the PageIndex preview limit
- **THEN** tests assert the persisted workspace PageIndex payload and recall records do not contain the raw over-limit suffix
- **中文** 当 CLI host tests 记录超过 PageIndex preview limit 的 prompt 或 assistant text 时，测试必须断言持久化 workspace PageIndex payload 与 recall records 不包含超限原文后缀。

#### Scenario: Workspace storage failure is tested / Workspace Storage Failure 被测试

- **WHEN** CLI host tests use a platform whose workspace metadata path or atomic write fails and then request workspace recall
- **THEN** tests assert a typed local failure or deferred diagnostic, no session fallback result items, and no model request
- **中文** 当 CLI host tests 使用 workspace metadata path 或 atomic write 失败的平台并请求 workspace recall 时，测试必须断言 typed local failure 或 deferred diagnostic、没有 session fallback result items，且没有 model request。

#### Scenario: Global scope remains deferred in tests / Global Scope 继续 Deferred 被测试

- **WHEN** CLI host tests run `/palette recall --scope global <query>`
- **THEN** tests assert the existing typed deferred behavior remains and no workspace result items are returned
- **中文** 当 CLI host tests 运行 `/palette recall --scope global <query>` 时，测试必须断言现有 typed deferred 行为保持不变，且不返回 workspace result items。
