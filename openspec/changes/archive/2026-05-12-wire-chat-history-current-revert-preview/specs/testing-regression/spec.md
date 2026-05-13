## ADDED Requirements

### Requirement: Chat History Current Revert Regression Coverage / Chat History Current Revert 回归覆盖

The regression suite SHALL cover local chat history listing, history selection, `/revert preview current`, empty-history failures, and no model/runtime submission for history controls.

Regression suite 必须覆盖本地 chat history listing、history selection、`/revert preview current`、empty-history failures，以及 history controls 不提交 model/runtime。

#### Scenario: History listing is tested / History Listing 被测试
- **WHEN** CLI host tests run scripted chat input with prompt turns followed by `/history`
- **THEN** tests assert local history records with turn ids, selected markers, and no raw ANSI controls in structured output
- **中文** 当 CLI host tests 运行包含 prompt turns 后接 `/history` 的 scripted chat input 时，测试必须断言本地 history records 包含 turn ids、selected markers，且 structured output 没有 raw ANSI controls。

#### Scenario: Revert current is tested / Revert Current 被测试
- **WHEN** CLI host tests run scripted chat input with `/revert preview current`
- **THEN** tests assert the preview target is the selected explicit turn/session target and no model request is submitted for the slash line
- **中文** 当 CLI host tests 运行包含 `/revert preview current` 的 scripted chat input 时，测试必须断言 preview target 是选中的显式 turn/session target，且 slash line 不提交 model request。

#### Scenario: Empty current failure is tested / Empty Current Failure 被测试
- **WHEN** CLI host tests run `/revert preview current` before any prompt turn
- **THEN** tests assert a typed local failure and no unstructured exception
- **中文** 当 CLI host tests 在任何 prompt turn 前运行 `/revert preview current` 时，测试必须断言 typed local failure，且没有非结构化 exception。
