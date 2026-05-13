## ADDED Requirements

### Requirement: Chat Palette Jump Controls / Chat Palette 跳转控制

The chat shell SHALL expose local `/palette back` and `/palette forward` controls that traverse palette jump history through typed action resolution without sending those slash inputs to the model or runtime.

Chat shell 必须暴露本地 `/palette back` 与 `/palette forward` controls，通过类型化 action resolution 遍历 palette jump history，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Palette back updates focus locally / Palette Back 本地更新焦点

- **WHEN** the user enters `/palette back` after palette navigation has recorded jump history
- **THEN** the shell resolves the action locally, updates active target and result-list focus from jump history, renders a structured action result and state summary, and does not submit a runtime/model request
- **中文** 当用户在 palette navigation 已记录 jump history 后输入 `/palette back` 时，shell 必须本地解析 action、基于 jump history 更新 active target 与 result-list focus、渲染结构化 action result 与 state summary，且不提交 runtime/model request。

#### Scenario: Palette forward updates focus locally / Palette Forward 本地更新焦点

- **WHEN** the user enters `/palette forward` after a prior `/palette back`
- **THEN** the shell resolves the action locally, moves the jump cursor forward, renders the restored focus, and does not submit a runtime/model request
- **中文** 当用户在 prior `/palette back` 后输入 `/palette forward` 时，shell 必须本地解析 action、将 jump cursor 前移、渲染恢复后的 focus，且不提交 runtime/model request。

#### Scenario: Empty jump traversal stays local / 空跳转遍历保持本地

- **WHEN** the user enters `/palette back` or `/palette forward` before a destination exists in that direction
- **THEN** the shell emits a typed palette action diagnostic or typed local failure and keeps the REPL available
- **中文** 当用户在对应方向没有 destination 前输入 `/palette back` 或 `/palette forward` 时，shell 必须输出 typed palette action diagnostic 或 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists jump controls / Help 列出跳转控制

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette back|forward` with other local palette controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local palette controls 中列出 `/palette back|forward`。
