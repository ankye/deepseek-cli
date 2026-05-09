## ADDED Requirements

### Requirement: Minimal Interactive Shell Entry

The CLI SHALL provide a minimal interactive shell entry for terminal users without changing existing headless, readiness, or stream-json command behavior.

CLI 必须为终端用户提供最小 interactive shell 入口，同时不得改变现有 headless、readiness 或 stream-json command 行为。

#### Scenario: Explicit interactive command starts shell

- **WHEN** a user runs `deepseek interactive` in a supported terminal
- **THEN** the CLI starts an interactive prompt loop using the CLI host adapter
- **中文** 当用户在支持的终端运行 `deepseek interactive` 时，CLI 必须通过 CLI host adapter 启动 interactive prompt loop。

#### Scenario: Headless commands remain unchanged

- **WHEN** a user runs `deepseek -p "hello"` or `deepseek run -p "hello"`
- **THEN** the CLI executes the existing headless runtime path and does not start the interactive prompt loop
- **中文** 当用户运行 `deepseek -p "hello"` 或 `deepseek run -p "hello"` 时，CLI 必须执行现有 headless runtime path，不得启动 interactive prompt loop。

#### Scenario: Non-TTY no-arg usage does not block

- **WHEN** the CLI is invoked without arguments from a non-interactive input or output stream
- **THEN** it prints deterministic help or a structured usage error and exits without waiting for prompt input
- **中文** 当 CLI 在非交互式 input 或 output stream 中无参数启动时，必须输出确定性的 help 或 structured usage error，并在不等待 prompt input 的情况下退出。

### Requirement: Prompt Turns Use Kernel Events

Every non-command prompt submitted in the interactive shell SHALL execute through the kernel-backed runtime event stream.

interactive shell 中提交的每个非 command prompt 都必须通过 kernel-backed runtime event stream 执行。

#### Scenario: Prompt line becomes governed invocation

- **WHEN** the user submits a plain prompt line in the interactive shell
- **THEN** the shell submits a governed runtime invocation and renders canonical runtime events from that invocation
- **中文** 当用户在 interactive shell 中提交普通 prompt line 时，shell 必须提交 governed runtime invocation，并渲染该 invocation 的 canonical runtime events。

#### Scenario: Interactive shell does not execute capabilities directly

- **WHEN** a prompt causes model, tool, command, policy, scheduler, sandbox, or capability work
- **THEN** the CLI obtains results from runtime/protocol events rather than directly calling executable primitives
- **中文** 当 prompt 触发 model、tool、command、policy、scheduler、sandbox 或 capability work 时，CLI 必须从 runtime/protocol events 获取结果，而不是直接调用 executable primitives。

### Requirement: Minimal Interactive Controls

The interactive shell SHALL support a bounded set of built-in controls for help, exit, clear, and cancellation.

interactive shell 必须支持一组有边界的内置控制命令，包括 help、exit、clear 和 cancellation。

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

### Requirement: Interactive Rendering Is Event Based

Interactive CLI output SHALL be produced by rendering canonical runtime/protocol events and command results, not by inspecting private runtime state.

interactive CLI output 必须通过渲染 canonical runtime/protocol events 与 command results 产生，不得检查 private runtime state。

#### Scenario: Runtime event renders consistently

- **WHEN** interactive and headless modes receive equivalent runtime events
- **THEN** they render semantically equivalent text or stream-json output according to the selected output mode
- **中文** 当 interactive 与 headless modes 收到等价 runtime events 时，必须根据所选 output mode 渲染语义等价的 text 或 stream-json output。

#### Scenario: Error event remains structured

- **WHEN** a runtime invocation emits rejected, failed, cancelled, timeout, or policy-denied events
- **THEN** the interactive shell renders the user-visible summary while preserving structured event data for traces and tests
- **中文** 当 runtime invocation 发出 rejected、failed、cancelled、timeout 或 policy-denied events 时，interactive shell 必须渲染 user-visible summary，同时为 traces 与 tests 保留 structured event data。

### Requirement: Interactive CLI Acceptance Evidence

The first interactive CLI implementation SHALL provide deterministic acceptance evidence before archive.

第一个 interactive CLI 实现必须在 archive 前提供确定性验收证据。

#### Scenario: Interactive smoke covers prompt and exit

- **WHEN** e2e tests run the interactive shell with scripted input containing a prompt and `/exit`
- **THEN** the CLI exits successfully and output includes runtime-derived response evidence
- **中文** 当 e2e tests 使用包含 prompt 与 `/exit` 的脚本化输入运行 interactive shell 时，CLI 必须成功退出，且输出包含来自 runtime 的 response evidence。

#### Scenario: Interactive golden trace covers parity

- **WHEN** the golden replay suite runs for a minimal interactive prompt
- **THEN** normalized interactive events match the expected headless-compatible runtime event semantics
- **中文** 当 golden replay suite 运行最小 interactive prompt 时，normalized interactive events 必须匹配预期的 headless-compatible runtime event semantics。
