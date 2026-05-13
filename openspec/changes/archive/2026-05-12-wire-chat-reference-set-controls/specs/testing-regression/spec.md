## ADDED Requirements

### Requirement: Chat Reference Set Regression Coverage / Chat 引用集回归覆盖

Regression tests SHALL cover reference-set listing, focus switching, missing selector diagnostics, and local/no-model behavior for chat palette reference controls.

回归测试必须覆盖 chat palette reference controls 的 reference-set listing、focus switching、missing selector diagnostics 和 local/no-model behavior。

#### Scenario: Reference list is tested / 引用列表被测试

- **WHEN** CLI host tests run scripted chat input that adds a focused palette item to references and invokes `/palette refs list`
- **THEN** tests assert structured JSONL set and item records, active item metadata, redaction metadata, no ANSI controls, and no model/runtime submission for reference slash lines
- **中文** 当 CLI host tests 运行 scripted chat input，将当前 palette item 加入 references 后调用 `/palette refs list` 时，测试必须断言结构化 JSONL set 与 item records、active item metadata、redaction metadata、无 ANSI controls，以及 reference slash lines 不提交 model/runtime。

#### Scenario: Reference focus is tested / 引用聚焦被测试

- **WHEN** CLI host tests add multiple reference items and invoke `/palette refs focus <selector>`
- **THEN** tests assert active reference focus changes to the selected item while existing references remain present
- **中文** 当 CLI host tests 增加多个 reference items 并调用 `/palette refs focus <selector>` 时，测试必须断言 active reference focus 切换到选中 item，同时已有 references 仍存在。

#### Scenario: Missing reference focus is tested / 缺失引用聚焦被测试

- **WHEN** CLI host tests invoke `/palette refs focus missing-reference`
- **THEN** tests assert a typed diagnostic or local failure and no unstructured host exception
- **中文** 当 CLI host tests 调用 `/palette refs focus missing-reference` 时，测试必须断言 typed diagnostic 或 local failure，且没有非结构化 host exception。

#### Scenario: Contract focus action is tested / Contract 聚焦动作被测试

- **WHEN** contract tests resolve `focus-reference` against a composition snapshot with reference sets
- **THEN** tests assert active target updates, active item id updates, reference items are preserved, and missing targets return typed diagnostics
- **中文** 当 contract tests 基于带 reference sets 的 composition snapshot 解析 `focus-reference` 时，测试必须断言 active target updates、active item id updates、reference items 被保留，以及 missing targets 返回 typed diagnostics。
