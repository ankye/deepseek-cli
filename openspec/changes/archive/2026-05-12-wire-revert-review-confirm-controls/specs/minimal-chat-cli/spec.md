## ADDED Requirements

### Requirement: Chat Revert Review And Confirm / Chat 回退审阅与确认

The chat shell SHALL provide local revert review and confirm controls that separate interactive rollback impact review from mutation.

Chat shell 必须提供本地 revert review 与 confirm controls，将交互式 rollback impact review 与 mutation 分离。

#### Scenario: Review current creates pending confirmation / 审阅当前 Turn 创建待确认项

- **WHEN** the user enters `/revert review current` after selecting or completing a history turn
- **THEN** the shell resolves the selected turn to explicit session and turn ids, runs dry-run revert preview, stores a pending review id, renders the review impact summary, and does not submit a model request for the slash command
- **中文** 当用户在选择或完成 history turn 后输入 `/revert review current` 时，shell 必须将 selected turn 解析为显式 session id 与 turn id，运行 dry-run revert preview，保存 pending review id，渲染 review impact summary，且不为该 slash command 提交 model request。

#### Scenario: Confirm applies reviewed target / 确认执行已审阅 Target

- **WHEN** the user enters `/revert confirm <review-id|current>` for a pending review
- **THEN** the shell applies the pending review's explicit target through checkpoint restore safety checks, renders a structured confirmation result, and does not submit a model request for the slash command
- **中文** 当用户对 pending review 输入 `/revert confirm <review-id|current>` 时，shell 必须通过 checkpoint restore safety checks 对该 pending review 的显式 target 执行 apply，渲染结构化 confirmation result，且不为该 slash command 提交 model request。

#### Scenario: Confirm requires pending review / 确认需要待确认 Review

- **WHEN** the user enters `/revert confirm current` before creating a pending review
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户在创建 pending review 之前输入 `/revert confirm current` 时，shell 必须输出 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists review and confirm / Help 列出审阅与确认

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/revert review current` and `/revert confirm <review-id|current>` with the other local revert controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local revert controls 中列出 `/revert review current` 和 `/revert confirm <review-id|current>`。
