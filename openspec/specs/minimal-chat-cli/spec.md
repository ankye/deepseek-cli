# minimal-chat-cli Specification

## Purpose

Defines the R1 minimal terminal chat shell for DeepSeek CLI. The shell is a host adapter over runtime/protocol events and must not become an independent execution engine.

定义 DeepSeek CLI 的 R1 最小终端 chat shell。该 shell 是 runtime/protocol events 之上的 host adapter，不得成为独立执行引擎。
## Requirements
### Requirement: Minimal Chat Shell Entry

The CLI SHALL provide a minimal chat shell entry for terminal users without changing existing run, readiness, or JSONL command behavior.

CLI 必须为终端用户提供最小 chat shell 入口，同时不得改变现有 run、readiness 或 JSONL command 行为。

#### Scenario: Explicit chat command starts shell

- **WHEN** a user runs `deepseek chat` in a supported terminal
- **THEN** the CLI starts a chat prompt loop using the CLI host adapter
- **中文** 当用户在支持的终端运行 `deepseek chat` 时，CLI 必须通过 CLI host adapter 启动 chat prompt loop。

#### Scenario: Run commands remain unchanged

- **WHEN** a user runs `deepseek run "hello"`
- **THEN** the CLI executes the existing run runtime path and does not start the chat prompt loop
- **中文** 当用户运行 `deepseek run "hello"` 时，CLI 必须执行现有 run runtime path，不得启动 chat prompt loop。

#### Scenario: Non-TTY no-arg usage does not block

- **WHEN** the CLI is invoked without arguments from a non-interactive input or output stream
- **THEN** it prints deterministic help or a structured usage error and exits without waiting for prompt input
- **中文** 当 CLI 在非交互式 input 或 output stream 中无参数启动时，必须输出确定性的 help 或 structured usage error，并在不等待 prompt input 的情况下退出。

### Requirement: Prompt Turns Use Kernel Events

Every non-command prompt submitted in the chat shell SHALL execute through the kernel-backed runtime event stream.

chat shell 中提交的每个非 command prompt 都必须通过 kernel-backed runtime event stream 执行。

#### Scenario: Prompt line becomes governed invocation

- **WHEN** the user submits a plain prompt line in the chat shell
- **THEN** the shell submits a governed runtime invocation and renders canonical runtime events from that invocation
- **中文** 当用户在 chat shell 中提交普通 prompt line 时，shell 必须提交 governed runtime invocation，并渲染该 invocation 的 canonical runtime events。

#### Scenario: Chat shell does not execute capabilities directly

- **WHEN** a prompt causes model, tool, command, policy, scheduler, sandbox, or capability work
- **THEN** the CLI obtains results from runtime/protocol events rather than directly calling executable primitives
- **中文** 当 prompt 触发 model、tool、command、policy、scheduler、sandbox 或 capability work 时，CLI 必须从 runtime/protocol events 获取结果，而不是直接调用 executable primitives。

### Requirement: Minimal Chat Controls

The chat shell SHALL support a bounded set of built-in controls for help, exit, clear, and cancellation, resolved locally through the command system without sending slash inputs to the model. The CLI SHALL also expose local read-only projections `/cost` and `/model` for transparency into the current turn and session.

chat shell 必须支持 help、exit、clear、cancellation 等有边界的内置控制，这些控制必须在本地经 command system 解析，不得把斜杠输入送给 model。CLI 还必须提供本地只读投影 `/cost` 与 `/model` 以暴露当前 turn 与 session 状态。

#### Scenario: Unknown slash stays local

- **WHEN** the user enters a `/` prefixed line that does not match any registered control
- **THEN** the shell prints a typed `unknown command` notice and continues the REPL without sending the line to the model or emitting any runtime event
- **中文** 当用户输入的 `/` 前缀行未匹配任何已注册 control 时，shell 必须打印 typed `unknown command` 提示并继续 REPL，不得把该行送给 model 或发出任何 runtime event。

#### Scenario: Help lists supported controls

- **WHEN** the user enters `/help`
- **THEN** the shell renders a deterministic list of supported controls and delegated commands including the CLI-local `/cost` and `/model`
- **中文** 当用户输入 `/help` 时，shell 必须渲染确定性的 supported controls 与 delegated commands 列表，包含 CLI 本地 `/cost` 与 `/model`。

#### Scenario: Cost reports current session usage

- **WHEN** the user enters `/cost` during chat
- **THEN** the shell renders the accumulated input tokens, output tokens, cost microdollars, and elapsed milliseconds for the active session, derived from `usage.updated` events already emitted by the runtime
- **中文** 当用户在 chat 中输入 `/cost` 时，shell 必须渲染当前 session 累计的 input tokens、output tokens、cost 微美分、elapsed 毫秒，数据来自 runtime 已发出的 `usage.updated` 事件。

#### Scenario: Model reports current profile

- **WHEN** the user enters `/model` during chat
- **THEN** the shell renders `model=<name> provider=<providerId>` from the active `AgentLoopRequest.profile`, without touching runtime or provider state
- **中文** 当用户在 chat 中输入 `/model` 时，shell 必须从当前 `AgentLoopRequest.profile` 渲染 `model=<name> provider=<providerId>`，不得触及 runtime 或 provider 状态。

### Requirement: Chat Rendering Is Event Based

Chat CLI output SHALL be produced by rendering canonical runtime/protocol events and command results, not by inspecting private runtime state.

chat CLI output 必须通过渲染 canonical runtime/protocol events 与 command results 产生，不得检查 private runtime state。

#### Scenario: Runtime event renders consistently

- **WHEN** chat and run modes receive equivalent runtime events
- **THEN** they render semantically equivalent text or JSONL output according to the selected output mode
- **中文** 当 chat 与 run modes 收到等价 runtime events 时，必须根据所选 output mode 渲染语义等价的 text 或 JSONL output。

#### Scenario: Error event remains structured

- **WHEN** a runtime invocation emits rejected, failed, cancelled, timeout, or policy-denied events
- **THEN** the chat shell renders the user-visible summary while preserving structured event data for traces and tests
- **中文** 当 runtime invocation 发出 rejected、failed、cancelled、timeout 或 policy-denied events 时，chat shell 必须渲染 user-visible summary，同时为 traces 与 tests 保留 structured event data。

### Requirement: Chat CLI Acceptance Evidence

The first chat CLI implementation SHALL provide deterministic acceptance evidence before archive.

第一个 chat CLI 实现必须在 archive 前提供确定性验收证据。

#### Scenario: Chat smoke covers prompt and exit

- **WHEN** e2e tests run the chat shell with scripted input containing a prompt and `/exit`
- **THEN** the CLI exits successfully and output includes runtime-derived response evidence
- **中文** 当 e2e tests 使用包含 prompt 与 `/exit` 的脚本化输入运行 chat shell 时，CLI 必须成功退出，且输出包含来自 runtime 的 response evidence。

#### Scenario: Chat golden trace covers parity

- **WHEN** the golden replay suite runs for a minimal chat prompt
- **THEN** normalized chat events match the expected run-compatible runtime event semantics
- **中文** 当 golden replay suite 运行最小 chat prompt 时，normalized chat events 必须匹配预期的 run-compatible runtime event semantics。

### Requirement: Chat Session Controls / Chat Session 控制

The minimal chat CLI SHALL expose session resume and fork-lite controls through structured command results.

minimal chat CLI 必须通过 structured command results 暴露 session resume 与 fork-lite controls。

#### Scenario: Resume control selects session / Resume 控制选择 session

- **WHEN** the user invokes a chat resume control with a session id
- **THEN** the CLI requests session resume through session/runtime contracts and uses the resumed session id for subsequent prompt turns
- **中文** 当用户使用 session id 调用 chat resume control 时，CLI 必须通过 session/runtime contracts 请求 session resume，并为后续 prompt turns 使用恢复后的 session id。

#### Scenario: Fork control selects child session / Fork 控制选择 child session

- **WHEN** the user invokes a chat fork control with a parent session id
- **THEN** the CLI requests fork-lite through session/runtime contracts and uses the child session id for subsequent prompt turns
- **中文** 当用户使用 parent session id 调用 chat fork control 时，CLI 必须通过 session/runtime contracts 请求 fork-lite，并为后续 prompt turns 使用 child session id。

#### Scenario: Session control failure is typed / Session 控制失败是类型化的

- **WHEN** resume or fork-lite fails in the chat CLI
- **THEN** the shell renders a structured command failure and keeps the previous active session selection unchanged
- **中文** 当 chat CLI 中 resume 或 fork-lite 失败时，shell 必须渲染 structured command failure，并保持之前的 active session selection 不变。

### Requirement: Scriptable Run Session Commands / 可脚本化 Run Session 命令

The CLI SHALL provide scriptable session commands for resume and fork-lite.

CLI 必须提供可脚本化的 session resume 与 fork-lite commands。

#### Scenario: Scriptable resume returns structured output / 可脚本化 resume 返回结构化输出

- **WHEN** a user runs a run session resume command with JSONL output
- **THEN** the CLI emits structured resume result metadata without requiring a chat terminal
- **中文** 当用户以 JSONL output 运行 run session resume command 时，CLI 必须输出 structured resume result metadata，且不需要 chat terminal。

#### Scenario: Scriptable fork returns child id / 可脚本化 fork 返回 child id

- **WHEN** a user runs a run session fork command with JSONL output
- **THEN** the CLI emits the child session id, parent id, fork point sequence, and redacted metadata
- **中文** 当用户以 JSONL output 运行 run session fork command 时，CLI 必须输出 child session id、parent id、fork point sequence 和 redacted metadata。

### Requirement: Chat Cancellation Controls / Chat 取消控制

The chat shell SHALL cancel the in-flight turn when the user types `/cancel` OR presses Ctrl+C, using the same `AbortSignal` path so both surfaces emit identical `agent.loop.cancelled` events.

chat shell 必须在用户输入 `/cancel` 或按 Ctrl+C 时取消正在进行的 turn，二者必须走同一个 `AbortSignal` 路径，发出相同的 `agent.loop.cancelled` 事件。

#### Scenario: First Ctrl+C cancels active turn

- **WHEN** the user presses Ctrl+C while a chat turn is streaming
- **THEN** the shell aborts the active turn, renders a `[cancelled]` line derived from the `agent.loop.cancelled` event, keeps the REPL open for the next prompt, and starts a 2-second double-tap window
- **中文** 当用户在 chat turn 流式输出中按 Ctrl+C 时，shell 必须取消当前 turn，根据 `agent.loop.cancelled` 事件渲染 `[cancelled]` 行，保留 REPL 等待下一条 prompt，并开启 2 秒双击窗口。

#### Scenario: Second Ctrl+C within window exits

- **WHEN** Ctrl+C is pressed again within 2 seconds of the first Ctrl+C, or is pressed while no turn is active
- **THEN** the shell shuts down runtime resources and exits with the same text-mode resume hint as a clean `/exit`
- **中文** 当 Ctrl+C 在第一次后 2 秒内再次按下，或在没有活跃 turn 时按下，shell 必须关闭 runtime 资源，并以与 `/exit` 相同的 text 模式 resume 提示退出。

#### Scenario: /cancel is equivalent to first Ctrl+C

- **WHEN** the user enters `/cancel` while a turn is active
- **THEN** the shell invokes the same cancellation path as the SIGINT handler, producing an `agent.loop.cancelled` event indistinguishable from the Ctrl+C-induced one (same `reason: "user-cancelled"` payload)
- **中文** 当用户在活跃 turn 时输入 `/cancel`，shell 必须走与 SIGINT handler 相同的取消路径，产生与 Ctrl+C 等价的 `agent.loop.cancelled` 事件（`reason: "user-cancelled"` 一致）。

#### Scenario: /cancel with no active turn is a no-op notice

- **WHEN** the user enters `/cancel` with no active turn
- **THEN** the shell prints `[chat] nothing to cancel` and returns to the prompt without touching runtime state
- **中文** 当用户无活跃 turn 时输入 `/cancel`，shell 必须打印 `[chat] nothing to cancel` 并返回提示符，不得改动 runtime 状态。

### Requirement: Chat Uses Terminal Profiles / Chat 使用终端 Profile

The chat CLI SHALL route input and rendering through terminal capability, input strategy, renderer profile, and vi-inspired composition contracts before adding richer terminal behavior.

chat CLI 在增加更丰富终端行为前，必须让 input 和 rendering 经过 terminal capability、input strategy、renderer profile 和 vi-inspired composition contracts。

#### Scenario: Chat render mode follows profile / Chat 渲染模式遵循 Profile

- **WHEN** the chat shell starts
- **THEN** it selects renderer and input behavior from the terminal profile and output mode rather than hard-coded TTY assumptions
- **中文** 当 chat shell 启动时，必须从 terminal profile 和 output mode 选择 renderer 与 input 行为，而不是依赖硬编码 TTY 假设。

#### Scenario: Vi-inspired controls stay local / Vi-inspired 控制保持本地

- **WHEN** chat uses vi-inspired modes, keymaps, reference sets, result lists, or jump navigation
- **THEN** those controls resolve to local command/action requests and never directly execute model, tool, policy, scheduler, sandbox, MCP, plugin, or runtime primitives
- **中文** 当 chat 使用 vi-inspired modes、keymaps、reference sets、result lists 或 jump navigation 时，这些控制必须解析为本地 command/action requests，且不得直接执行 model、tool、policy、scheduler、sandbox、MCP、plugin 或 runtime primitives。

#### Scenario: Unsupported terminal degrades cleanly / 不支持的终端干净降级

- **WHEN** the chat shell runs in CI, redirected IO, unknown terminal width, unsupported raw mode, no-color mode, or a terminal with unreliable interactive support
- **THEN** chat falls back to line/scripted input and plain/structured rendering while preserving prompt, command, cancellation, session, and runtime event semantics
- **中文** 当 chat shell 运行在 CI、redirected IO、unknown terminal width、不支持 raw mode、no-color mode 或 interactive support 不可靠的终端中时，chat 必须降级为 line/scripted input 和 plain/structured rendering，同时保持 prompt、command、cancellation、session 和 runtime event 语义。

### Requirement: Chat Approval Rendering / Chat 审批渲染

The chat CLI SHALL render approval and denial lifecycle records using the same event semantics as run mode.

chat CLI 必须使用与 run mode 相同的 event semantics 渲染 approval 与 denial 生命周期记录。

#### Scenario: Chat approval uses runtime events / Chat 审批使用 Runtime Events

- **WHEN** a chat turn emits an approval-required event
- **THEN** the chat shell renders the approval summary from the event and waits for a broker/control decision without directly executing the requested capability
- **中文** 当 chat turn 发出 approval-required event 时，chat shell 必须从该 event 渲染 approval summary，并等待 broker/control decision，不得直接执行被请求的 capability。

#### Scenario: Chat denial keeps session alive / Chat 拒绝后保持会话

- **WHEN** an approval-required chat invocation is denied, cancelled, or times out
- **THEN** chat renders the structured denial or cancellation summary, records the event in session history, and keeps the REPL available for the next prompt
- **中文** 当需要审批的 chat invocation 被 denied、cancelled 或 timeout 时，chat 必须渲染 structured denial 或 cancellation summary，将 event 记录到 session history，并保持 REPL 可用于下一条 prompt。

### Requirement: Chat Approval Controls Stay Local / Chat 审批控制保持本地

Chat approval controls SHALL be local command/action requests that resolve approval ids and submit decisions through the approval broker or protocol control path.

chat approval controls 必须是解析 approval ids 并通过 approval broker 或 protocol control path 提交 decisions 的本地 command/action requests。

#### Scenario: Unknown approval command stays local / 未知审批命令保持本地

- **WHEN** the user enters an unknown approval-related slash command during chat
- **THEN** the shell prints a typed local command failure and does not send the line to the model or execute runtime primitives
- **中文** 当用户在 chat 中输入未知 approval-related slash command 时，shell 必须打印 typed local command failure，且不得把该行送给 model 或执行 runtime primitives。

#### Scenario: Approval cancellation uses control path / 审批取消使用控制路径

- **WHEN** the user cancels a pending approval from chat
- **THEN** the shell submits a cancel decision through the approval control path and emits an approval-cancelled record correlated to the original approval id
- **中文** 当用户从 chat 取消 pending approval 时，shell 必须通过 approval control path 提交 cancel decision，并发出关联原始 approval id 的 approval-cancelled record。

### Requirement: CLI Usage Includes Palette Commands / CLI Usage 包含 Palette 命令

The CLI SHALL list scriptable palette commands in deterministic help output without treating them as chat prompts or model-visible slash commands.

CLI 必须在确定性的 help output 中列出可脚本化 palette commands，且不得将其视为 chat prompts 或 model-visible slash commands。

#### Scenario: Help lists palette commands / Help 列出 Palette 命令
- **WHEN** a user runs `deepseek --help`
- **THEN** usage output includes `palette list`, `palette keymap`, and `palette action` command forms
- **中文** 当用户运行 `deepseek --help` 时，usage output 必须包含 `palette list`、`palette keymap` 和 `palette action` 命令形式。

#### Scenario: Palette command does not start chat / Palette 命令不启动 Chat
- **WHEN** a user runs a `deepseek palette ...` command
- **THEN** the CLI routes it as a local scriptable command and does not start the chat prompt loop or submit a model request
- **中文** 当用户运行 `deepseek palette ...` 命令时，CLI 必须将其路由为本地脚本化命令，不得启动 chat prompt loop 或提交 model request。

### Requirement: Chat Local Palette Controls / Chat 本地 Palette 控制

The chat shell SHALL expose local palette and keymap slash controls that reuse typed palette projection and action resolution without sending those slash inputs to the model.

Chat shell 必须暴露本地 palette 与 keymap slash controls，复用 typed palette projection 与 action resolution，且不得把这些 slash inputs 发送给 model。

#### Scenario: Palette slash renders locally / Palette Slash 本地渲染
- **WHEN** the user enters `/palette` or `/palette list` during chat
- **THEN** the shell renders the command palette locally and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette` 或 `/palette list` 时，shell 必须本地渲染 command palette，且不提交 runtime/model request。

#### Scenario: Keymap slash renders locally / Keymap Slash 本地渲染
- **WHEN** the user enters `/keymap vi-minimal` during chat
- **THEN** the shell renders the vi-minimal keymap profile locally with deterministic diagnostics
- **中文** 当用户在 chat 中输入 `/keymap vi-minimal` 时，shell 必须本地渲染 vi-minimal keymap profile，并包含确定性 diagnostics。

#### Scenario: Palette action slash is dry-run / Palette Action Slash 是 Dry Run
- **WHEN** the user enters `/palette action inspect <target-id>` during chat
- **THEN** the shell resolves the action as a dry-run typed action result without mutating workspace, sessions, checkpoints, or executing command owners
- **中文** 当用户在 chat 中输入 `/palette action inspect <target-id>` 时，shell 必须将 action 解析为 dry-run typed action result，且不修改 workspace、sessions、checkpoints 或执行 command owners。

#### Scenario: Palette slash failure is typed / Palette Slash 失败类型化
- **WHEN** the user enters `/palette action inspect <unknown-target-id>` during chat
- **THEN** the shell emits a typed local command failure or typed palette action result rather than sending the line to the model
- **中文** 当用户在 chat 中输入 `/palette action inspect <unknown-target-id>` 时，shell 必须输出类型化 local command failure 或 typed palette action result，而不是把该行发送给 model。

#### Scenario: Help includes palette controls / Help 包含 Palette 控制
- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette`, `/palette action`, and `/keymap` among local controls
- **中文** 当用户输入 `/help` 时，shell 必须在 local controls 中列出 `/palette`、`/palette action` 和 `/keymap`。

### Requirement: Chat Palette Navigation State / Chat Palette 导航状态

The chat shell SHALL maintain local palette/result-list composition state across palette slash commands without sending those commands to the model or runtime.

Chat shell 必须跨 palette slash commands 维护本地 palette/result-list composition state，且不得把这些 commands 发送给 model 或 runtime。

#### Scenario: Palette navigation updates local focus / Palette 导航更新本地焦点
- **WHEN** the user enters `/palette next`, `/palette previous`, `/palette first`, or `/palette last` during chat
- **THEN** the shell resolves the action locally, updates the active result-list focus, renders the new focused target, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette next`、`/palette previous`、`/palette first` 或 `/palette last` 时，shell 必须本地解析 action、更新 active result-list focus、渲染新的 focused target，且不提交 runtime/model request。

#### Scenario: Palette state summarizes focus / Palette State 汇总焦点
- **WHEN** the user enters `/palette state`
- **THEN** the shell renders a deterministic summary containing mode, active target id, active result-list id, active item id, jump count, and reference count
- **中文** 当用户输入 `/palette state` 时，shell 必须渲染确定性摘要，包含 mode、active target id、active result-list id、active item id、jump count 和 reference count。

#### Scenario: Palette reference add uses current focus / Palette Reference Add 使用当前焦点
- **WHEN** the user enters `/palette refs add current`
- **THEN** the shell adds the focused result-list item to the active reference set through local action resolution and renders the updated reference count
- **中文** 当用户输入 `/palette refs add current` 时，shell 必须通过本地 action resolution 将当前聚焦 result-list item 加入 active reference set，并渲染更新后的 reference count。

#### Scenario: Palette navigation failures stay local / Palette 导航失败保持本地
- **WHEN** the user enters a malformed palette navigation or reference command
- **THEN** the shell emits a typed local failure and does not send the line to the model
- **中文** 当用户输入格式错误的 palette navigation 或 reference command 时，shell 必须输出类型化 local failure，且不得把该行发送给 model。

### Requirement: Chat Local Revert Preview / Chat 本地回退预览

The chat shell SHALL expose a local `/revert preview` control that renders request/turn/session revert preview results without sending the slash input to the model.

Chat shell 必须暴露本地 `/revert preview` control，渲染 request/turn/session revert preview results，且不得把 slash input 发送给 model。

#### Scenario: Chat revert preview stays local / Chat 回退预览保持本地
- **WHEN** the user enters `/revert preview --turn <turn-id>` during chat
- **THEN** the shell parses the target, renders a local structured revert preview result, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/revert preview --turn <turn-id>` 时，shell 必须解析 target、渲染本地结构化 revert preview result，且不提交 runtime/model request。

#### Scenario: Chat revert malformed input is local failure / Chat 回退格式错误是本地失败
- **WHEN** the user enters `/revert preview` without a target selector
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户输入没有 target selector 的 `/revert preview` 时，shell 必须输出 typed local failure，并保持 REPL 可用。

### Requirement: Chat Local Turn History / Chat 本地 Turn 历史

The chat shell SHALL maintain a local ordered history of completed prompt turns and expose it through local slash controls without sending history commands to the model.

Chat shell 必须维护已完成 prompt turns 的本地有序 history，并通过本地 slash controls 暴露，且不得把 history commands 发送给 model。

#### Scenario: History lists completed turns / History 列出已完成 Turns
- **WHEN** the user enters `/history` after one or more prompt turns
- **THEN** the shell renders deterministic local history entries with index, session id, turn id, status, trace id, selected marker, and redacted prompt preview
- **中文** 当用户在一个或多个 prompt turns 后输入 `/history` 时，shell 必须渲染确定性本地 history entries，包含 index、session id、turn id、status、trace id、selected marker 和脱敏 prompt preview。

#### Scenario: History select updates current target / History Select 更新当前 Target
- **WHEN** the user enters `/history select <turn-id|index|current|last>`
- **THEN** the shell updates the selected history turn locally and renders the selected entry
- **中文** 当用户输入 `/history select <turn-id|index|current|last>` 时，shell 必须本地更新 selected history turn，并渲染 selected entry。

#### Scenario: Empty history is typed local failure / 空 History 是类型化本地失败
- **WHEN** the user enters `/history select current` before any prompt turn completes
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户在任何 prompt turn 完成前输入 `/history select current` 时，shell 必须输出 typed local failure，并保持 REPL 可用。

### Requirement: Chat Revert Preview Current / Chat 当前回退预览

The chat shell SHALL resolve `/revert preview current` to the selected local history turn before invoking dry-run revert preview.

Chat shell 必须在调用 dry-run revert preview 前，将 `/revert preview current` 解析为选中的本地 history turn。

#### Scenario: Current revert preview uses selected turn / 当前回退预览使用选中 Turn
- **WHEN** the user enters `/revert preview current` after selecting or completing a history turn
- **THEN** the shell calls dry-run revert preview with the selected turn id and session id, renders a local revert preview result, and does not submit a runtime/model request
- **中文** 当用户在选择或完成 history turn 后输入 `/revert preview current` 时，shell 必须使用 selected turn id 与 session id 调用 dry-run revert preview、渲染本地 revert preview result，且不提交 runtime/model request。

#### Scenario: Current revert preview requires selected history / 当前回退预览需要选中 History
- **WHEN** the user enters `/revert preview current` before any history turn is selected
- **THEN** the shell emits a typed local failure rather than sending the line to the model
- **中文** 当用户在没有选中 history turn 前输入 `/revert preview current` 时，shell 必须输出 typed local failure，而不是把该行发送给 model。

### Requirement: Chat Local Revert Apply Current / Chat 本地当前回退执行

The chat shell SHALL expose a local `/revert apply current` control that resolves the selected local history turn to explicit session and turn ids before invoking revert apply.

Chat shell 必须暴露本地 `/revert apply current` control，并在调用 revert apply 前，将 selected local history turn 解析为显式 session id 与 turn id。

#### Scenario: Current revert apply uses selected turn / 当前回退执行使用选中 Turn

- **WHEN** the user enters `/revert apply current` after selecting or completing a history turn
- **THEN** the shell calls revert apply with `dryRun=false`, the selected turn id, and the selected session id, renders a local structured apply result, and does not submit a runtime/model request for the slash command
- **中文** 当用户在选择或完成 history turn 后输入 `/revert apply current` 时，shell 必须使用 `dryRun=false`、selected turn id 与 selected session id 调用 revert apply，渲染本地结构化 apply result，且不为该 slash command 提交 runtime/model request。

#### Scenario: Current revert apply requires selected history / 当前回退执行需要选中 History

- **WHEN** the user enters `/revert apply current` before any history turn is selected
- **THEN** the shell emits a typed local failure and does not send the line to the model
- **中文** 当用户在没有选中 history turn 前输入 `/revert apply current` 时，shell 必须输出 typed local failure，且不得把该行发送给 model。

#### Scenario: Help lists current revert apply / Help 列出当前回退执行

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/revert apply current` with the other local revert controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local revert controls 中列出 `/revert apply current`。

### Requirement: Chat Revert Review And Confirm / Chat 回退审阅与确认

The chat shell SHALL provide local revert review and confirm controls that separate interactive rollback impact review from mutation.

Chat shell 必须提供本地 revert review 与 confirm controls，将交互式 rollback impact review 与 mutation 分离。

#### Scenario: Review current creates pending confirmation / 审阅当前 Turn 创建待确认项

- **WHEN** the user enters `/revert review current` after selecting or completing a history turn
- **THEN** the shell resolves the selected turn to explicit session and turn ids, runs dry-run revert preview, stores a pending review id, renders the review impact summary, and does not submit a model request for the slash command
- **中文** 当用户在选择或完成 history turn 后输入 `/revert review current` 时，shell 必须将 selected turn 解析为显式 session id 与 turn id，运行 dry-run revert preview，保存 pending review id，渲染 review impact summary，且不为该 slash command 提交 model request。

#### Scenario: Confirm applies reviewed target / 确认执行已审阅 Target

- **WHEN** the user enters `/revert confirm <review-id|current>` for a pending review
- **THEN** the shell applies the pending review's explicit target through checkpoint restore safety checks, renders a structured confirmation result, and does not submit a model request for the slash command
- **中文** 当用户对 pending review 输入 `/revert confirm <review-id|current>` 时，shell 必须通过 checkpoint restore safety checks 对该 pending review 的显式 target 执行 apply，渲染结构化 confirmation result，且不为该 slash command 提交 model request。

#### Scenario: Confirm requires pending review / 确认需要待确认 Review

- **WHEN** the user enters `/revert confirm current` before creating a pending review
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户在创建 pending review 之前输入 `/revert confirm current` 时，shell 必须输出 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists review and confirm / Help 列出审阅与确认

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/revert review current` and `/revert confirm <review-id|current>` with the other local revert controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local revert controls 中列出 `/revert review current` 和 `/revert confirm <review-id|current>`。

### Requirement: Chat Palette Jump Controls / Chat Palette 跳转控制

The chat shell SHALL expose local `/palette back` and `/palette forward` controls that traverse palette jump history through typed action resolution without sending those slash inputs to the model or runtime.

Chat shell 必须暴露本地 `/palette back` 与 `/palette forward` controls，通过类型化 action resolution 遍历 palette jump history，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Palette back updates focus locally / Palette Back 本地更新焦点

- **WHEN** the user enters `/palette back` after palette navigation has recorded jump history
- **THEN** the shell resolves the action locally, updates active target and result-list focus from jump history, renders a structured action result and state summary, and does not submit a runtime/model request
- **中文** 当用户在 palette navigation 已记录 jump history 后输入 `/palette back` 时，shell 必须本地解析 action、基于 jump history 更新 active target 与 result-list focus、渲染结构化 action result 与 state summary，且不提交 runtime/model request。

#### Scenario: Palette forward updates focus locally / Palette Forward 本地更新焦点

- **WHEN** the user enters `/palette forward` after a prior `/palette back`
- **THEN** the shell resolves the action locally, moves the jump cursor forward, renders the restored focus, and does not submit a runtime/model request
- **中文** 当用户在 prior `/palette back` 后输入 `/palette forward` 时，shell 必须本地解析 action、将 jump cursor 前移、渲染恢复后的 focus，且不提交 runtime/model request。

#### Scenario: Empty jump traversal stays local / 空跳转遍历保持本地

- **WHEN** the user enters `/palette back` or `/palette forward` before a destination exists in that direction
- **THEN** the shell emits a typed palette action diagnostic or typed local failure and keeps the REPL available
- **中文** 当用户在对应方向没有 destination 前输入 `/palette back` 或 `/palette forward` 时，shell 必须输出 typed palette action diagnostic 或 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists jump controls / Help 列出跳转控制

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette back|forward` with other local palette controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local palette controls 中列出 `/palette back|forward`。

### Requirement: Chat Reference Set Controls / Chat 引用集控制

The chat shell SHALL expose local reference-set controls under `/palette refs` for listing and focusing active references without sending those slash inputs to the model or runtime.

Chat shell 必须在 `/palette refs` 下暴露本地 reference-set controls，用于 listing 与 focusing active references，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Chat lists references locally / Chat 本地列出引用

- **WHEN** the user enters `/palette refs list`
- **THEN** the shell renders deterministic reference set and item records from local composition state and does not submit a runtime/model request
- **中文** 当用户输入 `/palette refs list` 时，shell 必须从本地 composition state 渲染确定性的 reference set 与 item records，且不提交 runtime/model request。

#### Scenario: Chat focuses reference locally / Chat 本地聚焦引用

- **WHEN** the user enters `/palette refs focus <ref-id|index|target-id|current>` after references exist
- **THEN** the shell resolves the selector locally, updates active reference focus, renders the focused item and state summary, and does not submit a runtime/model request
- **中文** 当用户在已有 references 后输入 `/palette refs focus <ref-id|index|target-id|current>` 时，shell 必须本地解析 selector、更新 active reference focus、渲染 focused item 与 state summary，且不提交 runtime/model request。

#### Scenario: Empty reference focus stays local / 空引用聚焦保持本地

- **WHEN** the user enters `/palette refs focus current` before any reference exists
- **THEN** the shell emits a typed palette diagnostic or typed local failure and keeps the REPL available
- **中文** 当用户在没有 reference 前输入 `/palette refs focus current` 时，shell 必须输出 typed palette diagnostic 或 typed local failure，并保持 REPL 可用。

#### Scenario: Help lists reference controls / Help 列出引用控制

- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette refs list` and `/palette refs focus <ref-id|index|target-id|current>` with the other local palette controls
- **中文** 当用户输入 `/help` 时，shell 必须在其他 local palette controls 中列出 `/palette refs list` 和 `/palette refs focus <ref-id|index|target-id|current>`。

### Requirement: Chat Prompt Turns Carry Active References / Chat Prompt Turn 携带当前引用

The chat shell SHALL include active palette reference sets as structured `referenceContext` metadata when submitting non-slash prompt turns.

Chat shell 在提交非 slash prompt turns 时，必须将 active palette reference sets 作为结构化 `referenceContext` metadata 一起提交。

#### Scenario: Prompt receives active reference metadata / Prompt 接收当前引用元数据

- **WHEN** the user adds references with `/palette refs add ...` and then enters a normal prompt
- **THEN** the shell submits the prompt through the runtime with `referenceContext` metadata derived from local composition state
- **中文** 当用户通过 `/palette refs add ...` 增加 references 后输入普通 prompt 时，shell 必须通过 runtime 提交 prompt，并携带从本地 composition state 派生的 `referenceContext` metadata。

#### Scenario: Slash commands remain model-hidden / Slash 命令继续对模型隐藏

- **WHEN** the user lists, focuses, or adds references with `/palette refs ...`
- **THEN** those slash commands remain local and do not themselves submit model/runtime requests
- **中文** 当用户通过 `/palette refs ...` list、focus 或 add references 时，这些 slash commands 必须保持本地化，且其自身不提交 model/runtime requests。

#### Scenario: Prompt text is unchanged / Prompt 文本不被修改

- **WHEN** chat submits a prompt with active references
- **THEN** the user prompt text sent to the agent loop remains the exact non-slash prompt text, while references are carried separately as metadata
- **中文** 当 chat 携带 active references 提交 prompt 时，发送给 agent loop 的 user prompt text 必须保持确切的非 slash prompt text，references 必须单独作为 metadata 携带。

### Requirement: Chat File References Stay Local Until Prompt Turn / Chat 文件引用在 Prompt Turn 前保持本地

The chat shell SHALL allow users to add a file reference to the active reference set without reading file content or submitting a model/runtime request for the slash command itself.

Chat shell 必须允许用户把 file reference 加入 active reference set，但不得为该 slash command 自身读取文件内容或提交 model/runtime request。

#### Scenario: Add file reference locally / 本地增加文件引用

- **WHEN** the user enters `/palette refs add-file <path>`
- **THEN** the shell records a structured file reference target with path metadata, renders local reference state, and does not submit a model/runtime request for the slash command
- **中文** 当用户输入 `/palette refs add-file <path>` 时，shell 必须记录带 path metadata 的 structured file reference target，渲染本地 reference state，且不为该 slash command 提交 model/runtime request。

#### Scenario: File reference projects on next prompt / 文件引用在下一条 Prompt 投影

- **WHEN** a file reference exists and the user enters a normal prompt
- **THEN** the prompt turn carries the reference metadata to runtime so governed context projection can materialize the file content
- **中文** 当 file reference 存在且用户输入普通 prompt 时，该 prompt turn 必须将 reference metadata 携带到 runtime，以便 governed context projection materialize 文件内容。

### Requirement: Chat Local File Search Control / Chat 本地文件搜索控制

The chat shell SHALL expose a local `/palette files <pattern>` control that searches workspace files through the injected platform abstraction, creates a navigable file result list, and does not submit the slash input to runtime or model execution.

Chat shell 必须暴露本地 `/palette files <pattern>` 控制，通过注入的 platform abstraction 搜索 workspace files，创建可导航 file result list，且不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: File search creates result list / 文件搜索创建结果列表

- **WHEN** the user enters `/palette files <pattern>` during chat
- **THEN** the shell searches workspace files through the platform abstraction, stores the matches as the active result list, renders deterministic local file-search records, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette files <pattern>` 时，shell 必须通过 platform abstraction 搜索 workspace files，将 matches 存为 active result list，渲染确定性的本地 file-search records，且不提交 runtime/model request。

#### Scenario: Missing file search pattern stays local / 缺少文件搜索 Pattern 保持本地

- **WHEN** the user enters `/palette files` without a pattern
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 pattern 的 `/palette files` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: File search does not read content / 文件搜索不读取内容

- **WHEN** `/palette files <pattern>` returns matching file paths
- **THEN** the shell records path metadata only and does not read or render raw file content until a subsequent prompt turn carries active references to runtime projection
- **中文** 当 `/palette files <pattern>` 返回匹配 file paths 时，shell 必须只记录 path metadata，不读取或渲染 raw file content，直到后续 prompt turn 携带 active references 交给 runtime projection。

### Requirement: Chat Local Text Search Control / Chat 本地文本搜索控制

The chat shell SHALL expose a local `/palette grep <text>` control that searches workspace text through the injected platform abstraction, creates a navigable result list, and does not submit the slash input to runtime or model execution.

Chat shell 必须暴露本地 `/palette grep <text>` 控制，通过注入的 platform abstraction 搜索 workspace text，创建可导航 result list，且不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: Text search creates result list / 文本搜索创建结果列表

- **WHEN** the user enters `/palette grep <text>` during chat
- **THEN** the shell searches workspace text through the platform abstraction, stores bounded matches as the active result list, renders deterministic local search records, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette grep <text>` 时，shell 必须通过 platform abstraction 搜索 workspace text，将有界 matches 存为 active result list，渲染确定性的本地 search records，且不提交 runtime/model request。

#### Scenario: Missing text search pattern stays local / 缺少文本搜索 Pattern 保持本地

- **WHEN** the user enters `/palette grep` without text
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 text 的 `/palette grep` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: Text search output is bounded / 文本搜索输出有界

- **WHEN** `/palette grep <text>` returns matching lines
- **THEN** the shell renders only bounded metadata and preview text for each match, and full file content remains unavailable until a subsequent prompt turn carries active references to runtime projection
- **中文** 当 `/palette grep <text>` 返回匹配行时，shell 必须只为每个 match 渲染有界 metadata 与 preview text；完整 file content 必须直到后续 prompt turn 携带 active references 交给 runtime projection 后才可用。

### Requirement: Chat Local Reference Mutation Controls / Chat 本地引用变更控制

The chat shell SHALL expose local reference mutation controls under `/palette refs` for removing, clearing, and replacing active references without sending those slash inputs to the model or runtime.

Chat shell 必须在 `/palette refs` 下暴露本地 reference mutation controls，用于 remove、clear、replace active references，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Chat removes reference locally / Chat 本地移除引用

- **WHEN** the user enters `/palette refs remove <ref-id|index|target-id|current>` after references exist
- **THEN** the shell removes the selected reference item locally, updates active reference focus deterministically, renders updated reference state, and does not submit a runtime/model request
- **中文** 当用户在已有 references 后输入 `/palette refs remove <ref-id|index|target-id|current>` 时，shell 必须本地移除选中的 reference item、确定性更新 active reference focus、渲染更新后的 reference state，且不提交 runtime/model request。

#### Scenario: Chat clears references locally / Chat 本地清空引用

- **WHEN** the user enters `/palette refs clear`
- **THEN** the shell clears local active reference sets, renders zero references, and the next prompt carries no reference context unless new references are added
- **中文** 当用户输入 `/palette refs clear` 时，shell 必须清空本地 active reference sets、渲染零 references，并且下一条 prompt 在未添加新 references 前不得携带 reference context。

#### Scenario: Chat replaces references with current result / Chat 用当前结果替换引用

- **WHEN** the user focuses a result-list item and enters `/palette refs replace current`
- **THEN** the shell replaces existing local references with exactly the focused result-list item, preserves the item's typed target metadata, renders updated reference state, and does not submit a runtime/model request
- **中文** 当用户聚焦 result-list item 并输入 `/palette refs replace current` 时，shell 必须用当前聚焦 result-list item 精确替换已有本地 references，保留该 item 的 typed target metadata，渲染更新后的 reference state，且不提交 runtime/model request。

#### Scenario: Missing reference mutation target stays local / 缺失引用变更目标保持本地

- **WHEN** the user enters a remove or replace command whose selector cannot be resolved
- **THEN** the shell emits a typed local failure and preserves prior reference state without submitting a runtime/model request
- **中文** 当用户输入 selector 无法解析的 remove 或 replace command 时，shell 必须输出 typed local failure，并保持之前的 reference state，不提交 runtime/model request。

### Requirement: Chat Local PageIndex Recall / Chat 本地 PageIndex 回溯

The chat shell SHALL maintain a local PageIndex of completed prompt turns and expose `/palette recall <query>` as a local recall command without submitting the slash input to runtime or model execution. PageIndex pages and recall results SHALL carry bounded evidence quality metadata.

Chat shell 必须维护 completed prompt turns 的本地 PageIndex，并暴露 `/palette recall <query>` 作为本地 recall command，不得把该 slash input 提交给 runtime 或 model execution。PageIndex pages 与 recall results 必须携带有界 evidence quality metadata。

#### Scenario: Completed prompt turn creates page / 完成的 Prompt Turn 创建 Page

- **WHEN** a normal chat prompt finishes with a terminal runtime event
- **THEN** the shell records a PageIndex page containing page id, session id, turn id, turn sequence, status, trace id, createdAt, prompt preview, assistant preview, evidence quality metadata, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束时，shell 必须记录一个 PageIndex page，包含 page id、session id、turn id、turn sequence、status、trace id、createdAt、prompt preview、assistant preview、evidence quality metadata 与 redaction metadata。

#### Scenario: Recall creates result list locally / Recall 本地创建结果列表

- **WHEN** the user enters `/palette recall <query>` during chat
- **THEN** the shell searches local PageIndex pages, stores matching pages as the active result list, renders deterministic recall records with matched fields and ranking reason, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette recall <query>` 时，shell 必须搜索本地 PageIndex pages，将匹配 pages 存为 active result list，渲染带 matched fields 与 ranking reason 的确定性 recall records，且不提交 runtime/model request。

#### Scenario: Missing recall query stays local / 缺少 Recall 查询保持本地

- **WHEN** the user enters `/palette recall` without a query
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 query 的 `/palette recall` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: Recall output is bounded / Recall 输出有界

- **WHEN** recall returns matching pages
- **THEN** the shell renders only bounded prompt and assistant previews, stable ids, status, score metadata, evidence quality metadata, and redaction metadata rather than raw full transcript content
- **中文** 当 recall 返回匹配 pages 时，shell 必须只渲染有界 prompt 与 assistant previews、stable ids、status、score metadata、evidence quality metadata 和 redaction metadata，而不是 raw full transcript content。

#### Scenario: Legacy recall quality is explicit / Legacy Recall 质量显式

- **WHEN** a restored PageIndex page lacks a parseable createdAt or match quality metadata
- **THEN** recall normalizes the result with deterministic fallback quality metadata instead of inventing semantic confidence
- **中文** 当恢复的 PageIndex page 缺少可解析 createdAt 或 match quality metadata 时，recall 必须用确定性 fallback quality metadata 归一化结果，而不是虚构 semantic confidence。

### Requirement: PageIndex Uses Runtime Event Timestamp / PageIndex 使用 Runtime Event 时间

The chat PageIndex SHALL use terminal runtime event `createdAt` as the page timestamp when it is available and parseable.

Chat PageIndex 在 terminal runtime event `createdAt` 可用且可解析时，必须使用它作为 page timestamp。

#### Scenario: Runtime timestamp becomes PageIndex timestamp / Runtime 时间成为 PageIndex 时间

- **WHEN** a completed prompt turn terminal event includes a parseable `createdAt`
- **THEN** the recorded PageIndex page and recall metadata use that value, and evidence quality marks `createdAtSource=runtime-event` with known freshness
- **中文** 当 completed prompt turn terminal event 包含可解析 `createdAt` 时，记录的 PageIndex page 与 recall metadata 必须使用该值，并且 evidence quality 标记 `createdAtSource=runtime-event` 与 known freshness。

#### Scenario: Missing runtime timestamp falls back deterministically / 缺失 Runtime 时间确定性回退

- **WHEN** a legacy or malformed runtime event lacks a parseable `createdAt`
- **THEN** PageIndex uses the deterministic fallback timestamp and marks freshness as unknown
- **中文** 当 legacy 或 malformed runtime event 缺少可解析 `createdAt` 时，PageIndex 必须使用 deterministic fallback timestamp，并将 freshness 标记为 unknown。

### Requirement: PageIndex Uses Bounded Freshness States / PageIndex 使用有界新鲜度状态

The chat PageIndex SHALL expose bounded freshness states for recall evidence: `fresh`, `stale`, and `unknown`.

Chat PageIndex 必须为 recall evidence 暴露有界 freshness states：`fresh`、`stale` 与 `unknown`。

#### Scenario: Runtime timestamped page is fresh / Runtime 时间 Page 为 Fresh

- **WHEN** a completed prompt turn records a PageIndex page from a parseable runtime event `createdAt`
- **THEN** the page, recall metadata, explain output, and projected recall evidence mark freshness as `fresh`
- **中文** 当 completed prompt turn 基于可解析的 runtime event `createdAt` 记录 PageIndex page 时，该 page、recall metadata、explain output 与 projected recall evidence 必须将 freshness 标记为 `fresh`。

#### Scenario: Legacy fallback remains unknown / Legacy 回退保持 Unknown

- **WHEN** a legacy or malformed PageIndex page lacks a runtime-sourced timestamp
- **THEN** the page and recall metadata mark freshness as `unknown`
- **中文** 当 legacy 或 malformed PageIndex page 缺少 runtime-sourced timestamp 时，该 page 与 recall metadata 必须将 freshness 标记为 `unknown`。

#### Scenario: Stale status is preserved / Stale 状态被保留

- **WHEN** a restored or externally supplied PageIndex page carries `freshnessStatus=stale`
- **THEN** recall metadata and projection preserve `stale` instead of normalizing it away
- **中文** 当 restored 或 externally supplied PageIndex page 携带 `freshnessStatus=stale` 时，recall metadata 与 projection 必须保留 `stale`，不得将其归一化掉。

### Requirement: PageIndex Marks Recall Stale After Workspace Edits / PageIndex 在工作区编辑后标记 Recall 为 Stale

The chat PageIndex SHALL downgrade `fresh` recall evidence to `stale` when existing workspace checkpoint evidence proves that a later workspace edit happened in the same chat session after the recalled page turn.

当已有 workspace checkpoint evidence 能证明同一 chat session 中 recalled page turn 之后发生过 workspace edit 时，chat PageIndex 必须将 `fresh` recall evidence 降级为 `stale`。

#### Scenario: Later same-session edit makes earlier recall stale / 同 Session 后续编辑使早期 Recall 变 Stale

- **WHEN** a chat session records a PageIndex page for an earlier prompt turn and a later turn creates workspace checkpoint evidence in the same session
- **THEN** `/palette recall <query>` renders the earlier PageIndex result with `freshnessStatus=stale` in result metadata, explain output, and any projected recall reference
- **中文** 当 chat session 为较早 prompt turn 记录 PageIndex page，且后续 turn 在同一 session 中创建 workspace checkpoint evidence 时，`/palette recall <query>` 必须在 result metadata、explain output 与后续 projected recall reference 中将该早期 PageIndex result 渲染为 `freshnessStatus=stale`。

#### Scenario: No proven later edit preserves freshness / 无可证明后续编辑时保持 Freshness

- **WHEN** a PageIndex page has runtime-sourced `fresh` evidence and no later same-session workspace checkpoint can be ordered after that page
- **THEN** recall preserves `fresh` rather than inventing staleness
- **中文** 当 PageIndex page 具有 runtime-sourced `fresh` evidence，且没有可排序到该 page 之后的同 session workspace checkpoint 时，recall 必须保留 `fresh`，不得虚构 stale。

#### Scenario: Unknown freshness is not promoted / Unknown Freshness 不被提升

- **WHEN** a legacy or malformed PageIndex page has `freshnessStatus=unknown`
- **THEN** workspace edit staleness adjustment does not upgrade it to `fresh` or reinterpret it as verified current evidence
- **中文** 当 legacy 或 malformed PageIndex page 具有 `freshnessStatus=unknown` 时，workspace edit staleness adjustment 不得将其升级为 `fresh`，也不得将其重新解释为 verified current evidence。

#### Scenario: Workspace recall avoids cross-session guessing / Workspace Recall 避免跨 Session 猜测

- **WHEN** workspace-scoped PageIndex pages are loaded from workspace storage but local chat history cannot prove turn ordering against workspace checkpoint evidence
- **THEN** recall preserves the page freshness status already stored on the page instead of marking it stale by timestamp guesswork
- **中文** 当 workspace-scoped PageIndex pages 从 workspace storage 加载，但本地 chat history 无法证明其与 workspace checkpoint evidence 的 turn ordering 时，recall 必须保留 page 已存储的 freshness status，不得通过 timestamp guesswork 标记 stale。

### Requirement: Workspace PageIndex Uses Mutation Watermarks / Workspace PageIndex 使用变更水位线

The chat PageIndex SHALL persist and evaluate a workspace mutation watermark for workspace-scoped PageIndex pages so cross-session recall can distinguish fresh evidence from evidence captured before later workspace edits.

Chat PageIndex 必须为 workspace-scoped PageIndex pages 持久化并评估 workspace mutation watermark，使跨 session recall 能区分 fresh evidence 与后续 workspace edits 之前捕获的 evidence。

#### Scenario: Workspace page records checkpoint watermark / Workspace Page 记录 Checkpoint 水位线

- **WHEN** the chat shell persists workspace PageIndex pages and workspace checkpoint evidence is available
- **THEN** each persisted workspace page carries `evidenceQuality.workspaceCheckpointWatermark` equal to the current workspace checkpoint count at persistence time
- **中文** 当 chat shell 持久化 workspace PageIndex pages 且 workspace checkpoint evidence 可用时，每个持久化 workspace page 必须携带 `evidenceQuality.workspaceCheckpointWatermark`，其值等于持久化时当前 workspace checkpoint count。

#### Scenario: Later workspace mutation makes workspace recall stale / 后续 Workspace 变更使 Workspace Recall 变 Stale

- **WHEN** a later chat session loads a workspace PageIndex page whose checkpoint watermark is lower than the current workspace checkpoint count
- **THEN** workspace recall renders that page with `freshnessStatus=stale` in result metadata, explain output, and projected recall references
- **中文** 当后续 chat session 加载的 workspace PageIndex page 的 checkpoint watermark 低于当前 workspace checkpoint count 时，workspace recall 必须在 result metadata、explain output 与 projected recall references 中将该 page 渲染为 `freshnessStatus=stale`。

#### Scenario: Equal workspace watermark preserves fresh / 相同 Workspace 水位线保持 Fresh

- **WHEN** a workspace PageIndex page has runtime-sourced `fresh` evidence and its checkpoint watermark equals the current workspace checkpoint count
- **THEN** workspace recall preserves `fresh`
- **中文** 当 workspace PageIndex page 具有 runtime-sourced `fresh` evidence，且其 checkpoint watermark 等于当前 workspace checkpoint count 时，workspace recall 必须保留 `fresh`。

#### Scenario: Missing workspace watermark is unknown / 缺失 Workspace 水位线为 Unknown

- **WHEN** a workspace PageIndex page lacks `workspaceCheckpointWatermark` and current workspace checkpoint evidence exists
- **THEN** workspace recall marks the page freshness as `unknown` rather than preserving unverifiable `fresh`
- **中文** 当 workspace PageIndex page 缺少 `workspaceCheckpointWatermark` 且当前存在 workspace checkpoint evidence 时，workspace recall 必须将 page freshness 标记为 `unknown`，不得保留无法验证的 `fresh`。

### Requirement: Chat PageIndex Recall Explain / Chat PageIndex 回溯解释

The chat shell SHALL expose a local `/palette recall explain` command that explains the focused or selected PageIndex recall result without submitting the command to runtime or model execution.

Chat shell 必须暴露本地 `/palette recall explain` command，用于解释 focused 或 selected PageIndex recall result，且不得把该 command 提交给 runtime 或 model execution。

#### Scenario: Explain current recall result locally / 本地解释当前 Recall 结果

- **WHEN** the user enters `/palette recall explain` or `/palette recall explain current` after a PageIndex recall result list exists
- **THEN** the shell renders a bounded explain record for the active recall item containing scope, page id, session id, turn id, createdAt, freshness status, matched fields, ranking reason, deterministic score, semantic status, and redaction metadata
- **中文** 当用户在已有 PageIndex recall result list 后输入 `/palette recall explain` 或 `/palette recall explain current` 时，shell 必须为 active recall item 渲染有界 explain record，包含 scope、page id、session id、turn id、createdAt、freshness status、matched fields、ranking reason、deterministic score、semantic status 与 redaction metadata。

#### Scenario: Explain selected recall result locally / 本地解释指定 Recall 结果

- **WHEN** the user enters `/palette recall explain <item-id|target-id>`
- **THEN** the shell resolves the selected PageIndex recall item from local result-list state and renders its bounded explain record without submitting a runtime/model request
- **中文** 当用户输入 `/palette recall explain <item-id|target-id>` 时，shell 必须从本地 result-list state 解析指定 PageIndex recall item，并渲染其有界 explain record，不提交 runtime/model request。

#### Scenario: Missing explain target is typed / 缺失 Explain 目标类型化

- **WHEN** the user enters `/palette recall explain` before a PageIndex recall result exists, or selects a missing item
- **THEN** the shell emits a typed local failure and preserves the prior palette state
- **中文** 当用户在没有 PageIndex recall result 前输入 `/palette recall explain`，或选择不存在的 item 时，shell 必须输出 typed local failure，并保持之前的 palette state。

#### Scenario: Explain output remains bounded / Explain 输出保持有界

- **WHEN** an explained recall item originated from a prompt or assistant response with hidden long content
- **THEN** the explain output includes only bounded previews and metadata, not raw full transcript content
- **中文** 当被解释的 recall item 来源 prompt 或 assistant response 包含隐藏长内容时，explain output 必须只包含有界 previews 与 metadata，而不是完整原始 transcript content。

### Requirement: PageIndex Explains Freshness Evidence / PageIndex 解释 Freshness Evidence

The chat PageIndex SHALL expose bounded freshness evidence alongside freshness status in recall metadata and `/palette recall explain` output.

Chat PageIndex 必须在 recall metadata 与 `/palette recall explain` output 中随 freshness status 一起暴露有界 freshness evidence。

#### Scenario: Explain stale reason / 解释 Stale 原因

- **WHEN** a PageIndex recall result is marked `stale` because of session turn order or workspace checkpoint watermark evidence
- **THEN** `/palette recall explain` includes the freshness reason, freshness evidence scope, and available mutation or watermark evidence without exposing raw transcript or file content
- **中文** 当 PageIndex recall result 因 session turn order 或 workspace checkpoint watermark evidence 被标记为 `stale` 时，`/palette recall explain` 必须包含 freshness reason、freshness evidence scope 以及可用的 mutation 或 watermark evidence，且不得暴露原始 transcript 或 file content。

#### Scenario: Explain unknown reason / 解释 Unknown 原因

- **WHEN** a PageIndex recall result is marked `unknown` because required freshness evidence is missing
- **THEN** `/palette recall explain` includes the missing-evidence reason instead of silently presenting only `freshnessStatus=unknown`
- **中文** 当 PageIndex recall result 因缺少必要 freshness evidence 被标记为 `unknown` 时，`/palette recall explain` 必须包含 missing-evidence reason，而不是只静默显示 `freshnessStatus=unknown`。

#### Scenario: Recall metadata preserves freshness evidence / Recall Metadata 保留 Freshness Evidence

- **WHEN** a PageIndex recall result is added to references
- **THEN** the reference target metadata preserves freshness evidence so later projection can explain why the evidence is fresh, stale, or unknown
- **中文** 当 PageIndex recall result 被加入 references 时，reference target metadata 必须保留 freshness evidence，使后续 projection 能解释该 evidence 为什么是 fresh、stale 或 unknown。

### Requirement: Chat PageIndex Uses Shared Index Provider Boundary / Chat PageIndex 使用共享 Index Provider 边界

The chat CLI SHALL keep slash commands, terminal rendering, and workspace persistence in the CLI host while routing deterministic PageIndex DTO normalization and text recall through the shared index provider boundary.

Chat CLI 必须将 slash commands、terminal rendering 与 workspace persistence 保留在 CLI host，同时通过 shared index provider boundary 路由 deterministic PageIndex DTO normalization 与 text recall。

#### Scenario: Recall behavior stays local but shared / Recall 行为保持本地但共享
- **WHEN** the user runs `/palette recall <query>`
- **THEN** the CLI keeps the slash command local and uses shared PageIndex provider primitives for page filtering, scoring, result metadata, and bounded freshness evidence
- **中文** 当用户运行 `/palette recall <query>` 时，CLI 必须保持 slash command 本地执行，并使用 shared PageIndex provider primitives 处理 page filtering、scoring、result metadata 与有界 freshness evidence。

#### Scenario: CLI host does not own semantic provider logic / CLI Host 不拥有 Semantic Provider 逻辑
- **WHEN** ZVec, code-index, or embedding providers are configured later
- **THEN** CLI reads typed provider status/results through contracts instead of importing provider SDKs or implementing vector ranking in the host adapter
- **中文** 当未来配置 ZVec、code-index 或 embedding providers 时，CLI 必须通过 contracts 读取类型化 provider status/results，而不是在 host adapter 中导入 provider SDKs 或实现 vector ranking。

### Requirement: Chat PageIndex Recall References Project On Prompt / Chat PageIndex 回溯引用在 Prompt 时投影

The chat shell SHALL allow focused PageIndex recall results from executable PageIndex scopes to be added as active references and carried as structured metadata on the next normal prompt without mutating the prompt text.

Chat shell 必须允许来自可执行 PageIndex scope 的 focused PageIndex recall results 被加入 active references，并在下一条普通 prompt 中作为 structured metadata 携带，且不得修改 prompt text。

#### Scenario: Add current recall result to references / 当前 Recall 结果加入引用

- **WHEN** the user focuses a PageIndex recall result and enters `/palette refs add current`
- **THEN** the active reference set receives a `kind=turn` reference item preserving scope, page id, session id, turn id, bounded previews, deterministic score, and redaction metadata
- **中文** 当用户聚焦 PageIndex recall result 并输入 `/palette refs add current` 时，active reference set 必须收到 `kind=turn` reference item，并保留 scope、page id、session id、turn id、有界 previews、deterministic score 与 redaction metadata。

#### Scenario: Recall reference projects on next prompt / Recall 引用在下一条 Prompt 投影

- **WHEN** a PageIndex recall reference exists and the user enters a normal prompt
- **THEN** the shell submits the exact prompt text plus structured reference metadata, and runtime-owned context projection materializes the bounded recall summary before model dispatch
- **中文** 当存在 PageIndex recall reference 且用户输入普通 prompt 时，shell 必须提交原样 prompt text 与 structured reference metadata，并由 runtime-owned context projection 在 model dispatch 前物化有界 recall summary。

#### Scenario: Workspace recall reference carries workspace provenance / Workspace Recall 引用携带 Workspace 来源

- **WHEN** a workspace-scoped PageIndex recall result is added to references and the user enters a normal prompt
- **THEN** the next runtime request carries a `kind=turn` reference with `scope=workspace`, and projected model context includes bounded workspace-scope recall provenance without exposing raw full transcript content
- **中文** 当 workspace-scoped PageIndex recall result 被加入 references 且用户输入普通 prompt 时，下一次 runtime request 必须携带 `scope=workspace` 的 `kind=turn` reference，并且投影后的模型上下文必须包含有界 workspace-scope recall provenance，不暴露完整原始 transcript content。

### Requirement: Chat PageIndex Snapshot Resume / Chat PageIndex 快照恢复

The chat shell SHALL persist bounded PageIndex recall pages through session snapshots and SHALL restore them when started with an explicit `deepseek chat --session <session-id>`.

Chat shell 必须通过 session snapshots 持久化有界 PageIndex recall pages，并且在通过显式 `deepseek chat --session <session-id>` 启动时恢复这些 pages。

#### Scenario: Prompt turn snapshots PageIndex / Prompt Turn 快照 PageIndex

- **WHEN** a normal chat prompt finishes with a terminal runtime event and a session id is available
- **THEN** the shell writes a versioned `chat.pageindex.snapshot` payload through the session store containing bounded PageIndex pages, page count, schema version, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束且存在 session id 时，shell 必须通过 session store 写入 versioned `chat.pageindex.snapshot` payload，包含有界 PageIndex pages、page count、schema version 与 redaction metadata。

#### Scenario: Chat session restores recall pages / Chat Session 恢复 Recall Pages

- **WHEN** a user runs `deepseek chat --session <session-id>` for a session whose latest snapshot contains PageIndex pages
- **THEN** the shell restores those pages before processing slash commands, and `/palette recall <query>` can return matching prior turns without submitting a model request
- **中文** 当用户对 latest snapshot 包含 PageIndex pages 的 session 运行 `deepseek chat --session <session-id>` 时，shell 必须在处理 slash commands 前恢复这些 pages，并且 `/palette recall <query>` 能返回匹配的历史 turns，而不提交 model request。

#### Scenario: Explicit chat resume failure is typed / 显式 Chat Resume 失败类型化

- **WHEN** a user runs `deepseek chat --session <missing-session-id>` and the session store cannot resume that id
- **THEN** the shell emits a typed local resume failure and does not start a new ambiguous session or submit a model request
- **中文** 当用户运行 `deepseek chat --session <missing-session-id>` 且 session store 无法恢复该 id 时，shell 必须输出 typed local resume failure，不得启动新的 ambiguous session 或提交 model request。

#### Scenario: Snapshot output remains bounded / Snapshot 输出保持有界

- **WHEN** a prompt or assistant response contains text longer than the PageIndex preview limit
- **THEN** the snapshot payload contains only bounded previews and stable metadata, not the raw full transcript content
- **中文** 当 prompt 或 assistant response 包含超过 PageIndex preview limit 的文本时，snapshot payload 必须只包含有界 previews 与稳定 metadata，而不是 raw full transcript content。

#### Scenario: Restored pages preserve recall provenance / 恢复后的 Pages 保留回溯出处

- **WHEN** restored PageIndex pages are returned through `/palette recall <query>`
- **THEN** each result carries page id, session id, turn id, deterministic rank metadata, redaction metadata, and explicit session-scoped provenance so later projection can distinguish evidence-backed context from unsupported memory
- **中文** 当恢复后的 PageIndex pages 通过 `/palette recall <query>` 返回时，每个结果必须携带 page id、session id、turn id、deterministic rank metadata、redaction metadata 与显式 session-scoped provenance，使后续 projection 能区分 evidence-backed context 与 unsupported memory。

### Requirement: Chat PageIndex Recall Scope Controls / Chat PageIndex 回溯 Scope 控制

The chat shell SHALL support explicit scope selection for `/palette recall` while keeping `session` and `workspace` as executable local PageIndex scopes.

Chat shell 必须支持 `/palette recall` 的显式 scope 选择，同时将 `session` 与 `workspace` 作为可执行的本地 PageIndex scopes。

#### Scenario: Default recall uses session scope / 默认 Recall 使用 Session Scope

- **WHEN** the user enters `/palette recall <query>` without a scope
- **THEN** the shell searches session PageIndex pages, renders recall records with `scope=session`, and does not submit a runtime/model request
- **中文** 当用户输入不带 scope 的 `/palette recall <query>` 时，shell 必须搜索 session PageIndex pages，渲染带 `scope=session` 的 recall records，且不提交 runtime/model request。

#### Scenario: Explicit session recall is equivalent / 显式 Session Recall 等价

- **WHEN** the user enters `/palette recall --scope session <query>`
- **THEN** the shell behaves the same as default recall and preserves `scope=session` in summaries, result lists, targets, and metadata
- **中文** 当用户输入 `/palette recall --scope session <query>` 时，shell 必须与默认 recall 行为一致，并在 summaries、result lists、targets 与 metadata 中保留 `scope=session`。

#### Scenario: Workspace recall uses workspace scope / Workspace Recall 使用 Workspace Scope

- **WHEN** the user enters `/palette recall --scope workspace <query>`
- **THEN** the shell searches workspace PageIndex pages, renders recall records with `scope=workspace`, and does not submit a runtime/model request
- **中文** 当用户输入 `/palette recall --scope workspace <query>` 时，shell 必须搜索 workspace PageIndex pages，渲染带 `scope=workspace` 的 recall records，且不提交 runtime/model request。

#### Scenario: Global recall is deferred locally / Global Recall 本地延后

- **WHEN** the user enters `/palette recall --scope global <query>` before global PageIndex storage exists
- **THEN** the shell emits a typed local deferred recall result with requested scope, available scopes, and diagnostic code, without falling back to session results or submitting a runtime/model request
- **中文** 当用户在 global PageIndex storage 尚不存在时输入 `/palette recall --scope global <query>`，shell 必须输出 typed local deferred recall result，包含 requested scope、available scopes 与 diagnostic code，且不得 fallback 到 session results 或提交 runtime/model request。

#### Scenario: Invalid recall scope stays local / 无效 Recall Scope 保持本地

- **WHEN** the user enters `/palette recall --scope <invalid> <query>` or omits the scope value
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入 `/palette recall --scope <invalid> <query>` 或省略 scope value 时，shell 必须输出 typed local failure 并保持 REPL 可用，且不提交 runtime/model request。

### Requirement: Chat Workspace PageIndex Recall / Chat Workspace PageIndex 回溯

The chat shell SHALL persist bounded PageIndex evidence to workspace metadata and SHALL support `/palette recall --scope workspace <query>` without submitting the slash input to runtime or model execution.

Chat shell 必须将有界 PageIndex evidence 持久化到 workspace metadata，并且必须支持 `/palette recall --scope workspace <query>`，不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: Prompt turn persists workspace page / Prompt Turn 持久化 Workspace Page

- **WHEN** a normal chat prompt finishes with a terminal runtime event and workspace metadata storage is available
- **THEN** the shell writes a bounded workspace PageIndex record containing page id, scope, workspace root metadata, session id, turn id, turn sequence, status, trace id, prompt preview, assistant preview, semantic status, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束且 workspace metadata storage 可用时，shell 必须写入有界 workspace PageIndex record，包含 page id、scope、workspace root metadata、session id、turn id、turn sequence、status、trace id、prompt preview、assistant preview、semantic status 与 redaction metadata。

#### Scenario: Workspace recall searches persisted pages / Workspace Recall 搜索持久化 Pages

- **WHEN** the user enters `/palette recall --scope workspace <query>` in a later chat session in the same workspace
- **THEN** the shell loads workspace PageIndex pages, searches them locally, renders recall records with `scope=workspace`, and does not submit a runtime/model request
- **中文** 当用户在同一 workspace 的后续 chat session 输入 `/palette recall --scope workspace <query>` 时，shell 必须加载 workspace PageIndex pages、本地搜索、渲染带 `scope=workspace` 的 recall records，且不提交 runtime/model request。

#### Scenario: Workspace recall does not fall back to session / Workspace Recall 不回退到 Session

- **WHEN** workspace PageIndex storage cannot be resolved or read
- **THEN** the shell emits a typed local workspace recall failure or deferred diagnostic and does not return session-scoped result items for a workspace-scoped request
- **中文** 当 workspace PageIndex storage 无法 resolve 或读取时，shell 必须输出 typed local workspace recall failure 或 deferred diagnostic，且不得为 workspace-scoped request 返回 session-scoped result items。

#### Scenario: Workspace page output is bounded / Workspace Page 输出有界

- **WHEN** prompt or assistant text exceeds the PageIndex preview limit
- **THEN** persisted workspace PageIndex records and recall output contain only bounded previews and stable provenance, not the raw full transcript content
- **中文** 当 prompt 或 assistant text 超过 PageIndex preview limit 时，持久化 workspace PageIndex records 与 recall output 必须只包含有界 previews 与稳定 provenance，而不是 raw full transcript content。

#### Scenario: Global recall remains deferred / Global Recall 继续延后

- **WHEN** the user enters `/palette recall --scope global <query>`
- **THEN** the shell emits a typed local deferred result until global PageIndex storage is explicitly implemented
- **中文** 当用户输入 `/palette recall --scope global <query>` 时，shell 必须输出 typed local deferred result，直到 global PageIndex storage 被显式实现。

### Requirement: Chat Mode Controls / Chat 模式控制

The chat CLI SHALL expose local mode and agent controls without sending control text to the model.

chat CLI 必须暴露本地 mode 与 agent controls，且不得把 control text 发送给 model。

#### Scenario: Chat renders mode status locally / Chat 本地渲染 Mode 状态
- **WHEN** a user enters `/mode` in chat
- **THEN** the shell renders current interaction mode, current agent mode, available transitions, active budgets, and degradation reasons without model dispatch
- **中文** 当用户在 chat 中输入 `/mode` 时，shell 必须渲染 current interaction mode、current agent mode、available transitions、active budgets 与 degradation reasons，且不得触发 model dispatch。

#### Scenario: Chat agent status is local / Chat Agent 状态保持本地
- **WHEN** a user enters `/agent` or `/workers` in chat
- **THEN** the shell renders agent definitions, active worker instances, lifecycle status, and result ids through local command/action results
- **中文** 当用户在 chat 中输入 `/agent` 或 `/workers` 时，shell 必须通过 local command/action results 渲染 agent definitions、active worker instances、lifecycle status 与 result ids。

### Requirement: Chat Multi-Round Status Rendering / Chat 多轮状态渲染

Chat rendering SHALL show bounded progress for evidence, planning, delegation, verification, and repair phases while preserving structured JSONL parity.

Chat rendering 必须为 evidence、planning、delegation、verification 与 repair phases 显示有界进度，同时保持 structured JSONL parity。

#### Scenario: Text mode shows concise phase markers / Text Mode 显示简洁阶段标记
- **WHEN** a chat turn enters evidence, plan, worker, verify, or repair phase
- **THEN** text rendering shows concise phase markers without dumping raw evidence, worker transcripts, private reasoning, or unbounded command output
- **中文** 当 chat turn 进入 evidence、plan、worker、verify 或 repair phase 时，text rendering 必须显示简洁 phase markers，不得倾倒 raw evidence、worker transcripts、private reasoning 或无界 command output。

#### Scenario: JSONL keeps complete structured events / JSONL 保留完整结构化事件
- **WHEN** chat output is JSONL
- **THEN** all mode, phase, delegation, verification, repair, and terminal events are emitted as structured JSONL records suitable for replay
- **中文** 当 chat output 是 JSONL 时，所有 mode、phase、delegation、verification、repair 与 terminal events 必须作为适合 replay 的 structured JSONL records 发出。

### Requirement: Chat Reasoning Controls / Chat 推理控制

Chat SHALL expose reasoning effort status separately from evidence and verification loop status.

Chat 必须将 reasoning effort status 与 evidence 和 verification loop status 分开暴露。

#### Scenario: Model status includes reasoning effort / Model 状态包含推理强度
- **WHEN** a user enters `/model`
- **THEN** the shell renders active model, provider, provider reasoning/thinking support, requested reasoning effort, mapped provider effort when any, and reasoning disabled reason when any
- **中文** 当用户输入 `/model` 时，shell 必须渲染 active model、provider、provider reasoning/thinking support、requested reasoning effort、实际映射的 provider effort（如有）与 reasoning disabled reason（如有）。

#### Scenario: Reasoning effort does not claim verification / 推理强度不声称验证
- **WHEN** the model status shows high or max reasoning effort
- **THEN** chat still reports evidence and verification loop counts separately and does not imply they ran
- **中文** 当 model status 显示 high 或 max reasoning effort 时，chat 仍必须单独报告 evidence 与 verification loop counts，不得暗示它们已运行。

### Requirement: Basic Line TUI Shell / 基础行式 TUI Shell

The chat shell SHALL provide a basic line-oriented TUI foundation in text TTY sessions, including a deterministic startup status, visible prompt, and prompt redraw after local commands or completed turns.

Chat shell 必须在 text TTY sessions 中提供基础行式 TUI 基座，包括确定性的启动状态、可见 prompt，以及 local commands 或 completed turns 后的 prompt redraw。

#### Scenario: Interactive chat shows startup status and prompt / 交互式 Chat 显示启动状态与 Prompt

- **WHEN** a user starts `deepseek chat` with text output and reliable TTY line input
- **THEN** the shell renders a compact status line derived from terminal profile and chat state, then renders a visible prompt before waiting for input
- **中文** 当用户以 text output 和可靠 TTY line input 启动 `deepseek chat` 时，shell 必须渲染基于 terminal profile 与 chat state 的紧凑状态行，然后在等待输入前渲染可见 prompt。

#### Scenario: Prompt redraw follows local commands / 本地命令后重绘 Prompt

- **WHEN** a user enters a local slash command such as `/help`, `/mode`, `/palette`, `/history`, or `/cost`
- **THEN** the shell renders that command locally and then redraws the prompt without submitting slash text to the model
- **中文** 当用户输入 `/help`、`/mode`、`/palette`、`/history` 或 `/cost` 等本地 slash command 时，shell 必须本地渲染该命令，然后重绘 prompt，不得将 slash text 提交给 model。

#### Scenario: Prompt redraw follows runtime turn / Runtime Turn 后重绘 Prompt

- **WHEN** a normal prompt turn completes, fails, or is cancelled
- **THEN** text TTY chat renders the terminal event summary and then redraws the prompt for the next line
- **中文** 当普通 prompt turn completed、failed 或 cancelled 时，text TTY chat 必须渲染 terminal event summary，然后为下一行重绘 prompt。

#### Scenario: Structured and scripted modes remain prompt-free / 结构化与脚本模式保持无 Prompt

- **WHEN** chat runs with JSON, JSONL, redirected IO, CI, or scripted input
- **THEN** startup status, prompt text, cursor controls, alternate-screen controls, and terminal-only hints are omitted while command/runtime semantics remain unchanged
- **中文** 当 chat 以 JSON、JSONL、redirected IO、CI 或 scripted input 运行时，必须省略 startup status、prompt text、cursor controls、alternate-screen controls 与 terminal-only hints，同时保持 command/runtime 语义不变。

### Requirement: Chat Uses Production TUI Framework / Chat 使用 Production TUI Framework

The chat shell SHALL use the production CLI TUI framework for interactive text TTY startup, prompt redraw, local status, and local slash-command state rendering while preserving the governed runtime event path for prompt turns.

Chat shell 必须使用 production CLI TUI framework 处理 interactive text TTY startup、prompt redraw、本地状态与本地 slash-command state rendering，同时保留 prompt turns 的受治理 runtime event path。

#### Scenario: Chat startup identifies framework / Chat 启动标识 Framework

- **WHEN** a user starts `deepseek chat` in an interactive text TTY
- **THEN** startup output identifies the TUI framework, vi-inspired composition profile, viewport profile, keymap profile, plugin readiness, contribution count, diagnostic count, and session id
- **中文** 当用户在 interactive text TTY 中启动 `deepseek chat` 时，startup output 必须标识 TUI framework、vi-inspired composition profile、viewport profile、keymap profile、plugin readiness、contribution count、diagnostic count 与 session id。

#### Scenario: Prompt turn still uses runtime events / Prompt Turn 仍使用 Runtime Events

- **WHEN** the user enters a non-command prompt in the TUI-backed chat shell
- **THEN** the prompt is submitted through the existing runtime/kernel event path and the TUI framework only updates local viewport and prompt state around those events
- **中文** 当用户在 TUI-backed chat shell 中输入非 command prompt 时，该 prompt 必须通过现有 runtime/kernel event path 提交，TUI framework 只围绕这些 events 更新本地 viewport 与 prompt state。

### Requirement: TUI Local Controls Stay Local / TUI 本地控制保持本地

The chat shell SHALL route local slash commands through the TUI framework state and action dispatcher without sending slash inputs to model execution.

Chat shell 必须通过 TUI framework state 与 action dispatcher 路由本地 slash commands，不得将 slash inputs 发送到 model execution。

#### Scenario: Local command redraws framework status / 本地命令重绘 Framework 状态

- **WHEN** a user enters `/help`, `/palette`, `/keymap`, `/history`, `/mode`, `/cost`, `/model`, `/revert`, or approval controls
- **THEN** chat renders the local command result and updates or redraws TUI status/prompt from framework state without submitting a runtime prompt turn
- **中文** 当用户输入 `/help`、`/palette`、`/keymap`、`/history`、`/mode`、`/cost`、`/model`、`/revert` 或 approval controls 时，chat 必须渲染本地 command result，并从 framework state 更新或重绘 TUI status/prompt，且不得提交 runtime prompt turn。

#### Scenario: Unknown slash remains diagnostic / 未知 Slash 保持诊断

- **WHEN** a slash input is not recognized by chat local controls or the TUI contribution registry
- **THEN** chat emits a local typed diagnostic, preserves framework state, and continues the prompt loop
- **中文** 当 slash input 未被 chat local controls 或 TUI contribution registry 识别时，chat 必须发出本地 typed diagnostic、保留 framework state，并继续 prompt loop。

