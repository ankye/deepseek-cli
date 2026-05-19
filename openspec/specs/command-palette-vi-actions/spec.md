# command-palette-vi-actions Specification

## Purpose
TBD - created by archiving change implement-command-palette-and-vi-result-actions. Update Purpose after archive.
## Requirements
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

### Requirement: Scriptable CLI Palette Commands / 可脚本化 CLI Palette 命令

The CLI SHALL expose scriptable palette commands that render palette projections, keymap profiles, and dry-run action resolution without executing palette owners.

CLI 必须暴露可脚本化 palette commands，用于渲染 palette projections、keymap profiles 和 dry-run action resolution，且不得执行 palette owners。

#### Scenario: Palette list emits projection / Palette List 输出投影
- **WHEN** a user runs `deepseek palette list --output json`
- **THEN** the CLI emits a `CliPaletteProjectionResult` derived from command composition records, including entries, result-list items, diagnostics, permissions, side effects, and reference pit fixture ids
- **中文** 当用户运行 `deepseek palette list --output json` 时，CLI 必须输出由 command composition records 派生的 `CliPaletteProjectionResult`，包含 entries、result-list items、diagnostics、permissions、side effects 和 reference pit fixture ids。

#### Scenario: Palette JSONL is record-oriented / Palette JSONL 面向记录
- **WHEN** a user runs `deepseek palette list --output jsonl`
- **THEN** the CLI emits a deterministic summary record followed by one record per palette entry and one record per diagnostic, without ANSI or terminal cursor controls
- **中文** 当用户运行 `deepseek palette list --output jsonl` 时，CLI 必须输出确定性的 summary record、每个 palette entry 一条 record、每个 diagnostic 一条 record，且不包含 ANSI 或 terminal cursor controls。

#### Scenario: Palette keymap emits profile / Palette Keymap 输出 Profile
- **WHEN** a user runs `deepseek palette keymap vi-minimal --output json`
- **THEN** the CLI emits the selected keymap profile with contributions and deterministic diagnostics
- **中文** 当用户运行 `deepseek palette keymap vi-minimal --output json` 时，CLI 必须输出所选 keymap profile，包含 contributions 与确定性 diagnostics。

#### Scenario: Palette action is dry-run / Palette Action 是 Dry Run
- **WHEN** a user runs `deepseek palette action inspect <target-id> --output json`
- **THEN** the CLI resolves the action against the projected result-list snapshot and emits a typed `CliActionResolutionResult` without mutating sessions, checkpoints, workspace files, or executing command handlers
- **中文** 当用户运行 `deepseek palette action inspect <target-id> --output json` 时，CLI 必须基于投影出的 result-list snapshot 解析 action，并输出 typed `CliActionResolutionResult`，且不修改 sessions、checkpoints、workspace files 或执行 command handlers。

#### Scenario: Unknown palette target is typed failure / 未知 Palette Target 是类型化失败
- **WHEN** a user runs `deepseek palette action inspect <unknown-target-id> --output json`
- **THEN** the CLI emits a typed failure with deterministic diagnostics rather than throwing an unstructured host error
- **中文** 当用户运行 `deepseek palette action inspect <unknown-target-id> --output json` 时，CLI 必须输出带确定性 diagnostics 的类型化失败，而不是抛出非结构化 host error。

### Requirement: Chat Consumes Palette Actions Locally / Chat 本地消费 Palette Actions

The palette/action layer SHALL be consumable by the chat host as local controls while preserving the same typed projection and dry-run action semantics as scriptable CLI palette commands.

Palette/action layer 必须可被 chat host 作为本地 controls 消费，并保持与可脚本化 CLI palette commands 相同的 typed projection 与 dry-run action 语义。

#### Scenario: Chat palette uses same projection / Chat Palette 使用同一投影
- **WHEN** chat renders `/palette`
- **THEN** it derives entries from the same command composition projection used by `deepseek palette list`
- **中文** 当 chat 渲染 `/palette` 时，必须从 `deepseek palette list` 使用的同一 command composition projection 派生 entries。

#### Scenario: Chat action uses same resolver / Chat Action 使用同一 Resolver
- **WHEN** chat resolves `/palette action <action> <target-id>`
- **THEN** it uses the same typed action resolution semantics as scriptable palette action commands and keeps the result dry-run
- **中文** 当 chat 解析 `/palette action <action> <target-id>` 时，必须使用与可脚本化 palette action commands 相同的 typed action resolution 语义，并保持结果 dry-run。

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

### Requirement: Reference Focus Action Resolution / 引用聚焦动作解析

The palette/action layer SHALL resolve typed reference focus actions over existing composition snapshot reference sets without executing palette owners, model calls, runtime primitives, or workspace mutations.

Palette/action layer 必须基于现有 composition snapshot reference sets 解析类型化 reference focus actions，且不得执行 palette owners、model calls、runtime primitives 或 workspace mutations。

#### Scenario: Focus updates active reference item / 聚焦更新当前引用项

- **WHEN** a `focus-reference` action targets an existing reference item
- **THEN** action resolution updates the owning reference set's active item id, updates the active target to the item's target, and returns a typed state update
- **中文** 当 `focus-reference` action 指向已有 reference item 时，action resolution 必须更新所属 reference set 的 active item id、将 active target 更新为该 item 的 target，并返回类型化 state update。

#### Scenario: Focus preserves reference items / 聚焦保留引用项

- **WHEN** a reference focus action succeeds
- **THEN** action resolution preserves all existing reference sets and items except for the focused set's active item id
- **中文** 当 reference focus action 成功时，action resolution 必须保留所有已有 reference sets 与 items，除被聚焦 set 的 active item id 外不得改变。

#### Scenario: Missing reference target is typed / 缺失引用 Target 类型化

- **WHEN** a `focus-reference` action targets a missing reference item
- **THEN** action resolution returns `CLI_ACTION_TARGET_NOT_FOUND` diagnostics and preserves the prior snapshot
- **中文** 当 `focus-reference` action 指向缺失 reference item 时，action resolution 必须返回 `CLI_ACTION_TARGET_NOT_FOUND` diagnostics，并保留之前的 snapshot。

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

### Requirement: TUI Keymap Dispatch Shares Palette Action Resolution / TUI Keymap Dispatch 共享 Palette Action 解析

The production TUI framework SHALL resolve keymap-triggered navigation and actions through the same typed action resolution used by chat palette slash commands.

Production TUI framework 必须通过 chat palette slash commands 使用的同一 typed action resolution 解析 keymap-triggered navigation 与 actions。

#### Scenario: Key navigation equals slash navigation / 按键导航等价 Slash 导航

- **WHEN** result-list mode maps `j` to `next` or `k` to `previous`
- **THEN** dispatching the key updates result-list focus, active target, and jump history with the same state semantics as `/palette next` or `/palette previous`
- **中文** 当 result-list mode 将 `j` 映射到 `next` 或将 `k` 映射到 `previous` 时，dispatching key 必须以与 `/palette next` 或 `/palette previous` 相同的 state semantics 更新 result-list focus、active target 与 jump history。

#### Scenario: Command key becomes local descriptor / 命令键成为本地描述符

- **WHEN** normal mode maps `:` to command entry
- **THEN** the framework returns a typed local command descriptor and does not execute model, runtime, plugin, MCP, workspace mutation, or shell commands
- **中文** 当 normal mode 将 `:` 映射到 command entry 时，framework 必须返回 typed local command descriptor，且不得执行 model、runtime、plugin、MCP、workspace mutation 或 shell commands。

### Requirement: TUI Registry Extends Palette Contributions / TUI Registry 扩展 Palette Contributions

The production TUI framework SHALL include command palette entries and render hints in its declarative contribution registry and surface their counts and conflicts in diagnostics.

Production TUI framework 必须在声明式 contribution registry 中包含 command palette entries 与 render hints，并在 diagnostics 中暴露它们的数量与冲突。

#### Scenario: Render hint is metadata-only / Render Hint 仅是元数据

- **WHEN** a plugin contributes a render hint for a command, target, or result-list kind
- **THEN** the framework stores and reports the hint as metadata without importing renderer code or bypassing terminal profile rendering rules
- **中文** 当 plugin 为 command、target 或 result-list kind 贡献 render hint 时，framework 必须将该 hint 作为 metadata 存储和报告，不得导入 renderer code 或绕过 terminal profile rendering rules。

### Requirement: First-Party Palette Projection / 一方插件面板投影

The command palette SHALL project first-party plugin commands, result-list providers, keymaps, renderer hints, and reference targets as inert metadata with stable provenance and permissions.

command palette 必须将一方 plugin commands、result-list providers、keymaps、renderer hints 与 reference targets 投影为惰性 metadata，并保留稳定 provenance 与 permissions。

#### Scenario: Plugin palette entries are inert / 插件面板条目惰性

- **WHEN** `/palette`, `deepseek palette list`, TUI startup, or extension management requests first-party plugin entries
- **THEN** projection returns stable entries with ids, titles, categories, actions, target metadata, permissions, side effects, source metadata, and diagnostics
- **AND** projection does not execute the command owner or plugin owner
- **中文** 当 `/palette`、`deepseek palette list`、TUI startup 或 extension management 请求一方插件条目时，projection 必须返回包含 ids、titles、categories、actions、target metadata、permissions、side effects、source metadata 与 diagnostics 的稳定 entries；projection 不得执行 command owner 或 plugin owner。

#### Scenario: First-party keymap conflicts are typed / 一方快捷键冲突类型化

- **WHEN** a first-party plugin contributes a keymap entry that conflicts with core, user, or another plugin contribution in the same mode and key
- **THEN** validation returns deterministic conflict diagnostics naming the winner, loser, mode, key, and contribution provenance
- **中文** 当一方插件贡献的 keymap entry 与同一 mode 和 key 下的 core、user 或另一个 plugin contribution 冲突时，validation 必须返回确定性 conflict diagnostics，包含 winner、loser、mode、key 与 contribution provenance。

### Requirement: First-Party Result Lists / 一方插件结果列表

First-party plugin result lists SHALL use typed targets so vi-inspired navigation, inspection, references, jumps, and dry-run actions work consistently across repo navigation, git review, dev checks, and context compaction results.

一方 plugin result lists 必须使用 typed targets，使 vi-inspired navigation、inspection、references、jumps 与 dry-run actions 在 repo navigation、git review、dev checks 与 context compaction results 中保持一致。

#### Scenario: Result list supports vi navigation / 结果列表支持 Vi 导航

- **WHEN** a first-party plugin result list is active and the user invokes `next`, `previous`, `first`, `last`, `back`, `forward`, `inspect`, or `add-to-reference-set`
- **THEN** action resolution updates the shared composition snapshot or returns a governed request descriptor without mutating workspace, sessions, checkpoints, plugins, or runtime state during projection
- **中文** 当一方 plugin result list 处于 active 状态且用户调用 `next`、`previous`、`first`、`last`、`back`、`forward`、`inspect` 或 `add-to-reference-set` 时，action resolution 必须更新共享 composition snapshot 或返回 governed request descriptor，projection 阶段不得修改 workspace、sessions、checkpoints、plugins 或 runtime state。

#### Scenario: Context result can be referenced / Context 结果可引用

- **WHEN** a context compactor result-list item represents a lossless node, summary node, expanded node, budget finding, or pinned context target
- **THEN** the item includes a typed target id, redacted title/snippet, source class, session id when available, provenance, and action metadata for inspect, expand, and add-to-reference-set
- **中文** 当 context compactor result-list item 表示 lossless node、summary node、expanded node、budget finding 或 pinned context target 时，该 item 必须包含 typed target id、脱敏 title/snippet、source class、可用时的 session id、provenance，以及 inspect、expand 和 add-to-reference-set 的 action metadata。
