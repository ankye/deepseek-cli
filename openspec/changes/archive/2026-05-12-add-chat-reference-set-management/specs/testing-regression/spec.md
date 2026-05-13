## ADDED Requirements

### Requirement: Chat Reference Mutation Regression Coverage / Chat 引用变更回归覆盖

Regression tests SHALL cover chat-local reference remove, clear, replace-current, missing-target failures, no slash-command model submission, and prompt-boundary preservation after mutations.

回归测试必须覆盖 chat-local reference remove、clear、replace-current、missing-target failures、slash-command 不提交模型，以及 mutations 后的 prompt-boundary preservation。

#### Scenario: Remove and clear are tested / 移除与清空被测试

- **WHEN** CLI host tests run scripted chat input that adds references, removes one, clears the set, and lists references
- **THEN** tests assert deterministic reference counts, active reference focus updates, typed local records, no ANSI controls in structured output, and no model request for the slash commands
- **中文** 当 CLI host tests 运行 scripted chat input，添加 references、移除一项、清空集合并列出 references 时，测试必须断言确定性的 reference counts、active reference focus updates、typed local records、structured output 不含 ANSI controls，以及 slash commands 不提交 model request。

#### Scenario: Replace current projection is tested / 替换当前项投影被测试

- **WHEN** CLI host tests add multiple file references, focus a result-list item, run `/palette refs replace current`, and submit a normal prompt
- **THEN** tests assert the prompt carries exactly one active file reference, the projected model context comes from the replacement item, and the user prompt text remains unchanged
- **中文** 当 CLI host tests 添加多个 file references、聚焦 result-list item、运行 `/palette refs replace current` 并提交普通 prompt 时，测试必须断言 prompt 只携带一个 active file reference，projected model context 来自 replacement item，且 user prompt text 保持不变。

#### Scenario: Missing mutation target is tested / 缺失变更目标被测试

- **WHEN** CLI host tests run reference remove or replace commands with missing targets
- **THEN** tests assert typed local failures, preserved reference state, and no unstructured host exception
- **中文** 当 CLI host tests 运行目标缺失的 reference remove 或 replace commands 时，测试必须断言 typed local failures、reference state 被保留，且没有非结构化 host exception。
