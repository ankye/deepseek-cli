## MODIFIED Requirements

### Requirement: Minimal Vi Keymap Profile / 最小 Vi 快捷键 Profile

The CLI SHALL provide a minimal vi-inspired keymap profile and a professional vi profile that map familiar navigation keys to typed actions and modes without requiring full Vim emulation.

CLI 必须提供 minimal vi-inspired keymap profile 与 professional vi profile，将熟悉的导航按键映射到 typed actions 和 modes，且不要求完整 Vim 模拟。

#### Scenario: Vi keys map to actions / Vi 按键映射到动作
- **WHEN** a vi profile is requested
- **THEN** the profile includes deterministic keymap entries for result-list navigation, panel focus, scroll movement, open/inspect, prompt mode, command mode, search mode, plugin leader bindings, and quit/cancel host controls
- **中文** 当请求 vi profile 时，该 profile 必须包含 result-list navigation、panel focus、scroll movement、open/inspect、prompt mode、command mode、search mode、plugin leader bindings 与 quit/cancel host controls 的确定性 keymap entries。

#### Scenario: Keymap conflicts are reported / 快捷键冲突可诊断
- **WHEN** core, user, or plugin keymap entries conflict within the same mode, key sequence, leader namespace, or conflict group
- **THEN** validation reports deterministic conflict diagnostics with winner, loser, precedence source, suggested override, and affected modes rather than silently choosing a host-specific behavior
- **中文** 当 core、user 或 plugin keymap entries 在同一 mode、key sequence、leader namespace 或 conflict group 上冲突时，validation 必须返回包含 winner、loser、precedence source、suggested override 与 affected modes 的确定性 diagnostics，而不是静默选择 host-specific behavior。

## ADDED Requirements

### Requirement: Plugin Contribution Inspector / 插件贡献检查器

The palette/action layer SHALL expose plugin contribution inspection for commands, actions, keymaps, result-list providers, render hints, and reasoning records.

Palette/action layer 必须为 commands、actions、keymaps、result-list providers、render hints 与 reasoning records 暴露 plugin contribution inspection。

#### Scenario: Inspect contribution explains execution path / 检查贡献解释执行路径

- **WHEN** the user inspects a plugin contribution
- **THEN** the CLI renders stable id, plugin id, namespace, contribution kind, modes, key sequences, permissions, side effects, owner route, preview text, conflict status, and execution governance path
- **中文** 当用户检查 plugin contribution 时，CLI 必须渲染 stable id、plugin id、namespace、contribution kind、modes、key sequences、permissions、side effects、owner route、preview text、conflict status 与 execution governance path。

#### Scenario: Side-effecting plugin action previews first / 有副作用插件动作先预览

- **WHEN** a plugin-contributed action may mutate workspace, run a process, call a model, call MCP, invoke hooks, or touch credentials
- **THEN** palette/TUI action resolution returns a preview descriptor and requires explicit governed approval before execution
- **中文** 当 plugin-contributed action 可能修改 workspace、运行 process、调用 model、调用 MCP、调用 hooks 或触碰 credentials 时，palette/TUI action resolution 必须先返回 preview descriptor，并在执行前要求显式 governed approval。

### Requirement: Plugin Keymap Discovery / 插件快捷键发现

The CLI SHALL provide discoverable keymap help for core, user, and plugin bindings with filters for mode, plugin, namespace, and conflict state.

CLI 必须为 core、user 与 plugin bindings 提供可发现的 keymap help，并支持按 mode、plugin、namespace 与 conflict state 过滤。

#### Scenario: Help shows available and rejected keys / Help 显示可用与被拒快捷键

- **WHEN** the user opens key help or runs a scriptable keymap command
- **THEN** the output includes active bindings, hidden bindings, rejected bindings, conflict reasons, required permissions, and user override hints without executing owners
- **中文** 当用户打开 key help 或运行可脚本化 keymap command 时，输出必须包含 active bindings、hidden bindings、rejected bindings、conflict reasons、required permissions 与 user override hints，且不执行 owners。
