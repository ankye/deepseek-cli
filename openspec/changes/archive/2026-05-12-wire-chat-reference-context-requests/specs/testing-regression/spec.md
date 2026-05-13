## ADDED Requirements

### Requirement: Chat Reference Context Regression Coverage / Chat 引用上下文回归覆盖

Regression tests SHALL cover active chat reference metadata propagation into agent loop requests and runtime/model metadata without raw content leakage.

回归测试必须覆盖 active chat reference metadata 向 agent loop requests 与 runtime/model metadata 的传播，并确保没有 raw content 泄漏。

#### Scenario: Reference context propagation is tested / 引用上下文传播被测试

- **WHEN** CLI host tests run scripted chat input that adds references and then submits a normal prompt
- **THEN** tests assert `agent.loop.started`, `turn.started`, and `model.requested` metadata include reference set/item ids, active item id, target ids, and counts
- **中文** 当 CLI host tests 运行 scripted chat input，先增加 references 再提交普通 prompt 时，测试必须断言 `agent.loop.started`、`turn.started` 与 `model.requested` metadata 包含 reference set/item ids、active item id、target ids 和 counts。

#### Scenario: Raw reference content is absent / 原始引用内容不存在

- **WHEN** reference context metadata is serialized in JSONL output
- **THEN** tests assert raw file contents, raw prompt duplication, credentials, and unredacted secret-like values are absent
- **中文** 当 reference context metadata 被序列化到 JSONL output 时，测试必须断言 raw file contents、raw prompt duplication、credentials 和未脱敏 secret-like values 不存在。

#### Scenario: Slash controls do not submit model requests / Slash 控制不提交模型请求

- **WHEN** tests run only `/palette refs ...` slash commands
- **THEN** tests assert no `model.requested` event is emitted until a subsequent non-slash prompt is submitted
- **中文** 当测试只运行 `/palette refs ...` slash commands 时，必须断言在后续非 slash prompt 提交前不会发出 `model.requested` event。
