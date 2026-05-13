## ADDED Requirements

### Requirement: Chat Applies Palette State Updates / Chat 应用 Palette 状态更新

The palette/action layer SHALL expose enough local action resolution data for chat to apply result-list focus, reference-set, and jump-history updates across slash commands.

Palette/action layer 必须暴露足够的本地 action resolution 数据，使 chat 能跨 slash commands 应用 result-list focus、reference-set 与 jump-history updates。

#### Scenario: Navigation result updates snapshot / 导航结果更新 Snapshot
- **WHEN** chat resolves a palette navigation action over a result-list target
- **THEN** the action result includes structured snapshot/update data for active target, result-list focus, and jump history without executing palette owners
- **中文** 当 chat 在 result-list target 上解析 palette navigation action 时，action result 必须包含 active target、result-list focus 和 jump history 的结构化 snapshot/update data，且不执行 palette owners。

#### Scenario: Reference result updates snapshot / Reference 结果更新 Snapshot
- **WHEN** chat resolves `add-to-reference-set` over a focused result-list item
- **THEN** the action result includes structured reference-set updates that can be retained by the chat host
- **中文** 当 chat 在当前聚焦 result-list item 上解析 `add-to-reference-set` 时，action result 必须包含可由 chat host 保留的结构化 reference-set updates。
