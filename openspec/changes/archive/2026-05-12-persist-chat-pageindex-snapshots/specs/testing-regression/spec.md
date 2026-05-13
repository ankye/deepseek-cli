## ADDED Requirements

### Requirement: Chat PageIndex Snapshot Resume Regression Coverage / Chat PageIndex 快照恢复回归覆盖

Regression tests SHALL cover persisted PageIndex snapshot creation, explicit chat resume hydration, local recall after resume, explicit resume failure, and bounded snapshot serialization.

回归测试必须覆盖 PageIndex snapshot 创建、显式 chat resume hydrate、resume 后本地 recall、显式 resume failure，以及有界 snapshot serialization。

#### Scenario: Snapshot persistence is tested / 快照持久化被测试
- **WHEN** CLI host tests run a chat prompt with deterministic session dependencies
- **THEN** tests assert the session store receives a `chat.pageindex.snapshot` payload with bounded pages and no raw over-limit suffix
- **中文** 当 CLI host tests 使用确定性 session dependencies 运行 chat prompt 时，测试必须断言 session store 收到 `chat.pageindex.snapshot` payload，包含有界 pages 且不包含超限原文后缀。

#### Scenario: Resume recall is tested / 恢复回溯被测试
- **WHEN** CLI host tests start a second scripted chat with `--session <session-id>` against the same deterministic store and run `/palette recall <query>`
- **THEN** tests assert recall returns prior PageIndex `turn` targets, no model request is emitted for the resumed slash-only session, and structured output contains no ANSI controls
- **中文** 当 CLI host tests 使用同一个 deterministic store 以 `--session <session-id>` 启动第二个 scripted chat 并运行 `/palette recall <query>` 时，测试必须断言 recall 返回历史 PageIndex `turn` targets、该恢复后的 slash-only session 不发出 model request，并且 structured output 不包含 ANSI controls。

#### Scenario: Missing resume is tested / 缺失恢复被测试
- **WHEN** CLI host tests run `deepseek chat --session <missing-session-id>`
- **THEN** tests assert a typed local resume failure and no model request
- **中文** 当 CLI host tests 运行 `deepseek chat --session <missing-session-id>` 时，测试必须断言 typed local resume failure 且无 model request。
