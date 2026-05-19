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

### Requirement: Workbench state carries plugin execution records
Chat TUI workbench state SHALL carry a bounded list of recent plugin execution records.

Chat TUI workbench state 必须携带有界 recent plugin execution records 列表。

#### Scenario: Recent executions are bounded
- **WHEN** multiple plugin executions are attached to TUI state
- **THEN** only the most recent bounded set is retained and rendered, preserving deterministic order
- **中文** 当多个 plugin executions 附加到 TUI state 时，只保留并渲染最近的有界集合，并保持确定性顺序。

### Requirement: Workbench result lists update from plugin executions
Chat TUI workbench composition SHALL include result lists produced by plugin executions.

Chat TUI workbench composition 必须包含 plugin executions 产生的 result lists。

#### Scenario: Plugin result list becomes active
- **WHEN** a plugin execution record contains a result list
- **THEN** that list is placed before stale lists and its active item becomes the workbench active target when available
- **中文** 当 plugin execution record 包含 result list 时，该列表必须置于旧列表之前，并在可用时将 active item 设为 workbench active target。

### Requirement: Workbench activity reflects plugin execution
Chat TUI workbench activity feed SHALL include recent plugin execution status alongside turns, diagnostics, reasoning, focus, command bar, and plugin readiness activity.

Chat TUI workbench activity feed 必须在 turns、diagnostics、reasoning、focus、command bar 与 plugin readiness activity 旁边展示最近 plugin execution status。

#### Scenario: Failed or denied plugin execution is visible
- **WHEN** a plugin execution fails, is denied, or is deferred
- **THEN** the activity feed reports a warning or blocked status and the inspector can surface diagnostics
- **中文** 当 plugin execution 失败、被拒绝或 deferred 时，activity feed 必须报告 warning 或 blocked status，并且 inspector 可以展示 diagnostics。

### Requirement: Navigation slash results project into TUI result lists
The chat TUI SHALL project local `/file` and `/jump` result lists into the active composition so vi-style result navigation and reference actions can continue from those results.

Chat TUI 必须将本地 `/file` 与 `/jump` result lists 投影到 active composition，使 vi-style result navigation 与 reference actions 可以继续作用于这些结果。

#### Scenario: File slash result enters result-list mode
- **WHEN** `/file list <query>`, `/file preview <path|query>`, or `/file refs <query>` returns a result list
- **THEN** the chat TUI enters result-list mode with that list active and available to navigation/reference actions
- **中文** 当 `/file list <query>`、`/file preview <path|query>` 或 `/file refs <query>` 返回 result list 时，chat TUI 必须进入 result-list mode，并将该 list 设为 active 且可被 navigation/reference actions 使用。

#### Scenario: Jump slash result enters result-list mode
- **WHEN** `/jump file <query>`, `/jump text <query>`, or `/jump symbol <query>` returns a result list
- **THEN** the chat TUI enters result-list mode with the returned jump result active
- **中文** 当 `/jump file <query>`、`/jump text <query>` 或 `/jump symbol <query>` 返回 result list 时，chat TUI 必须进入 result-list mode，并激活返回的 jump result。

#### Scenario: Symbol jump remains inspectable
- **WHEN** `/jump symbol <query>` returns a code-intelligence result list
- **THEN** the chat TUI keeps the symbol targets visible as the active result and exposes provider diagnostics through the inspector when present
- **中文** 当 `/jump symbol <query>` 返回 code-intelligence result list 时，chat TUI 必须将 symbol targets 作为 active result 保持可见，并在存在 provider diagnostics 时通过 inspector 暴露。

### Requirement: Navigation slash commands are searchable in the TUI command bar
The chat TUI command bar SHALL expose file manager and jump navigator slash commands as built-in searchable suggestions.

Chat TUI command bar 必须将 file manager 与 jump navigator slash commands 暴露为 built-in searchable suggestions。

#### Scenario: File command search returns file workflows
- **WHEN** the command bar query contains `file`
- **THEN** suggestions include file manager slash workflows such as `/file list` and `/file preview`
- **中文** 当 command bar query 包含 `file` 时，suggestions 必须包含 `/file list` 与 `/file preview` 等 file manager slash workflows。

#### Scenario: Jump command search returns jump workflows
- **WHEN** the command bar query contains `jump`
- **THEN** suggestions include jump navigator slash workflows such as `/jump file`, `/jump text`, and `/jump symbol`
- **中文** 当 command bar query 包含 `jump` 时，suggestions 必须包含 `/jump file`、`/jump text` 与 `/jump symbol` 等 jump navigator slash workflows。

#### Scenario: Startup command bar remains bounded
- **WHEN** the command bar opens with an empty query
- **THEN** the default suggestions remain bounded and still include existing core guidance for help, context, history, and reasoning
- **中文** 当 command bar 以空 query 打开时，默认 suggestions 必须保持有界，并继续包含 help、context、history 与 reasoning 等既有 core guidance。

### Requirement: Command bar query editing is local and deterministic
The chat TUI workbench SHALL update command bar query text from local keyboard input without dispatching to the model.

Chat TUI workbench 必须通过本地键盘输入更新 command bar query text，且不得 dispatch 到模型。

#### Scenario: Printable input filters suggestions
- **WHEN** the command bar is focused and open and the user types printable characters
- **THEN** the workbench updates `commandBar.query`, re-projects filtered suggestions, and keeps the active suggestion deterministic
- **中文** 当 command bar focused 且 open，用户输入 printable characters 时，workbench 必须更新 `commandBar.query`、重新投影 filtered suggestions，并保持 active suggestion 确定性。

#### Scenario: Backspace edits query
- **WHEN** the command bar is focused and open and the user presses Backspace
- **THEN** the workbench removes one trailing query character and re-projects suggestions locally
- **中文** 当 command bar focused 且 open，用户按下 Backspace 时，workbench 必须移除 query 末尾一个字符，并在本地重新投影 suggestions。

### Requirement: Command bar suggestions are navigable
The chat TUI workbench SHALL support local keyboard navigation through visible command bar suggestions.

Chat TUI workbench 必须支持通过本地键盘在 visible command bar suggestions 中导航。

#### Scenario: Downward selection moves active suggestion
- **WHEN** the command bar is focused and open and the user presses ArrowDown, Ctrl+N, or Tab
- **THEN** the active suggestion moves to the next visible suggestion and wraps at the end
- **中文** 当 command bar focused 且 open，用户按下 ArrowDown、Ctrl+N 或 Tab 时，active suggestion 必须移动到下一个 visible suggestion，并在末尾 wrap。

#### Scenario: Upward selection moves active suggestion
- **WHEN** the command bar is focused and open and the user presses ArrowUp, Ctrl+P, Shift+Tab, BackTab, or S-Tab
- **THEN** the active suggestion moves to the previous visible suggestion and wraps at the start
- **中文** 当 command bar focused 且 open，用户按下 ArrowUp、Ctrl+P、Shift+Tab、BackTab 或 S-Tab 时，active suggestion 必须移动到上一个 visible suggestion，并在开头 wrap。

#### Scenario: Panel cycling remains outside command bar
- **WHEN** the command bar is not focused or not open
- **THEN** Tab and Shift+Tab retain existing panel cycling behavior
- **中文** 当 command bar 未 focused 或未 open 时，Tab 与 Shift+Tab 必须保留既有 panel cycling 行为。

### Requirement: Command bar suggestion acceptance is descriptor-only
The chat TUI workbench SHALL accept the active command bar suggestion as a local descriptor without executing the command, plugin action, shell command, or model request.

Chat TUI workbench 必须将 active command bar suggestion 接受为 local descriptor，且不得执行 command、plugin action、shell command 或 model request。

#### Scenario: Accepting a built-in suggestion returns a command preview
- **WHEN** the command bar is focused and open and the user presses Enter on a built-in slash suggestion
- **THEN** dispatch returns a local command result with the selected command name and preview text
- **中文** 当 command bar focused 且 open，用户在 built-in slash suggestion 上按 Enter 时，dispatch 必须返回包含 selected command name 与 preview text 的 local command result。

#### Scenario: Accepting a plugin suggestion returns a governed descriptor
- **WHEN** the command bar is focused and open and the user presses Enter on a plugin suggestion
- **THEN** dispatch returns a local command result that references the plugin command descriptor without granting direct host execution
- **中文** 当 command bar focused 且 open，用户在 plugin suggestion 上按 Enter 时，dispatch 必须返回引用 plugin command descriptor 的 local command result，且不得授予 direct host execution。

#### Scenario: Empty suggestions do not execute
- **WHEN** the command bar is focused and open and no visible suggestions match the query
- **THEN** Enter returns a local diagnostic and keeps the command bar open
- **中文** 当 command bar focused 且 open 且没有 visible suggestions 匹配 query 时，Enter 必须返回 local diagnostic 并保持 command bar open。

### Requirement: Accepted slash suggestions bridge to raw chat input
The chat TUI SHALL bridge accepted slash command bar suggestions into raw chat input as either submitted prompts or editable draft prefixes.

Chat TUI 必须将 accepted slash command bar suggestions 桥接到 raw chat input，形成 submitted prompts 或 editable draft prefixes。

#### Scenario: Complete slash suggestion submits immediately
- **WHEN** the raw command bar accepts a complete slash suggestion without required placeholders
- **THEN** the raw chat input reader yields that slash command as a prompt and closes the command bar
- **中文** 当 raw command bar 接受不含 required placeholders 的完整 slash suggestion 时，raw chat input reader 必须 yield 该 slash command 作为 prompt，并关闭 command bar。

#### Scenario: Incomplete slash suggestion fills draft prefix
- **WHEN** the raw command bar accepts a slash suggestion whose preview contains a placeholder
- **THEN** the raw chat input reader inserts the selected slash command plus one trailing space into the pending prompt buffer
- **中文** 当 raw command bar 接受 preview 含 placeholder 的 slash suggestion 时，raw chat input reader 必须将选中的 slash command 加一个尾随空格插入 pending prompt buffer。

#### Scenario: Draft prefix can be completed and submitted
- **WHEN** a draft prefix has been inserted from an accepted slash suggestion and the user types arguments followed by Enter
- **THEN** the raw chat input reader yields the completed slash prompt
- **中文** 当 accepted slash suggestion 已插入 draft prefix，且用户继续输入参数并按 Enter 时，raw chat input reader 必须 yield 完整 slash prompt。

### Requirement: Raw slash key preserves prompt text semantics
The chat TUI SHALL only intercept `/` for command bar opening when the raw prompt buffer is empty.

Chat TUI 只有在 raw prompt buffer 为空时，才可以拦截 `/` 来打开 command bar。

#### Scenario: Empty prompt opens command bar
- **WHEN** the raw prompt buffer is empty and the user presses `/`
- **THEN** the input bridge opens the command bar and does not add `/` to the prompt buffer
- **中文** 当 raw prompt buffer 为空且用户按 `/` 时，input bridge 必须打开 command bar，且不得将 `/` 加入 prompt buffer。

#### Scenario: Non-empty prompt keeps slash text
- **WHEN** the raw prompt buffer is not empty and the user presses `/`
- **THEN** the input bridge leaves `/` as normal prompt text
- **中文** 当 raw prompt buffer 非空且用户按 `/` 时，input bridge 必须将 `/` 保留为普通 prompt text。

### Requirement: Non-slash descriptors do not bypass governance
The chat TUI SHALL NOT convert non-slash or plugin command bar descriptors into raw chat prompts unless a governed execution bridge explicitly supports them.

Chat TUI 不得将 non-slash 或 plugin command bar descriptors 转成 raw chat prompts，除非已有明确的 governed execution bridge 支持它们。

#### Scenario: Plugin descriptor remains local
- **WHEN** the command bar accepts a plugin descriptor
- **THEN** the input bridge consumes the event locally without yielding a raw chat prompt or executing the plugin
- **中文** 当 command bar 接受 plugin descriptor 时，input bridge 必须在本地消费事件，不得 yield raw chat prompt，也不得执行 plugin。

### Requirement: Built-in plugin slash aliases bridge with input awareness
The chat TUI SHALL distinguish complete built-in plugin slash aliases from aliases that require arguments when accepting command bar suggestions.

Chat TUI 必须在接受 command bar suggestions 时，区分完整 built-in plugin slash aliases 与需要参数的 aliases。

#### Scenario: Plugin alias requiring arguments becomes draft prefix
- **WHEN** the command bar accepts a built-in plugin slash suggestion whose owner route metadata contains a placeholder fallback command
- **THEN** raw chat input inserts the selected slash alias plus one trailing space into the pending prompt buffer instead of submitting it
- **中文** 当 command bar 接受 owner route metadata 含 placeholder fallback command 的 built-in plugin slash suggestion 时，raw chat input 必须将所选 slash alias 加一个尾随空格插入 pending prompt buffer，而不是立即提交。

#### Scenario: Complete plugin alias submits as local slash prompt
- **WHEN** the command bar accepts a built-in plugin slash suggestion whose owner route metadata has no required placeholder
- **THEN** raw chat input submits that slash alias as a local chat prompt
- **中文** 当 command bar 接受 owner route metadata 不含 required placeholder 的 built-in plugin slash suggestion 时，raw chat input 必须将该 slash alias 作为 local chat prompt 提交。

### Requirement: Built-in plugin slash aliases execute locally after completion
The chat slash router SHALL handle supported first-party built-in plugin slash aliases through an injected owner-route alias registry and local owner subsystem handlers.

Chat slash router 必须通过注入式 owner-route alias registry 与本地 owner subsystem handlers 处理受支持的一方内置插件 slash aliases。

#### Scenario: Repo slash alias executes through repo navigator
- **WHEN** the user submits `/repo files <query>` or `/repo grep <query>` in chat
- **THEN** the CLI resolves the request through the repo navigator owner subsystem and projects any result list into TUI state
- **中文** 当用户在 chat 中提交 `/repo files <query>` 或 `/repo grep <query>` 时，CLI 必须通过 repo navigator owner subsystem 解析请求，并将可用 result list 投影到 TUI state。

#### Scenario: Git and checks slash aliases execute through owner subsystems
- **WHEN** the user submits `/git status`, `/git diff`, `/git review`, or a supported `/checks <action>` alias in chat
- **THEN** the CLI routes the request through the git review or developer checks owner subsystem without invoking plugin-private code
- **中文** 当用户在 chat 中提交 `/git status`、`/git diff`、`/git review` 或受支持的 `/checks <action>` alias 时，CLI 必须通过 git review 或 developer checks owner subsystem 路由请求，且不得调用 plugin-private code。

#### Scenario: Plugin aliases are injected rather than hard-coded
- **WHEN** a first-party plugin owner route exposes a slash alias
- **THEN** the chat slash router can match the longest slash alias from the injected registry without adding that business command name to the core router
- **中文** 当一方 plugin owner route 暴露 slash alias 时，chat slash router 必须能从注入式 registry 中匹配最长 slash alias，而无需将该业务 command name 加入 core router。

### Requirement: Executable plugin slash aliases rank before metadata entries
The chat TUI command bar SHALL rank executable plugin slash aliases before informational plugin palette metadata entries when both match the same query.

Chat TUI command bar 在 executable plugin slash aliases 与 informational plugin palette metadata entries 同时匹配 query 时，必须优先展示 executable plugin slash aliases。

#### Scenario: Repo query selects executable alias first
- **WHEN** the command bar query is `repo`
- **THEN** `/repo files <query>` is selectable before `Repo: Files` metadata inspection entries
- **中文** 当 command bar query 为 `repo` 时，`/repo files <query>` 必须排在 `Repo: Files` 等 metadata inspection entries 之前。

