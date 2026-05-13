## ADDED Requirements

### Requirement: Command Palette Projection / 命令面板投影

The platform SHALL project command composition records into inert command palette entries and command result lists without invoking command handlers, skills, hooks, MCP tools, plugin lifecycle actions, extension code, or workflows.

平台必须将 command composition records 投影为惰性的 command palette entries 和 command result lists，且不得调用 command handlers、skills、hooks、MCP tools、plugin lifecycle actions、extension code 或 workflows。

#### Scenario: Palette entry preserves target metadata / 面板条目保留 Target 元数据
- **WHEN** a composition record is projected into the palette
- **THEN** the palette entry includes stable id, title, action, target kind, category, source metadata, permissions, side-effect metadata, redaction, and reference pit fixture ids
- **中文** 当 composition record 被投影到 palette 时，palette entry 必须包含 stable id、title、action、target kind、category、source metadata、permissions、side-effect metadata、redaction 和 reference pit fixture ids。

#### Scenario: Palette projection is inert / 面板投影惰性
- **WHEN** palette projection includes command, skill, hook, MCP, plugin, extension, renderer hint, or workflow records
- **THEN** projection returns metadata only and does not execute the owning subsystem
- **中文** 当 palette projection 包含 command、skill、hook、MCP、plugin、extension、renderer hint 或 workflow records 时，projection 只返回 metadata，不执行 owner subsystem。

### Requirement: Result-List Action Resolution / 结果列表动作解析

The CLI composition layer SHALL resolve actions over result-list and result-list-item targets into typed state updates or governed request descriptors rather than host-specific string commands.

CLI composition layer 必须把 result-list 和 result-list-item targets 上的 actions 解析为 typed state updates 或 governed request descriptors，而不是 host-specific string commands。

#### Scenario: Navigation updates focus / 导航更新焦点
- **WHEN** the user invokes `next`, `previous`, `first`, or `last` on a result-list target
- **THEN** action resolution updates the active result-list item deterministically and records a jump when focus changes
- **中文** 当用户在 result-list target 上调用 `next`、`previous`、`first` 或 `last` 时，action resolution 必须确定性更新 active result-list item，并在焦点变化时记录 jump。

#### Scenario: Add item to reference set / 添加结果项到引用集
- **WHEN** the user invokes `add-to-reference-set` on a result-list item
- **THEN** action resolution adds the item's typed target to the active reference set with provenance and ordering metadata
- **中文** 当用户在 result-list item 上调用 `add-to-reference-set` 时，action resolution 必须把该 item 的 typed target 加入 active reference set，并包含 provenance 和 ordering metadata。

#### Scenario: Revert action is dry-run request / 回退动作生成 Dry Run 请求
- **WHEN** the user invokes `revert` on a request, turn, message, session, or result-list item target
- **THEN** action resolution returns a dry-run revert request descriptor and does not mutate checkpoints, sessions, or workspace files
- **中文** 当用户对 request、turn、message、session 或 result-list item target 调用 `revert` 时，action resolution 必须返回 dry-run revert request descriptor，且不修改 checkpoints、sessions 或 workspace files。

### Requirement: Minimal Vi Keymap Profile / 最小 Vi 快捷键 Profile

The CLI SHALL provide a minimal vi-inspired keymap profile that maps familiar navigation keys to typed actions and modes without requiring full Vim emulation.

CLI 必须提供最小 vi-inspired keymap profile，将熟悉的导航按键映射到 typed actions 和 modes，且不要求完整 Vim 模拟。

#### Scenario: Vi keys map to actions / Vi 按键映射到动作
- **WHEN** the vi profile is requested
- **THEN** the profile includes deterministic keymap entries for result-list navigation, open/inspect, prompt mode, command mode, and quit/cancel host controls
- **中文** 当请求 vi profile 时，该 profile 必须包含 result-list navigation、open/inspect、prompt mode、command mode 和 quit/cancel host controls 的确定性 keymap entries。

#### Scenario: Keymap conflicts are reported / 快捷键冲突可诊断
- **WHEN** core, user, or plugin keymap entries conflict within the same mode and key
- **THEN** validation reports deterministic conflict diagnostics rather than silently choosing a host-specific behavior
- **中文** 当 core、user 或 plugin keymap entries 在同一 mode 和 key 上冲突时，validation 必须返回确定性 conflict diagnostics，而不是静默选择 host-specific behavior。
