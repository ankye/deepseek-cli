## ADDED Requirements

### Requirement: Revert Review Confirm Regression Coverage / 回退审阅确认回归覆盖

Regression tests SHALL cover chat-local revert review and confirm controls with deterministic workspace checkpoints and structured output assertions.

回归测试必须使用确定性 workspace checkpoints 和结构化输出断言覆盖 chat-local revert review 与 confirm controls。

#### Scenario: Review and confirm success is tested / 审阅并确认成功被测试

- **WHEN** CLI host tests run a scripted chat input with a mutating turn followed by `/revert review current` and `/revert confirm current`
- **THEN** tests assert the review record is dry-run, the confirmation applies through checkpoint restore safety checks, the file is restored, and the slash commands do not submit model requests
- **中文** 当 CLI host tests 运行包含 mutating turn 后接 `/revert review current` 与 `/revert confirm current` 的 scripted chat input 时，测试必须断言 review record 是 dry-run、confirmation 通过 checkpoint restore safety checks 执行、file 被恢复，且这些 slash commands 不提交 model request。

#### Scenario: Confirm without review is tested / 未审阅确认被测试

- **WHEN** CLI host tests run `/revert confirm current` before any pending review exists
- **THEN** tests assert a typed local failure and no unstructured host exception
- **中文** 当 CLI host tests 在没有 pending review 时运行 `/revert confirm current`，测试必须断言 typed local failure，且没有非结构化 host exception。

#### Scenario: Stale confirm is tested / 过期确认被测试

- **WHEN** tests mutate a file after review and before confirm
- **THEN** tests assert confirm emits stale diagnostics and leaves the file and checkpoint unchanged
- **中文** 当测试在 review 后、confirm 前修改文件时，测试必须断言 confirm 输出 stale diagnostics，并保持 file 与 checkpoint 不变。
