## ADDED Requirements

### Requirement: Palette Jump History Traversal / Palette 跳转历史遍历

The command palette action layer SHALL resolve typed `back` and `forward` actions over composition jump history without executing palette owners or mutating workspace, sessions, checkpoints, plugins, tools, or runtime state.

Command palette action layer 必须基于 composition jump history 解析类型化 `back` 与 `forward` actions，且不得执行 palette owners 或修改 workspace、sessions、checkpoints、plugins、tools 或 runtime state。

#### Scenario: Back focuses prior jump target / Back 聚焦上一个跳转目标

- **WHEN** a composition snapshot contains jump history and a user invokes `back`
- **THEN** action resolution decrements the jump cursor, updates the active target to the resolved destination, updates matching result-list focus when possible, and returns a typed state update
- **中文** 当 composition snapshot 包含 jump history 且用户调用 `back` 时，action resolution 必须递减 jump cursor、将 active target 更新为解析出的 destination、在可能时更新匹配的 result-list focus，并返回类型化 state update。

#### Scenario: Forward focuses next jump target / Forward 聚焦下一个跳转目标

- **WHEN** a composition snapshot has a prior back traversal and a user invokes `forward`
- **THEN** action resolution increments the jump cursor, updates the active target to the resolved destination, updates matching result-list focus when possible, and returns a typed state update
- **中文** 当 composition snapshot 已发生 prior back traversal 且用户调用 `forward` 时，action resolution 必须递增 jump cursor、将 active target 更新为解析出的 destination、在可能时更新匹配的 result-list focus，并返回类型化 state update。

#### Scenario: Jump traversal failure is typed / 跳转遍历失败类型化

- **WHEN** a user invokes `back` or `forward` without a valid jump destination in that direction
- **THEN** action resolution returns a typed diagnostic and preserves the prior snapshot without executing owner commands
- **中文** 当用户调用 `back` 或 `forward` 但该方向没有有效 jump destination 时，action resolution 必须返回类型化 diagnostic，并保留之前的 snapshot，且不得执行 owner commands。
