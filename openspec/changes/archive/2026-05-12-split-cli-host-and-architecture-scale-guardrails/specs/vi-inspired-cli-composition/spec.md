## ADDED Requirements

### Requirement: Vi-Inspired Composition Model / Vi 启发式组合模型

The CLI SHALL define a vi-inspired composition model built from explicit modes, composable actions, typed targets, optional counts, repeatable commands, command palette entries, keymap contributions, and extension contribution manifests.

CLI 必须定义 vi-inspired composition model，由显式 modes、可组合 actions、类型化 targets、可选 counts、可重复 commands、command palette entries、keymap contributions 和 extension contribution manifests 组成。

#### Scenario: Modes are explicit state / Mode 是显式状态

- **WHEN** the CLI enters prompt editing, navigation, command entry, approval, selection, or result-list interaction
- **THEN** the active mode is represented explicitly and renderer/input behavior is derived from that mode
- **中文** 当 CLI 进入 prompt editing、navigation、command entry、approval、selection 或 result-list interaction 时，active mode 必须显式表示，renderer/input 行为必须从该 mode 派生。

#### Scenario: Actions target structured objects / Action 作用于结构化对象

- **WHEN** a user invokes an action such as open, inspect, copy, retry, explain, diff, apply, revert, search, narrow, expand, accept, or deny
- **THEN** the action resolves against typed targets such as message, turn, file reference, diff hunk, diagnostic, command, session, task, approval request, extension, or result-list item
- **中文** 当用户调用 open、inspect、copy、retry、explain、diff、apply、revert、search、narrow、expand、accept 或 deny 等 action 时，该 action 必须解析到 message、turn、file reference、diff hunk、diagnostic、command、session、task、approval request、extension 或 result-list item 等类型化 target。

### Requirement: Multi-File Reference Sets / 多文件引用集

The CLI SHALL model user-selected multi-file context as named reference sets rather than only as prompt text.

CLI 必须将用户选择的多文件上下文建模为命名 reference sets，而不能只作为 prompt text。

#### Scenario: User creates a reference set / 用户创建引用集

- **WHEN** a user adds files, directories, symbols, diagnostics, diffs, search results, prior messages, or tool evidence to the active CLI context
- **THEN** the CLI records a structured reference set with ids, display labels, provenance, ordering, and budget metadata
- **中文** 当用户把 files、directories、symbols、diagnostics、diffs、search results、prior messages 或 tool evidence 加入当前 CLI context 时，CLI 必须记录带 ids、display labels、provenance、ordering 和 budget metadata 的结构化 reference set。

#### Scenario: User switches reference focus / 用户切换引用焦点

- **WHEN** multiple reference sets or reference items are available
- **THEN** the user can switch the active focus without losing the prior set, and subsequent actions resolve against the current focus unless an explicit target is provided
- **中文** 当存在多个 reference sets 或 reference items 时，用户必须能切换 active focus 且不丢失之前的 set；后续 actions 默认解析到当前 focus，除非提供显式 target。

#### Scenario: Runtime receives structured context / Runtime 接收结构化上下文

- **WHEN** a prompt turn uses active references
- **THEN** the CLI passes structured context through shared command/runtime contracts rather than concatenating opaque file lists into host-only text
- **中文** 当 prompt turn 使用 active references 时，CLI 必须通过共享 command/runtime contracts 传递结构化 context，而不是把不透明文件列表拼接进 host-only 文本。

### Requirement: Quickfix-Style Result Lists / Quickfix 风格结果列表

The CLI SHALL represent diagnostics, search matches, test failures, code intelligence findings, tool results, and approval queues as ordered result lists that can be navigated and acted on.

CLI 必须将 diagnostics、search matches、test failures、code intelligence findings、tool results 和 approval queues 表示为可导航、可操作的有序 result lists。

#### Scenario: Result list supports navigation / 结果列表支持导航

- **WHEN** a command produces multiple actionable results across files or turns
- **THEN** the CLI creates or updates a result list with stable item ids, current item focus, source command, severity or type metadata, and navigation actions for next, previous, first, and last
- **中文** 当 command 产生跨文件或跨 turn 的多个可操作结果时，CLI 必须创建或更新 result list，包含 stable item ids、current item focus、source command、severity 或 type metadata，以及 next、previous、first、last 导航 actions。

#### Scenario: Result list item can become a target / 结果项可成为 Target

- **WHEN** the user selects a result-list item
- **THEN** the item can be used as a typed target for actions such as open, inspect, explain, apply, retry, copy, or add-to-reference-set
- **中文** 当用户选择 result-list item 时，该 item 必须能作为 open、inspect、explain、apply、retry、copy 或 add-to-reference-set 等 actions 的类型化 target。

### Requirement: Jump History / 跳转历史

The CLI SHALL maintain a jump history for navigation between files, references, messages, diffs, approvals, result-list items, and sessions.

CLI 必须维护 jump history，用于在 files、references、messages、diffs、approvals、result-list items 和 sessions 之间导航。

#### Scenario: Navigation records jumps / 导航记录 Jump

- **WHEN** the user navigates from one target to another through search, diagnostics, result lists, reference sets, command output, or session history
- **THEN** the CLI records a jump entry with source target, destination target, timestamp, and provenance
- **中文** 当用户通过 search、diagnostics、result lists、reference sets、command output 或 session history 从一个 target 导航到另一个 target 时，CLI 必须记录包含 source target、destination target、timestamp 和 provenance 的 jump entry。

#### Scenario: Back and forward are structured / 前进后退是结构化操作

- **WHEN** the user invokes back or forward navigation
- **THEN** the CLI resolves the destination from jump history and updates focus without re-running the underlying tool or runtime action unless explicitly requested
- **中文** 当用户调用 back 或 forward navigation 时，CLI 必须从 jump history 解析 destination 并更新 focus，不得重新运行底层 tool 或 runtime action，除非用户显式要求。

### Requirement: Request Revert As A Composable Action / 请求回退作为可组合 Action

The CLI SHALL expose reverting a previous request or turn as a composable action over typed request, turn, result-list, or session targets.

CLI 必须将回退之前的 request 或 turn 暴露为作用于类型化 request、turn、result-list 或 session targets 的可组合 action。

#### Scenario: User reverts selected turn / 用户回退选中的 Turn

- **WHEN** the user invokes the revert action on a selected request, turn, message, result-list item, or session-history target
- **THEN** the CLI resolves the target to a structured request/turn id and submits a governed revert command through checkpoint/session contracts
- **中文** 当用户对选中的 request、turn、message、result-list item 或 session-history target 调用 revert action 时，CLI 必须将 target 解析为结构化 request/turn id，并通过 checkpoint/session contracts 提交受治理的 revert command。

#### Scenario: User previews request revert / 用户预览请求回退

- **WHEN** the user asks to preview reverting a previous request
- **THEN** the CLI renders a dry-run summary of affected checkpoints, files, session events, context projections, stale restore risks, and non-reversible effects without mutating workspace files
- **中文** 当用户请求预览回退之前的 request 时，CLI 必须渲染 dry-run summary，包含受影响 checkpoints、files、session events、context projections、stale restore risks 和不可自动回退 effects，且不修改 workspace files。

#### Scenario: Revert is not transcript deletion / Revert 不是删除记录

- **WHEN** a previous request is reverted
- **THEN** original request, model output, tool evidence, approval decisions, and audit records remain addressable while a new revert event marks the compensated effects
- **中文** 当之前的 request 被回退时，原始 request、model output、tool evidence、approval decisions 和 audit records 必须仍可寻址，同时通过新的 revert event 标记已补偿 effects。

### Requirement: Extension Contributions Stay Declarative / 扩展贡献保持声明式

User and plugin extensions SHALL contribute CLI interaction behavior through declarative manifests and typed contribution points rather than by mutating CLI or runtime internals.

用户和 plugin 扩展必须通过声明式 manifests 和类型化 contribution points 贡献 CLI 交互行为，不得修改 CLI 或 runtime internals。

#### Scenario: Plugin contributes interaction points / 插件贡献交互点

- **WHEN** a plugin adds CLI interactions
- **THEN** it declares commands, actions, target resolvers, result-list providers, keymap entries, command palette entries, or render hints through versioned contribution contracts
- **中文** 当 plugin 增加 CLI interactions 时，必须通过版本化 contribution contracts 声明 commands、actions、target resolvers、result-list providers、keymap entries、command palette entries 或 render hints。

#### Scenario: Contribution conflicts are deterministic / 贡献冲突确定化

- **WHEN** multiple core, user, or plugin contributions define overlapping commands, actions, keybindings, target resolvers, or palette entries
- **THEN** the CLI resolves conflicts using deterministic precedence rules and exposes discoverable conflict diagnostics
- **中文** 当多个 core、user 或 plugin contributions 定义重叠 commands、actions、keybindings、target resolvers 或 palette entries 时，CLI 必须使用确定性优先级规则解决冲突，并暴露可发现的 conflict diagnostics。

#### Scenario: Extensions cannot bypass execution contracts / 扩展不能绕过执行契约

- **WHEN** an extension-contributed interaction triggers executable work
- **THEN** the CLI converts it into a typed command/action request routed through shared contracts, policy, runtime, and audit paths
- **中文** 当 extension-contributed interaction 触发可执行工作时，CLI 必须将其转换成类型化 command/action request，并通过共享 contracts、policy、runtime 和 audit paths 路由。

### Requirement: Vim Emulation Is Deferred / Vim 模拟延后

The initial vi-inspired CLI composition work SHALL NOT require full Vim emulation.

初始 vi-inspired CLI composition 工作不得要求完整 Vim 模拟。

#### Scenario: Keybindings are a profile, not the model / 快捷键是 Profile 而非模型

- **WHEN** vi-like keys are enabled
- **THEN** they map onto the composition model's modes, actions, targets, reference sets, result lists, and jump history without making Vim-specific behavior a runtime dependency
- **中文** 当 vi-like keys 启用时，它们必须映射到 composition model 的 modes、actions、targets、reference sets、result lists 和 jump history，不得让 Vim-specific behavior 成为 runtime dependency。

#### Scenario: Advanced Vim features remain out of scope / 高级 Vim 功能不在范围内

- **WHEN** macros, registers, marks, visual mode, exact editor buffers, or full text-object semantics are requested during this change
- **THEN** they are recorded as follow-up rich CLI input work rather than accepted as implementation scope
- **中文** 当本变更期间提出 macros、registers、marks、visual mode、精确 editor buffers 或完整 text-object semantics 时，必须记录为后续 rich CLI input 工作，而不是纳入当前实现范围。
