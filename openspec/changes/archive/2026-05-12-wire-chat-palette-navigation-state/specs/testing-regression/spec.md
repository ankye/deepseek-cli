## ADDED Requirements

### Requirement: Chat Palette Navigation Regression Coverage / Chat Palette 导航回归覆盖

The regression suite SHALL cover stateful chat palette navigation, palette state summaries, reference-set updates, typed local failures, and no model/runtime submission for palette navigation commands.

Regression suite 必须覆盖有状态 chat palette navigation、palette state summaries、reference-set updates、类型化本地失败，以及 palette navigation commands 不提交 model/runtime。

#### Scenario: Navigation records are tested / 导航 Records 被测试
- **WHEN** CLI host tests run scripted chat input containing `/palette`, `/palette next`, and `/palette state`
- **THEN** tests assert structured local records with changed focus and no model/runtime event submission
- **中文** 当 CLI host tests 运行包含 `/palette`、`/palette next` 和 `/palette state` 的 scripted chat input 时，测试必须断言结构化本地 records、焦点变化以及没有 model/runtime event submission。

#### Scenario: Reference updates are tested / Reference Updates 被测试
- **WHEN** CLI host tests run scripted chat input containing `/palette refs add current`
- **THEN** tests assert the active reference count increases through typed local action resolution
- **中文** 当 CLI host tests 运行包含 `/palette refs add current` 的 scripted chat input 时，测试必须断言 active reference count 通过类型化本地 action resolution 增加。

#### Scenario: Invalid navigation stays local in tests / 无效导航在测试中保持本地
- **WHEN** CLI host tests run malformed palette navigation input
- **THEN** tests assert a typed local failure and no unstructured host exception
- **中文** 当 CLI host tests 运行格式错误的 palette navigation input 时，测试必须断言 typed local failure，且没有非结构化 host exception。
