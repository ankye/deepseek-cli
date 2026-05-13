## ADDED Requirements

### Requirement: Chat Local Revert Apply Current / Chat 本地当前回退执行

The chat shell SHALL expose a local `/revert apply current` control that resolves the selected local history turn to explicit session and turn ids before invoking revert apply.

Chat shell 必须暴露本地 `/revert apply current` control，并在调用 revert apply 前，将 selected local history turn 解析为显式 session id 与 turn id。

#### Scenario: Current revert apply uses selected turn / 当前回退执行使用选中 Turn

- **WHEN** the user enters `/revert apply current` after selecting or completing a history turn
- **THEN** the shell calls revert apply with `dryRun=false`, the selected turn id, and the selected session id, renders a local structured apply result, and does not submit a runtime/model request for the slash command
- **中文** 当用户在选择或完成 history turn 后输入 `/revert apply current` 时，shell 必须使用 `dryRun=false`、selected turn id 与 selected session id 调用 revert apply，渲染本地结构化 apply result，且不为该 slash command 提交 runtime/model request。

#### Scenario: Current revert apply requires selected history / 当前回退执行需要选中 History

- **WHEN** the user enters `/revert apply current` before any history turn is selected
- **THEN** the shell emits a typed local failure and does not send the line to the model
- **中文** 当用户在没有选中 history turn 前输入 `/revert apply current` 时，shell 必须输出 typed local failure，且不得把该行发送给 model。

#### Scenario: Help lists current revert apply / Help 列出当前回退执行

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/revert apply current` with the other local revert controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local revert controls 中列出 `/revert apply current`。
