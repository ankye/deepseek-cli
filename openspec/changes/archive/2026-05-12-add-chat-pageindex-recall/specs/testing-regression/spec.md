## ADDED Requirements

### Requirement: Chat PageIndex Recall Regression Coverage / Chat PageIndex 回溯回归覆盖

Regression tests SHALL cover chat-local PageIndex recording, deterministic recall result lists, navigation, no slash-command model submission, and bounded output.

回归测试必须覆盖 chat-local PageIndex recording、deterministic recall result lists、navigation、slash-command 不提交 model，以及有界输出。

#### Scenario: PageIndex recall slash stays local in tests / PageIndex Recall Slash 在测试中保持本地

- **WHEN** CLI host tests run scripted chat input containing two normal prompts followed by `/palette recall <query>` and navigation commands
- **THEN** tests assert only the normal prompts emit model requests, recall emits local structured records, recall result items use `turn` targets, focus changes through palette navigation, and structured output contains no ANSI controls
- **中文** 当 CLI host tests 运行包含两条普通 prompts、随后 `/palette recall <query>` 与 navigation commands 的 scripted chat input 时，测试必须断言只有普通 prompts 发出 model requests，recall 输出本地结构化 records，recall result items 使用 `turn` targets，focus 通过 palette navigation 改变，且 structured output 不包含 ANSI controls。

#### Scenario: Recall missing query is tested / 缺失 Recall Query 被测试

- **WHEN** CLI host tests run `/palette recall` without a query
- **THEN** tests assert a typed local failure and no unstructured host exception or model request
- **中文** 当 CLI host tests 运行没有 query 的 `/palette recall` 时，测试必须断言 typed local failure，且没有非结构化 host exception 或 model request。

#### Scenario: Recall preview boundary is tested / Recall Preview 边界被测试

- **WHEN** a prompt or assistant response contains text longer than the PageIndex preview limit
- **THEN** tests assert recall records contain bounded previews and do not serialize the full raw turn content
- **中文** 当 prompt 或 assistant response 包含超过 PageIndex preview limit 的文本时，测试必须断言 recall records 包含有界 previews，且不会序列化完整 raw turn content。
