## ADDED Requirements

### Requirement: Chat PageIndex Recall Scope Regression Coverage / Chat PageIndex 回溯 Scope 回归覆盖

Regression tests SHALL cover default session recall, explicit session recall, locally deferred broader scopes, invalid scope failures, and no slash-command model submission.

回归测试必须覆盖默认 session recall、显式 session recall、本地延后的更宽 scope、invalid scope failures，以及 slash-command 不提交 model。

#### Scenario: Explicit session scope is tested / 显式 Session Scope 被测试

- **WHEN** CLI host tests run prompts followed by `/palette recall --scope session <query>`
- **THEN** tests assert the recall summary, result-list metadata, target metadata, and item metadata all carry `scope=session`
- **中文** 当 CLI host tests 运行 prompts 后执行 `/palette recall --scope session <query>` 时，测试必须断言 recall summary、result-list metadata、target metadata 与 item metadata 都携带 `scope=session`。

#### Scenario: Broader scopes are deferred in tests / 更宽 Scope 延后被测试

- **WHEN** CLI host tests run `/palette recall --scope workspace <query>` or `/palette recall --scope global <query>`
- **THEN** tests assert a typed deferred local record, no session fallback result items, and no model request
- **中文** 当 CLI host tests 运行 `/palette recall --scope workspace <query>` 或 `/palette recall --scope global <query>` 时，测试必须断言 typed deferred local record、没有 session fallback result items，且没有 model request。

#### Scenario: Invalid scope is tested / 无效 Scope 被测试

- **WHEN** CLI host tests run `/palette recall --scope <invalid> <query>` or omit the scope value
- **THEN** tests assert a typed local failure and no unstructured host exception or model request
- **中文** 当 CLI host tests 运行 `/palette recall --scope <invalid> <query>` 或省略 scope value 时，测试必须断言 typed local failure，且没有非结构化 host exception 或 model request。
