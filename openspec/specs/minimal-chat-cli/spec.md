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

The chat shell SHALL support a bounded set of built-in controls for help, exit, clear, and cancellation.

chat shell 必须支持一组有边界的内置控制命令，包括 help、exit、clear 和 cancellation。

#### Scenario: Help lists supported controls

- **WHEN** the user enters `/help`
- **THEN** the shell renders a deterministic list of supported controls and delegated commands
- **中文** 当用户输入 `/help` 时，shell 必须渲染确定性的 supported controls 与 delegated commands 列表。

#### Scenario: Exit closes shell cleanly

- **WHEN** the user enters `/exit`, `/quit`, or sends EOF
- **THEN** the shell shuts down the active runtime resources and exits with a successful terminal status if no active turn failed
- **中文** 当用户输入 `/exit`、`/quit` 或发送 EOF 时，shell 必须关闭 active runtime resources，并在没有 active turn failure 时以成功终端状态退出。

#### Scenario: Clear is host-rendered only

- **WHEN** the user enters `/clear`
- **THEN** the shell clears or separates the terminal display without mutating runtime, session, workspace, memory, cache, or policy state
- **中文** 当用户输入 `/clear` 时，shell 只能清理或分隔 terminal display，不得修改 runtime、session、workspace、memory、cache 或 policy state。

#### Scenario: Cancel targets active turn

- **WHEN** the user enters `/cancel` while a turn is active
- **THEN** the shell sends cancellation to the active runtime invocation and renders the resulting terminal cancellation or error event
- **中文** 当用户在 active turn 存在时输入 `/cancel`，shell 必须向 active runtime invocation 发送 cancellation，并渲染由此产生的 terminal cancellation 或 error event。

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
