## ADDED Requirements

### Requirement: Chat Palette Navigation State / Chat Palette 导航状态

The chat shell SHALL maintain local palette/result-list composition state across palette slash commands without sending those commands to the model or runtime.

Chat shell 必须跨 palette slash commands 维护本地 palette/result-list composition state，且不得把这些 commands 发送给 model 或 runtime。

#### Scenario: Palette navigation updates local focus / Palette 导航更新本地焦点
- **WHEN** the user enters `/palette next`, `/palette previous`, `/palette first`, or `/palette last` during chat
- **THEN** the shell resolves the action locally, updates the active result-list focus, renders the new focused target, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette next`、`/palette previous`、`/palette first` 或 `/palette last` 时，shell 必须本地解析 action、更新 active result-list focus、渲染新的 focused target，且不提交 runtime/model request。

#### Scenario: Palette state summarizes focus / Palette State 汇总焦点
- **WHEN** the user enters `/palette state`
- **THEN** the shell renders a deterministic summary containing mode, active target id, active result-list id, active item id, jump count, and reference count
- **中文** 当用户输入 `/palette state` 时，shell 必须渲染确定性摘要，包含 mode、active target id、active result-list id、active item id、jump count 和 reference count。

#### Scenario: Palette reference add uses current focus / Palette Reference Add 使用当前焦点
- **WHEN** the user enters `/palette refs add current`
- **THEN** the shell adds the focused result-list item to the active reference set through local action resolution and renders the updated reference count
- **中文** 当用户输入 `/palette refs add current` 时，shell 必须通过本地 action resolution 将当前聚焦 result-list item 加入 active reference set，并渲染更新后的 reference count。

#### Scenario: Palette navigation failures stay local / Palette 导航失败保持本地
- **WHEN** the user enters a malformed palette navigation or reference command
- **THEN** the shell emits a typed local failure and does not send the line to the model
- **中文** 当用户输入格式错误的 palette navigation 或 reference command 时，shell 必须输出类型化 local failure，且不得把该行发送给 model。
