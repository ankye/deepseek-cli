# chat-tui-workbench-interaction Specification

## Purpose
TBD - created by archiving change elevate-chat-tui-workbench-interaction. Update Purpose after archive.
## Requirements
### Requirement: Workbench Layout Model / 工作台布局模型

The CLI SHALL expose a deterministic chat TUI workbench projection with status, transcript, reasoning rail, inspector, command bar, activity feed, and plugin shelf regions.

CLI 必须提供确定性 chat TUI workbench projection，包含 status、transcript、reasoning rail、inspector、command bar、activity feed 与 plugin shelf 区域。

#### Scenario: Interactive terminal receives a workbench frame / 交互终端获得工作台帧

- **WHEN** chat runs in a compatible interactive text terminal
- **THEN** the TUI state includes a workbench layout, region summaries, bounded frame lines, active focus, command bar state, and plugin shelf metadata
- **中文** 当 chat 运行在兼容 interactive text terminal 中时，TUI state 必须包含 workbench layout、region summaries、有界 frame lines、active focus、command bar state 与 plugin shelf metadata。

#### Scenario: Narrow terminal degrades predictably / 窄终端确定性降级

- **WHEN** terminal width is narrow or unknown
- **THEN** the workbench uses a compact stacked layout with bounded status, command bar, reasoning, and inspector summaries
- **中文** 当 terminal width 较窄或未知时，workbench 必须使用 compact stacked layout，并保持 status、command bar、reasoning 与 inspector summaries 有界。

### Requirement: Focus And Navigation Model / 焦点与导航模型

The TUI SHALL model focus as explicit panel state and support deterministic keyboard dispatch between transcript, result-list, reasoning, inspector, command bar, activity, and plugin shelf surfaces.

TUI 必须将 focus 建模为显式 panel state，并支持在 transcript、result-list、reasoning、inspector、command bar、activity 与 plugin shelf surfaces 之间确定性键盘调度。

#### Scenario: Panel focus changes without model call / 焦点切换不触发模型调用

- **WHEN** the user dispatches a panel focus key such as Tab, Shift+Tab, r, i, a, p, or Escape
- **THEN** focus changes locally, focus history is updated, diagnostics remain structured, and no model/runtime request is created
- **中文** 当用户触发 Tab、Shift+Tab、r、i、a、p 或 Escape 等 panel focus key 时，焦点必须本地变化、focus history 必须更新、diagnostics 保持结构化，且不得创建 model/runtime request。

### Requirement: Product Command Bar / 产品命令栏

The TUI SHALL provide a command bar projection that unifies slash controls, palette entries, context commands, reference workflows, reasoning views, history, and plugin actions.

TUI 必须提供 command bar projection，统一 slash controls、palette entries、context commands、reference workflows、reasoning views、history 与 plugin actions。

#### Scenario: Command suggestions are ranked and bounded / 命令建议有序且有界

- **WHEN** the command bar opens or receives a query
- **THEN** it returns deterministic suggestions ranked by core, active context, plugin trust, and lexical order, capped with an overflow count
- **中文** 当 command bar 打开或收到 query 时，它必须返回确定性的 suggestions，按 core、active context、plugin trust 与 lexical order 排序，并用 overflow count 表示截断。

### Requirement: Reasoning Rail And Inspector / 推理栏与检查器

The TUI SHALL project visible reasoning into a compact rail and link the active reasoning step to inspector evidence targets.

TUI 必须将 visible reasoning 投影为 compact rail，并将 active reasoning step 连接到 inspector evidence targets。

#### Scenario: Active reasoning step drives inspector / 当前推理步骤驱动检查器

- **WHEN** visible reasoning projection contains records with evidence links
- **THEN** the reasoning rail shows ordered compact steps and the inspector shows active evidence targets without exposing raw provider reasoning
- **中文** 当 visible reasoning projection 包含带 evidence links 的 records 时，reasoning rail 必须展示有序 compact steps，inspector 必须展示 active evidence targets，且不得暴露 raw provider reasoning。

### Requirement: Activity Feed And Plugin Shelf / 活动流与插件架

The TUI SHALL provide an activity feed for recent local state changes and a plugin shelf summarizing trusted plugin contributions and readiness.

TUI 必须提供 activity feed 展示近期本地状态变化，并提供 plugin shelf 摘要 trusted plugin contributions 与 readiness。

#### Scenario: Plugins feel native but inert / 插件原生但惰性

- **WHEN** first-party plugin metadata contributes commands, palette entries, keymaps, render hints, or reasoning records
- **THEN** the plugin shelf summarizes contribution counts, readiness, diagnostics, and top plugin ids without executing plugin-private code
- **中文** 当 first-party plugin metadata 贡献 commands、palette entries、keymaps、render hints 或 reasoning records 时，plugin shelf 必须总结 contribution counts、readiness、diagnostics 与 top plugin ids，且不执行 plugin-private code。

