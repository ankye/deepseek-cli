## ADDED Requirements

### Requirement: Chat Local Turn History / Chat 本地 Turn 历史

The chat shell SHALL maintain a local ordered history of completed prompt turns and expose it through local slash controls without sending history commands to the model.

Chat shell 必须维护已完成 prompt turns 的本地有序 history，并通过本地 slash controls 暴露，且不得把 history commands 发送给 model。

#### Scenario: History lists completed turns / History 列出已完成 Turns
- **WHEN** the user enters `/history` after one or more prompt turns
- **THEN** the shell renders deterministic local history entries with index, session id, turn id, status, trace id, selected marker, and redacted prompt preview
- **中文** 当用户在一个或多个 prompt turns 后输入 `/history` 时，shell 必须渲染确定性本地 history entries，包含 index、session id、turn id、status、trace id、selected marker 和脱敏 prompt preview。

#### Scenario: History select updates current target / History Select 更新当前 Target
- **WHEN** the user enters `/history select <turn-id|index|current|last>`
- **THEN** the shell updates the selected history turn locally and renders the selected entry
- **中文** 当用户输入 `/history select <turn-id|index|current|last>` 时，shell 必须本地更新 selected history turn，并渲染 selected entry。

#### Scenario: Empty history is typed local failure / 空 History 是类型化本地失败
- **WHEN** the user enters `/history select current` before any prompt turn completes
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户在任何 prompt turn 完成前输入 `/history select current` 时，shell 必须输出 typed local failure，并保持 REPL 可用。

### Requirement: Chat Revert Preview Current / Chat 当前回退预览

The chat shell SHALL resolve `/revert preview current` to the selected local history turn before invoking dry-run revert preview.

Chat shell 必须在调用 dry-run revert preview 前，将 `/revert preview current` 解析为选中的本地 history turn。

#### Scenario: Current revert preview uses selected turn / 当前回退预览使用选中 Turn
- **WHEN** the user enters `/revert preview current` after selecting or completing a history turn
- **THEN** the shell calls dry-run revert preview with the selected turn id and session id, renders a local revert preview result, and does not submit a runtime/model request
- **中文** 当用户在选择或完成 history turn 后输入 `/revert preview current` 时，shell 必须使用 selected turn id 与 session id 调用 dry-run revert preview、渲染本地 revert preview result，且不提交 runtime/model request。

#### Scenario: Current revert preview requires selected history / 当前回退预览需要选中 History
- **WHEN** the user enters `/revert preview current` before any history turn is selected
- **THEN** the shell emits a typed local failure rather than sending the line to the model
- **中文** 当用户在没有选中 history turn 前输入 `/revert preview current` 时，shell 必须输出 typed local failure，而不是把该行发送给 model。
