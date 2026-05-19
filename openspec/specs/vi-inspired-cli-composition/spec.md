# vi-inspired-cli-composition Specification

## Purpose
TBD - created by archiving change split-cli-host-and-architecture-scale-guardrails. Update Purpose after archive.
## Requirements
### Requirement: Vi-Inspired Composition Model / Vi 启发式组合模型

The CLI SHALL model vi-inspired interactions as typed actions and targets that can drive result-list navigation, command execution, references, and TUI workbench panel focus without relying on prompt text. Workbench focus actions MUST remain local and deterministic.

CLI 必须将 vi-inspired interactions 建模为 typed actions 与 targets，可驱动 result-list navigation、command execution、references 与 TUI workbench panel focus，且不依赖 prompt text。Workbench focus actions 必须保持本地且确定性。

#### Scenario: Vi keys drive workbench focus

- **WHEN** a compatible TUI dispatches panel navigation keys
- **THEN** the focused panel changes through typed local state, command bar and inspector projections update, and model-visible commands remain unchanged
- **中文** 当兼容 TUI 分发 panel navigation keys 时，focused panel 必须通过 typed local state 改变，command bar 与 inspector projections 必须更新，model-visible commands 保持不变。

#### Scenario: Existing result-list actions keep working

- **WHEN** the focused panel is a result list and the user dispatches j, k, gg, G, Enter, or reference actions
- **THEN** existing vi-inspired result-list behavior remains deterministic and compatible with palette references and jump history
- **中文** 当 focused panel 是 result list 且用户触发 j、k、gg、G、Enter 或 reference actions 时，既有 vi-inspired result-list 行为必须保持确定性，并兼容 palette references 与 jump history。

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

### Requirement: Palette And Result-List Actions Use Composition Model / 面板与结果列表动作使用组合模型

The vi-inspired CLI composition model SHALL expose command palette entries and result-list actions as typed actions over typed targets, reference sets, and jump history.

Vi-inspired CLI composition model 必须把 command palette entries 和 result-list actions 暴露为 typed actions over typed targets、reference sets 和 jump history。

#### Scenario: Palette entry target is structured / 面板条目 Target 结构化
- **WHEN** a command palette entry is created from a composition record
- **THEN** its action and target fields reference typed CLI targets instead of rendered command prose
- **中文** 当 command palette entry 从 composition record 创建时，其 action 和 target fields 必须引用 typed CLI targets，而不是 rendered command prose。

#### Scenario: Result-list action updates shared state / 结果列表动作更新共享状态
- **WHEN** a vi-style action navigates or acts on a result-list item
- **THEN** the composition snapshot records active target, result-list focus, reference set updates, and jump history changes as structured state
- **中文** 当 vi-style action 导航或操作 result-list item 时，composition snapshot 必须以结构化状态记录 active target、result-list focus、reference set updates 和 jump history changes。

### Requirement: Full Vim Emulation Remains Deferred / 完整 Vim 模拟继续延后

The vi-inspired profile SHALL remain a keymap/action profile and SHALL NOT require Vim buffers, registers, macros, marks, visual mode, or text-object semantics.

Vi-inspired profile 必须保持为 keymap/action profile，不得要求 Vim buffers、registers、macros、marks、visual mode 或 text-object semantics。

#### Scenario: Unsupported Vim feature is out of scope / 不支持的 Vim 功能不进入范围
- **WHEN** a keymap or action request requires registers, macros, marks, visual mode, or text-object editing
- **THEN** the CLI records it as an unsupported profile capability rather than adding runtime/editor dependencies
- **中文** 当 keymap 或 action request 需要 registers、macros、marks、visual mode 或 text-object editing 时，CLI 必须将其记录为 unsupported profile capability，而不是增加 runtime/editor dependencies。

### Requirement: Slash-Driven Result Navigation Precedes Raw Mode / Slash 驱动结果导航先于 Raw Mode

The vi-inspired CLI composition rollout SHALL expose result-list navigation and reference updates through bounded local slash controls before requiring raw terminal key handling.

Vi-inspired CLI composition rollout 必须先通过有边界的本地 slash controls 暴露 result-list navigation 与 reference updates，再要求 raw terminal key handling。

#### Scenario: Slash command maps to vi-style action / Slash Command 映射到 Vi 风格 Action
- **WHEN** a user invokes a local slash navigation command such as `/palette next`
- **THEN** the command maps to the same typed action model used by vi-minimal keymap entries
- **中文** 当用户调用 `/palette next` 等本地 slash navigation command 时，该 command 必须映射到 vi-minimal keymap entries 使用的同一 typed action model。

#### Scenario: Raw-mode absence does not block composition / 缺少 Raw Mode 不阻塞组合模型
- **WHEN** the terminal does not support reliable raw key handling
- **THEN** the user can still navigate result lists and update reference sets through slash controls with the same state semantics
- **中文** 当 terminal 不支持可靠 raw key handling 时，用户仍必须能通过 slash controls 导航 result lists 并更新 reference sets，且 state semantics 一致。

### Requirement: Revert Preview Has A CLI Surface / 回退预览拥有 CLI Surface

The vi-inspired composable `revert` action SHALL be available through explicit CLI preview controls before any mutating revert/apply command is exposed.

Vi-inspired 可组合 `revert` action 必须先通过显式 CLI preview controls 可用，然后才能暴露任何会修改状态的 revert/apply command。

#### Scenario: Revert target is explicit / 回退 Target 显式化
- **WHEN** a user requests a revert preview
- **THEN** the CLI requires an explicit request, turn, session, or path target and renders the resolved target as structured data
- **中文** 当用户请求 revert preview 时，CLI 必须要求显式 request、turn、session 或 path target，并将 resolved target 渲染为结构化数据。

#### Scenario: Preview precedes mutation / 预览先于修改
- **WHEN** only revert preview controls are implemented
- **THEN** the CLI must not expose a mutating revert command under the same surface
- **中文** 当仅实现 revert preview controls 时，CLI 不得在同一 surface 下暴露会修改状态的 revert command。

### Requirement: Session History Targets Are Selectable / Session History Target 可选择

The vi-inspired CLI composition model SHALL treat chat history turns as selectable typed targets for local navigation and revert preview.

Vi-inspired CLI composition model 必须将 chat history turns 作为可选择 typed targets，用于本地导航和 revert preview。

#### Scenario: History turn becomes target / History Turn 成为 Target
- **WHEN** a completed chat turn is added to local history
- **THEN** it can be addressed by index, turn id, `last`, or `current` and resolved into a typed turn target
- **中文** 当完成的 chat turn 被加入本地 history 时，必须能通过 index、turn id、`last` 或 `current` 寻址，并解析成 typed turn target。

#### Scenario: Revert current uses typed turn target / Revert Current 使用 Typed Turn Target
- **WHEN** the user invokes revert preview on `current`
- **THEN** the CLI resolves `current` to a typed turn target before calling checkpoint/session revert contracts
- **中文** 当用户对 `current` 调用 revert preview 时，CLI 必须先将 `current` 解析为 typed turn target，再调用 checkpoint/session revert contracts。

### Requirement: Reference Sets Are Inspectable And Focusable / 引用集可查看且可聚焦

The vi-inspired CLI composition model SHALL allow users to inspect structured reference sets and switch active reference focus without losing existing reference items.

Vi-inspired CLI composition model 必须允许用户查看结构化 reference sets，并在不丢失现有 reference items 的情况下切换 active reference focus。

#### Scenario: User inspects active references / 用户查看当前引用

- **WHEN** a user asks to list active references
- **THEN** the CLI renders reference set ids, labels, active item ids, item ids, item labels, target ids, provenance, ordering, and redaction metadata without raw file content
- **中文** 当用户请求列出 active references 时，CLI 必须渲染 reference set ids、labels、active item ids、item ids、item labels、target ids、provenance、ordering 和 redaction metadata，且不包含 raw file content。

#### Scenario: User focuses a reference item / 用户聚焦引用项

- **WHEN** a user focuses a reference by reference id, index, target id, or `current`
- **THEN** the CLI updates active reference focus and active target while preserving all existing reference items
- **中文** 当用户通过 reference id、index、target id 或 `current` 聚焦 reference 时，CLI 必须更新 active reference focus 与 active target，并保留所有已有 reference items。

#### Scenario: Focus failure is typed / 聚焦失败类型化

- **WHEN** a user focuses a reference selector that does not resolve
- **THEN** the CLI returns a typed diagnostic and preserves the prior reference set state
- **中文** 当用户聚焦无法解析的 reference selector 时，CLI 必须返回 typed diagnostic，并保留之前的 reference set state。

### Requirement: Reference Sets Project To Prompt-Turn Context / 引用集投影到 Prompt Turn 上下文

The vi-inspired CLI composition model SHALL project focused reference sets into prompt-turn context metadata before runtime/model execution.

Vi-inspired CLI composition model 必须在 runtime/model execution 前，将已聚焦的 reference sets 投影为 prompt-turn context metadata。

#### Scenario: Active reference focus is preserved / 当前引用焦点被保留

- **WHEN** a prompt turn is submitted with reference sets
- **THEN** the projected context metadata preserves active reference set id, active item id, item ordering, item targets, and provenance
- **中文** 当 prompt turn 携带 reference sets 提交时，投影出的 context metadata 必须保留 active reference set id、active item id、item ordering、item targets 与 provenance。

#### Scenario: Projection is metadata-only / 投影仅为元数据

- **WHEN** reference sets are projected into a prompt turn
- **THEN** the projection carries metadata needed to resolve references later and does not inline file contents or command output text
- **中文** 当 reference sets 被投影到 prompt turn 中时，该投影必须只携带后续解析 references 所需的 metadata，不内联 file contents 或 command output text。

### Requirement: File References Are First-Class Reference Items / 文件引用是一等引用项

The vi-inspired CLI composition model SHALL represent user-added file paths as file reference items that can be inspected, focused, and projected later without immediate content reads.

Vi-inspired CLI composition model 必须将用户添加的 file paths 表示为 file reference items，可被 inspect、focus，并在后续投影，而不会立即读取内容。

#### Scenario: File reference item preserves path target / 文件引用项保留 Path Target

- **WHEN** a user adds a file path to references
- **THEN** the reference item stores `kind=file`, a structured target with path metadata, display label, provenance, order, and redaction metadata
- **中文** 当用户将 file path 加入 references 时，该 reference item 必须保存 `kind=file`、带 path metadata 的 structured target、display label、provenance、order 与 redaction metadata。

#### Scenario: File reference focus uses same reference model / 文件引用聚焦使用同一引用模型

- **WHEN** a user focuses a file reference by id, index, target id, or `current`
- **THEN** the existing reference focus behavior applies without reading file content or losing other reference items
- **中文** 当用户通过 id、index、target id 或 `current` 聚焦 file reference 时，必须复用现有 reference focus 行为，不读取文件内容，也不丢失其他 reference items。

### Requirement: File Search Results Are Navigable Targets / 文件搜索结果是可导航 Target

The vi-inspired CLI composition model SHALL represent workspace file search results as quickfix-style result-list items with typed `file` targets that can be navigated, focused, added to reference sets, and projected later.

Vi-inspired CLI composition model 必须将 workspace file search results 表示为 quickfix-style result-list items，且每个 item 带 typed `file` target，可被导航、聚焦、加入 reference sets，并在之后投影。

#### Scenario: File result item preserves file target / 文件结果项保留 File Target

- **WHEN** a file search result list is created
- **THEN** each result item stores a stable item id, display label, ordering, and a target with `kind=file` plus path metadata
- **中文** 当 file search result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering，以及包含 `kind=file` 与 path metadata 的 target。

#### Scenario: Add current file result creates file reference / 当前文件结果加入引用

- **WHEN** the user focuses a file result-list item and invokes `/palette refs add current`
- **THEN** the active reference set receives a `kind=file` reference item preserving the focused file target and path metadata, without reading file content
- **中文** 当用户聚焦 file result-list item 并调用 `/palette refs add current` 时，active reference set 必须收到保留该 file target 与 path metadata 的 `kind=file` reference item，且不读取 file content。

#### Scenario: File result navigation uses jump history / 文件结果导航使用 Jump History

- **WHEN** the user navigates between file result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 file result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。

### Requirement: Text Search Results Are Navigable Targets / 文本搜索结果是可导航 Target

The vi-inspired CLI composition model SHALL represent workspace text search matches as quickfix-style result-list items with typed file targets, line metadata, bounded preview text, and provenance that can be navigated, focused, added to reference sets, and projected later.

Vi-inspired CLI composition model 必须将 workspace text search matches 表示为 quickfix-style result-list items，且带 typed file targets、line metadata、有界 preview text 和 provenance，可被导航、聚焦、加入 reference sets，并在之后投影。

#### Scenario: Text result item preserves line metadata / 文本结果项保留行信息

- **WHEN** a text search result list is created
- **THEN** each result item stores a stable item id, display label, ordering, a `kind=file` target with path metadata, and metadata for line number, search text, preview, and search provider
- **中文** 当 text search result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering、带 path metadata 的 `kind=file` target，以及 line number、search text、preview 和 search provider metadata。

#### Scenario: Add current text result creates file reference / 当前文本结果加入文件引用

- **WHEN** the user focuses a text search result-list item and invokes `/palette refs add current`
- **THEN** the active reference set receives a `kind=file` reference item preserving the focused file target and line provenance, without reading additional file content
- **中文** 当用户聚焦 text search result-list item 并调用 `/palette refs add current` 时，active reference set 必须收到保留该 file target 与 line provenance 的 `kind=file` reference item，且不读取额外 file content。

#### Scenario: Text result navigation uses jump history / 文本结果导航使用 Jump History

- **WHEN** the user navigates between text search result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 text search result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。

### Requirement: Reference Sets Are Locally Mutable / 引用集可本地变更

The vi-inspired CLI composition model SHALL allow local reference sets to be removed, cleared, and replaced through typed controls while preserving structured targets, provenance, and prompt-turn boundaries.

Vi-inspired CLI composition model 必须允许通过类型化 controls 本地 remove、clear、replace reference sets，同时保留 structured targets、provenance 和 prompt-turn boundaries。

#### Scenario: Remove preserves deterministic focus / 移除后保持确定性焦点

- **WHEN** a reference item is removed from a reference set
- **THEN** the remaining items keep their relative ordering, the active reference focus moves to the next item at the same position or previous item if needed, and active target follows the new active reference when present
- **中文** 当 reference item 从 reference set 移除时，剩余 items 必须保持相对顺序，active reference focus 必须移动到同位置的下一项或必要时前一项，且 active target 在存在新 active reference 时跟随它。

#### Scenario: Clear removes prompt-turn references / 清空移除 Prompt Turn 引用

- **WHEN** reference sets are cleared locally
- **THEN** subsequent prompt-turn context projection receives no reference metadata until references are added again
- **中文** 当 reference sets 被本地清空时，后续 prompt-turn context projection 在重新添加 references 前不得收到 reference metadata。

#### Scenario: Replace current creates exact working set / 替换当前项创建精确工作集

- **WHEN** a focused result-list item replaces the active reference set
- **THEN** the resulting reference set contains exactly one item derived from the focused target and preserves target kind, path, line/search metadata, provenance, and ordering
- **中文** 当聚焦 result-list item 替换 active reference set 时，生成的 reference set 必须只包含一个由当前 target 派生的 item，并保留 target kind、path、line/search metadata、provenance 和 ordering。

### Requirement: PageIndex Recall Results Are Navigable Targets / PageIndex 回溯结果是可导航 Target

The vi-inspired CLI composition model SHALL represent PageIndex recall matches as quickfix-style result-list items with typed `turn` targets that can be navigated, focused, and used as local evidence targets.

Vi-inspired CLI composition model 必须将 PageIndex recall matches 表示为 quickfix-style result-list items，并带 typed `turn` targets，可被导航、聚焦，并作为本地 evidence targets 使用。

#### Scenario: Recall result item preserves turn target / 回溯结果项保留 Turn Target

- **WHEN** a PageIndex recall result list is created
- **THEN** each result item stores a stable item id, display label, ordering, and a target with `kind=turn`, `sessionId`, `turnId`, and metadata for page id, status, trace id, sequence, previews, and deterministic score
- **中文** 当 PageIndex recall result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering，以及包含 `kind=turn`、`sessionId`、`turnId`、page id、status、trace id、sequence、previews 与 deterministic score metadata 的 target。

#### Scenario: Recall navigation uses jump history / 回溯导航使用 Jump History

- **WHEN** the user navigates between recall result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 recall result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。

#### Scenario: Recall target remains evidence-only for projection / 回溯 Target 对 Projection 保持 Evidence-Only

- **WHEN** a recall result target is later used as a reference before turn/page projection is implemented
- **THEN** the target remains structured local evidence and MUST NOT be materialized into model-visible content by the CLI host
- **中文** 当 recall result target 在 turn/page projection 实现前被用作 reference 时，该 target 必须保持结构化本地 evidence，CLI host 不得将其物化为 model-visible content。

### Requirement: PageIndex Recall References Preserve Target Metadata / PageIndex 回溯引用保留 Target Metadata

The vi-inspired CLI composition model SHALL preserve PageIndex recall metadata when a recall result-list item becomes a reference item.

Vi-inspired CLI composition model 必须在 recall result-list item 成为 reference item 时保留 PageIndex recall metadata。

#### Scenario: Recall reference keeps page metadata / Recall 引用保留 Page Metadata

- **WHEN** a recall result-list item is added to the active reference set
- **THEN** the reference item target remains `kind=turn` and preserves page id, turn id, session id, status, trace id, prompt preview, assistant preview, score, ranking, semantic placeholder metadata, and redaction metadata
- **中文** 当 recall result-list item 被加入 active reference set 时，reference item target 必须保持 `kind=turn`，并保留 page id、turn id、session id、status、trace id、prompt preview、assistant preview、score、ranking、semantic placeholder metadata 与 redaction metadata。

### Requirement: Composition Modes Align With Interaction Modes / 组合模式对齐交互模式

The vi-inspired composition model SHALL map its local modes onto the canonical CLI interaction mode state machine.

Vi-inspired composition model 必须将其 local modes 映射到 canonical CLI interaction mode state machine。

#### Scenario: Result-list mode maps to interaction mode / Result-list Mode 映射到交互模式
- **WHEN** palette, search, PageIndex recall, diagnostics, approval queues, or revert previews create a navigable result list
- **THEN** the composition snapshot mode and canonical interaction mode both identify result-list behavior with the same active target and result-list id
- **中文** 当 palette、search、PageIndex recall、diagnostics、approval queues 或 revert previews 创建可导航 result list 时，composition snapshot mode 与 canonical interaction mode 必须都以相同 active target 与 result-list id 标识 result-list behavior。

#### Scenario: Command-entry mode stays local / Command-entry Mode 保持本地
- **WHEN** a user enters palette, keymap, mode, agent, or approval controls
- **THEN** the controls resolve through local composition actions and do not enter model-visible prompt history
- **中文** 当用户输入 palette、keymap、mode、agent 或 approval controls 时，这些 controls 必须通过 local composition actions 解析，不得进入 model-visible prompt history。

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

### Requirement: Basic TUI Uses Vi-Inspired Composition Frame / 基础 TUI 使用 Vi 启发式组合框架

The basic chat TUI SHALL treat mode, target, action, result-list, jump history, and reference set as the core interaction frame before adding plugin-contributed controls.

基础 chat TUI 必须将 mode、target、action、result-list、jump history 与 reference set 作为核心交互框架，然后再添加 plugin-contributed controls。

#### Scenario: Prompt shell exposes composition state / Prompt Shell 暴露组合状态

- **WHEN** the basic chat shell renders startup status or local control output
- **THEN** it identifies the active interaction/composition profile and keeps local commands mapped to typed actions or typed command results
- **中文** 当基础 chat shell 渲染 startup status 或 local control output 时，必须标识 active interaction/composition profile，并保持 local commands 映射到 typed actions 或 typed command results。

#### Scenario: Plugin controls are declarative follow-up / 插件控制是声明式后续工作

- **WHEN** future plugins add commands, actions, target resolvers, result-list providers, keymap entries, palette entries, or render hints
- **THEN** they must contribute through versioned declarative manifests and deterministic conflict diagnostics over the same vi-inspired composition model
- **中文** 当未来插件添加 commands、actions、target resolvers、result-list providers、keymap entries、palette entries 或 render hints 时，它们必须通过版本化声明式 manifests 和同一 vi-inspired composition model 上的确定性冲突诊断进行贡献。

#### Scenario: Plugins cannot bypass basic shell contracts / 插件不能绕过基础 Shell 契约

- **WHEN** a plugin-contributed interaction triggers executable work
- **THEN** the CLI must route it through typed command/action requests, policy, runtime, and audit paths, preserving structured output parity and terminal-profile degradation
- **中文** 当 plugin-contributed interaction 触发可执行工作时，CLI 必须通过 typed command/action requests、policy、runtime 与 audit paths 路由，并保留 structured output parity 与 terminal-profile degradation。

### Requirement: TUI Dispatch Uses Vi-Inspired Composition / TUI Dispatch 使用 Vi 启发式组合

The production TUI framework SHALL use the vi-inspired composition snapshot as the canonical local state for modes, active targets, result lists, reference sets, jump history, and contributions.

Production TUI framework 必须使用 vi-inspired composition snapshot 作为 modes、active targets、result lists、reference sets、jump history 与 contributions 的 canonical local state。

#### Scenario: Mode state maps to composition snapshot / Mode 状态映射到组合快照

- **WHEN** the TUI enters prompt, normal, command, approval, selection, or result-list behavior
- **THEN** the framework state and composition snapshot expose matching interaction mode and active target metadata
- **中文** 当 TUI 进入 prompt、normal、command、approval、selection 或 result-list behavior 时，framework state 与 composition snapshot 必须暴露一致的 interaction mode 与 active target metadata。

#### Scenario: Contributions are part of composition / Contributions 属于组合模型

- **WHEN** core, user, or plugin contributions are registered with the TUI framework
- **THEN** the accepted contributions are represented as composition contributions with source, kind, ids, priority, keymap or palette metadata, and diagnostics
- **中文** 当 core、user 或 plugin contributions 注册到 TUI framework 时，被接受的 contributions 必须以 composition contributions 表示，包含 source、kind、ids、priority、keymap 或 palette metadata 与 diagnostics。

### Requirement: Vim Emulation Still Does Not Block Production TUI / Vim 模拟不阻塞 Production TUI

The production TUI framework SHALL be complete as a vi-inspired action framework without requiring full Vim emulation.

Production TUI framework 必须作为 vi-inspired action framework 完整可用，但不得要求完整 Vim 模拟。

#### Scenario: Unsupported Vim feature is explicit diagnostic / 不支持的 Vim 功能是显式诊断

- **WHEN** a contribution or key dispatch requests registers, macros, marks, visual mode, text objects, or editor-buffer semantics
- **THEN** the framework records an unsupported capability diagnostic and preserves the prior TUI state
- **中文** 当 contribution 或 key dispatch 请求 registers、macros、marks、visual mode、text objects 或 editor-buffer semantics 时，framework 必须记录 unsupported capability diagnostic，并保留之前的 TUI state。

