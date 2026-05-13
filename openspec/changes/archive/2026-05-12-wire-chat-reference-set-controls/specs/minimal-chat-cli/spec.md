## ADDED Requirements

### Requirement: Chat Reference Set Controls / Chat 引用集控制

The chat shell SHALL expose local reference-set controls under `/palette refs` for listing and focusing active references without sending those slash inputs to the model or runtime.

Chat shell 必须在 `/palette refs` 下暴露本地 reference-set controls，用于 listing 与 focusing active references，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Chat lists references locally / Chat 本地列出引用

- **WHEN** the user enters `/palette refs list`
- **THEN** the shell renders deterministic reference set and item records from local composition state and does not submit a runtime/model request
- **中文** 当用户输入 `/palette refs list` 时，shell 必须从本地 composition state 渲染确定性的 reference set 与 item records，且不提交 runtime/model request。

#### Scenario: Chat focuses reference locally / Chat 本地聚焦引用

- **WHEN** the user enters `/palette refs focus <ref-id|index|target-id|current>` after references exist
- **THEN** the shell resolves the selector locally, updates active reference focus, renders the focused item and state summary, and does not submit a runtime/model request
- **中文** 当用户在已有 references 后输入 `/palette refs focus <ref-id|index|target-id|current>` 时，shell 必须本地解析 selector、更新 active reference focus、渲染 focused item 与 state summary，且不提交 runtime/model request。

#### Scenario: Empty reference focus stays local / 空引用聚焦保持本地

- **WHEN** the user enters `/palette refs focus current` before any reference exists
- **THEN** the shell emits a typed palette diagnostic or typed local failure and keeps the REPL available
- **中文** 当用户在没有 reference 前输入 `/palette refs focus current` 时，shell 必须输出 typed palette diagnostic 或 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists reference controls / Help 列出引用控制

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette refs list` and `/palette refs focus <ref-id|index|target-id|current>` with the other local palette controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local palette controls 中列出 `/palette refs list` 和 `/palette refs focus <ref-id|index|target-id|current>`。
