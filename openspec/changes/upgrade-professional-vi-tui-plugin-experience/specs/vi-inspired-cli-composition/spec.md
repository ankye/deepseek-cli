## MODIFIED Requirements

### Requirement: Vi-Inspired Composition Model / Vi 启发式组合模型

The CLI SHALL define a vi-inspired composition model built from explicit modes, composable actions, typed targets, optional counts, repeatable commands, multi-key sequences, leader scopes, command palette entries, keymap contributions, user overrides, and extension contribution manifests.

CLI 必须定义 vi-inspired composition model，由显式 modes、可组合 actions、类型化 targets、可选 counts、可重复 commands、多键序列、leader scopes、command palette entries、keymap contributions、user overrides 和 extension contribution manifests 组成。

#### Scenario: Modes are explicit state / Mode 是显式状态

- **WHEN** the CLI enters prompt editing, normal navigation, raw-key navigation, command entry, search entry, approval, selection, or result-list interaction
- **THEN** the active mode is represented explicitly and renderer/input behavior is derived from that mode
- **中文** 当 CLI 进入 prompt editing、normal navigation、raw-key navigation、command entry、search entry、approval、selection 或 result-list interaction 时，active mode 必须显式表示，renderer/input 行为必须从该 mode 派生。

#### Scenario: Actions target structured objects / Action 作用于结构化对象

- **WHEN** a user invokes an action such as open, inspect, copy, retry, explain, diff, apply, revert, search, narrow, expand, accept, deny, scroll, focus-panel, preview, or plugin-action
- **THEN** the action resolves against typed targets such as message, turn, file reference, diff hunk, diagnostic, command, session, task, approval request, extension, plugin contribution, panel, or result-list item
- **中文** 当用户调用 open、inspect、copy、retry、explain、diff、apply、revert、search、narrow、expand、accept、deny、scroll、focus-panel、preview 或 plugin-action 等 action 时，该 action 必须解析到 message、turn、file reference、diff hunk、diagnostic、command、session、task、approval request、extension、plugin contribution、panel 或 result-list item 等类型化 target。

### Requirement: Raw-Key Mode Is Optional / Raw-Key Mode 可选

Raw terminal key handling SHALL be an optional renderer/input profile over the same action model, not a prerequisite for vi-inspired navigation, and SHALL provide professional-mode evidence before being counted as product-complete.

Raw terminal key handling 必须是同一 action model 上的可选 renderer/input profile，而不是 vi-inspired navigation 的前置条件；且在被计为 product-complete 前必须提供 professional-mode evidence。

#### Scenario: Slash controls preserve semantics / Slash 控制保留语义
- **WHEN** raw key handling is unavailable or disabled
- **THEN** slash-driven controls still update active target, result-list focus, reference sets, jump history, plugin contribution focus, and diagnostics with identical structured action results
- **中文** 当 raw key handling 不可用或被禁用时，slash-driven controls 仍必须以相同 structured action results 更新 active target、result-list focus、reference sets、jump history、plugin contribution focus 与 diagnostics。

#### Scenario: Keymap profile declares mode support / Keymap Profile 声明 Mode 支持
- **WHEN** a keymap contribution is registered
- **THEN** it declares the interaction/composition modes where the binding is valid, whether it participates in raw or line input, and receives deterministic conflict diagnostics when overlapping with another binding
- **中文** 当 keymap contribution 被注册时，必须声明该 binding 有效的 interaction/composition modes、是否参与 raw 或 line input，并在与其他 binding 重叠时收到确定性 conflict diagnostics。

## ADDED Requirements

### Requirement: Professional Vi Key Grammar / 专业 Vi 快捷键 Grammar

The vi-inspired composition layer SHALL parse count prefixes, multi-key sequences, leader scopes, command/search entry, and Escape cancellation as typed local grammar state.

Vi-inspired composition layer 必须将 count prefixes、多键序列、leader scopes、command/search entry 与 Escape cancellation 解析为类型化 local grammar state。

#### Scenario: Count prefix applies to navigation / Count 前缀应用于导航

- **WHEN** a user enters a count followed by a supported navigation action such as `5j`, `3k`, `10G`, or `2Ctrl+d`
- **THEN** action resolution applies the bounded count deterministically, records the count in action evidence, and clamps movement at list/scroll boundaries
- **中文** 当用户输入 count 后接支持的 navigation action，如 `5j`、`3k`、`10G` 或 `2Ctrl+d` 时，action resolution 必须确定性应用有界 count，在 action evidence 中记录 count，并在 list/scroll 边界处 clamp movement。

#### Scenario: Leader namespace routes plugins / Leader 命名空间路由插件

- **WHEN** a plugin registers leader-prefixed bindings
- **THEN** those bindings are namespaced by plugin id or configured alias, appear in key help, and cannot shadow core safety bindings unless a user override explicitly allows it
- **中文** 当 plugin 注册 leader-prefixed bindings 时，这些 bindings 必须按 plugin id 或配置别名 namespaced，显示在 key help 中，且不得覆盖 core safety bindings，除非 user override 显式允许。
