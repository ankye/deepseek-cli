## MODIFIED Requirements

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

## ADDED Requirements

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
