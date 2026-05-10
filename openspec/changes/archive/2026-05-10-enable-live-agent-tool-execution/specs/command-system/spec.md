## MODIFIED Requirements

### Requirement: CLI Runtime Command Delegation

The CLI command system SHALL provide user-facing commands that delegate executable agent and tool work to the runtime execution kernel through the runtime-owned agent loop.

CLI command system 必须提供面向用户的 commands，通过 runtime-owned agent loop 把 executable agent 与 tool work 委托给 runtime execution kernel。

#### Scenario: CLI command invokes kernel

- **WHEN** a user runs the first kernel-backed CLI command
- **THEN** the command constructs or receives a runtime kernel and submits a governed invocation instead of executing the capability directly

#### Scenario: CLI handles kernel terminal events

- **WHEN** the kernel emits completed, failed, cancelled, or timeout events
- **THEN** CLI maps those events to process output and exit code without creating a separate execution lifecycle

#### Scenario: CLI live tool run delegates / CLI live 工具运行委托

- **WHEN** a user runs a live tool-enabled agent command
- **THEN** CLI passes prompt, output mode, live mode, policy profile, timeout, and tool-loop options to runtime and never calls model gateway or core tools directly
- **中文** 当用户运行 live tool-enabled agent command 时，CLI 必须把 prompt、output mode、live mode、policy profile、timeout 和 tool-loop options 传给 runtime，且不得直接调用 model gateway 或 core tools。

### Requirement: CLI JSONL Event Output

The CLI command system SHALL support a JSONL output mode for kernel-backed runtime events, including live tool intent, repair, policy, scheduler, tool result, continuation, and terminal events.

CLI command system 必须支持 kernel-backed runtime events 的 JSONL output mode，包括 live tool intent、repair、policy、scheduler、tool result、continuation 和 terminal events。

#### Scenario: Stream canonical runtime events

- **WHEN** the user runs the kernel-backed command with JSONL output
- **THEN** each emitted line is a serialized canonical runtime event with stable event type and trace metadata

#### Scenario: JSONL exposes tool-loop state / JSONL 暴露工具循环状态

- **WHEN** a live tool-enabled CLI run emits tool events
- **THEN** JSONL output includes canonical events for intent, repair, execution, result feedback, continuation, and terminal status without embedding terminal-only formatting
- **中文** 当 live tool-enabled CLI run 发出 tool events 时，JSONL output 必须包含 intent、repair、execution、result feedback、continuation 和 terminal status 的 canonical events，且不得嵌入 terminal-only formatting。

### Requirement: CLI Commands Are Kernel Backed

CLI commands that trigger executable runtime work SHALL delegate to `RuntimeKernel` and SHALL NOT own direct execution state machines, legacy prompt compatibility paths, or provider/tool bypasses.

触发 executable runtime work 的 CLI commands 必须委托给 `RuntimeKernel`，不得拥有 direct execution state machines、legacy prompt compatibility paths 或 provider/tool bypasses。

#### Scenario: Default prompt uses kernel

- **WHEN** a user runs the default CLI prompt command
- **THEN** the command emits kernel-backed runtime events and does not call legacy runtime direct execution

#### Scenario: CLI direct bypass fails lint

- **WHEN** CLI code directly calls model, capability, scheduler, policy, workflow, bus, command, skill, hook, MCP, plugin, or sandbox execution primitives
- **THEN** architecture lint fails before tests pass

#### Scenario: Legacy live tool aliases are absent / 旧 live tool aliases 不存在

- **WHEN** users inspect help or command parsing
- **THEN** only the current `run`, `chat`, and explicit smoke/readiness commands are exposed, and old direct prompt flags are not accepted
- **中文** 当用户查看 help 或 command parsing 时，只暴露当前 `run`、`chat` 和显式 smoke/readiness commands，旧 direct prompt flags 不被接受。

## ADDED Requirements

### Requirement: Live Tool Smoke Command / Live 工具 Smoke 命令

The CLI SHALL provide an explicit local command or documented `run` mode for testing the live-capable tool loop with deterministic fakes by default and live provider access only under explicit flags.

CLI 必须提供一个显式本地命令或文档化 `run` mode，用于测试 live-capable tool loop；默认使用 deterministic fakes，只有显式 flags 才访问 live provider。

#### Scenario: Deterministic tool smoke is offline / Deterministic 工具 smoke 离线

- **WHEN** users run the default tool-loop smoke command
- **THEN** it executes deterministic model/tool fixtures without network credentials and emits governed runtime events
- **中文** 当用户运行默认 tool-loop smoke command 时，它必须在无网络 credentials 下执行 deterministic model/tool fixtures，并发出受治理 runtime events。

#### Scenario: Live tool smoke is gated / Live 工具 smoke 受开关控制

- **WHEN** users run a live tool smoke without the required environment flag or credential reference
- **THEN** CLI reports a typed skipped or missing-credential diagnostic without calling the provider
- **中文** 当用户在没有必要环境变量或 credential reference 的情况下运行 live tool smoke 时，CLI 必须报告 typed skipped 或 missing-credential diagnostic，且不得调用 provider。
