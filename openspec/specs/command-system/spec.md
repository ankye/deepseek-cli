# command-system Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Typed Command System

The platform SHALL define a typed command system for user-invoked commands, model-invoked commands where allowed, host commands, workflow commands, plugin-contributed commands, and skill-backed commands.

平台必须定义 typed command system，覆盖 user-invoked commands、允许范围内的 model-invoked commands、host commands、workflow commands、plugin-contributed commands 和 skill-backed commands。

#### Scenario: Register command contribution

- **WHEN** a built-in package, plugin, skill, workflow, or host adapter contributes a command
- **THEN** the command system validates identity, input schema, output schema, permissions, activation conditions, host support, and compatibility metadata

#### Scenario: Command routes through owning subsystem

- **WHEN** a command is invoked
- **THEN** it routes to the owning subsystem through platform contracts instead of directly mutating runtime, host UI, or session state

### Requirement: Command Invocation Modes

The command system SHALL support prompt-expansion commands, local execution commands, workflow commands, host UI commands, and control commands with explicit side-effect and permission metadata.

command system 必须支持 prompt-expansion commands、local execution commands、workflow commands、host UI commands 和 control commands，并包含显式 side-effect 与 permission metadata。

#### Scenario: Prompt command contributes context

- **WHEN** a prompt-expansion command is invoked
- **THEN** it contributes structured context nodes or prompt segments without gaining execution permissions by default

#### Scenario: Side-effecting command uses policy

- **WHEN** a command can mutate filesystem, process, network, workspace, memory, cache, session, or plugin state
- **THEN** the command routes through policy, approval, sandbox, audit, and concurrency boundaries

### Requirement: Host-Agnostic Command Results

Commands SHALL return structured command results that can be rendered by CLI, VSCode, JSON, replay, and future server transports.

commands 必须返回结构化 command results，可被 CLI、VSCode、JSON、replay 和未来 server transports 渲染。

#### Scenario: Command result renders in multiple hosts

- **WHEN** a command completes
- **THEN** it returns typed output, diagnostics, suggested actions, and redacted metadata without embedding terminal or editor UI objects

### Requirement: Command Discovery and Help Projection

The command system SHALL provide bounded command discovery, help projection, aliases, deprecation metadata, and capability-aware filtering.

command system 必须提供 bounded command discovery、help projection、aliases、deprecation metadata 和 capability-aware filtering。

#### Scenario: Disabled command is hidden from model projection

- **WHEN** a command is disabled, unsupported by the host, incompatible, untrusted, or denied by policy
- **THEN** it is excluded from model-visible and user-visible command projections according to the caller context

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

### Requirement: Local Readiness Command Roadmap / 本地可用性命令路线图

The command system SHALL place first-run and local readiness commands into R1 launch scope, including init, config/settings validation, credential setup or login, logout, doctor diagnostics, privacy settings, and install/package verification.

command system 必须把 first-run 与 local readiness commands 放入 R1 发布范围，包括 init、config/settings validation、credential setup 或 login、logout、doctor diagnostics、privacy settings 和 install/package verification。

#### Scenario: R1 readiness command uses platform contracts / R1 可用性命令使用平台契约

- **WHEN** a local readiness command runs
- **THEN** it uses shared command, platform, credential, policy, protocol, and diagnostic contracts rather than direct host-specific state mutation
- **中文** 当 local readiness command 运行时，必须使用共享 command、platform、credential、policy、protocol 和 diagnostic contracts，而不是直接修改 host-specific state。

#### Scenario: Readiness command is testable without live provider / 可用性命令无需 live provider 可测试

- **WHEN** R1 readiness smoke tests run
- **THEN** init, config validation, credential reference setup, doctor diagnostics, privacy settings, and install verification complete with deterministic fakes and redacted evidence
- **中文** 当 R1 readiness smoke tests 运行时，init、config validation、credential reference setup、doctor diagnostics、privacy settings 和 install verification 必须通过 deterministic fakes 与 redacted evidence 完成。

### Requirement: Concrete Readiness Command Registration / 具体可用性命令注册

The command system SHALL register local readiness commands with stable ids, input schemas, output schemas, side-effect metadata, host support, and compatibility metadata.

command system 必须注册 local readiness commands，并包含 stable ids、input schemas、output schemas、side-effect metadata、host support 和 compatibility metadata。

#### Scenario: Readiness command has schema / readiness command 有 schema

- **WHEN** a readiness command is registered
- **THEN** its manifest declares command id, input schema, output schema, side-effect level, permissions, host support, and compatibility range
- **中文** 当 readiness command 被注册时，其 manifest 必须声明 command id、input schema、output schema、side-effect level、permissions、host support 和 compatibility range。

#### Scenario: CLI invokes command through registry / CLI 通过 registry 调用命令

- **WHEN** CLI invokes a readiness command
- **THEN** it dispatches through the command system and renders the structured result instead of embedding command-specific state machines in CLI parsing
- **中文** 当 CLI 调用 readiness command 时，必须通过 command system dispatch 并渲染 structured result，而不是在 CLI parsing 中嵌入 command-specific state machines。

### Requirement: Chat Command Dispatch / Chat 命令分发

The command system SHALL define command metadata and routing behavior for minimal chat CLI controls and delegated commands.

command system 必须为 minimal chat CLI controls 与 delegated commands 定义 command metadata 和 routing behavior。

#### Scenario: Chat control has stable identity / 交互控制有稳定身份

- **WHEN** the chat shell exposes `/help`, `/exit`, `/quit`, `/clear`, or `/cancel`
- **THEN** each control has stable command identity, host support metadata, side-effect metadata, and deterministic help projection
- **中文** 当 chat shell 暴露 `/help`、`/exit`、`/quit`、`/clear` 或 `/cancel` 时，每个 control 必须具备 stable command identity、host support metadata、side-effect metadata 和 deterministic help projection。

#### Scenario: Side-effect command is delegated / 副作用命令被委托

- **WHEN** a chat command can mutate workspace, config, credentials, runtime execution, session, memory, cache, policy, or process state
- **THEN** it routes through the owning command/runtime/platform contract rather than being executed as an anonymous CLI string
- **中文** 当 chat command 可能修改 workspace、config、credentials、runtime execution、session、memory、cache、policy 或 process state 时，必须通过所属 command/runtime/platform contract 路由，而不是作为匿名 CLI string 执行。

### Requirement: Chat Command Results Are Host-Agnostic / Chat 命令结果与 Host 无关

Chat commands SHALL return structured results that can be rendered by CLI text, CLI JSONL, tests, and future VSCode/server host adapters.

chat commands 必须返回 structured results，可被 CLI text、CLI JSONL、tests 和未来 VSCode/server host adapters 渲染。

#### Scenario: Help projection is structured / help 投影是结构化的

- **WHEN** `/help` is invoked in the chat shell
- **THEN** the command result includes structured command names, aliases, descriptions, side-effect metadata, and host support without embedding terminal-only objects
- **中文** 当 `/help` 在 chat shell 中被调用时，command result 必须包含 structured command names、aliases、descriptions、side-effect metadata 和 host support，且不得嵌入 terminal-only objects。

#### Scenario: Unknown command returns typed error / 未知命令返回类型化错误

- **WHEN** the user enters an unsupported chat slash command
- **THEN** the command system returns a typed command error that the shell can render without throwing an unstructured exception
- **中文** 当用户输入不支持的 chat slash command 时，command system 必须返回 typed command error，使 shell 可以渲染而不是抛出非结构化异常。

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

### Requirement: Agent CLI Commands / Agent CLI 命令

The command system SHALL provide `deepseek run` and `deepseek chat` commands that submit work to runtime through platform contracts and render runtime events without owning model, tool, scheduler, or policy state machines. Under `--live`, these commands SHALL bind a runtime dependency bundle whose `platform`, `workspaceState`, and `codeIntelligence` are backed by the real host platform so model-emitted tool intents resolve against the real filesystem.

command system 必须提供 `deepseek run` 与 `deepseek chat` 命令，通过 platform contracts 向 runtime 提交工作，并渲染 runtime events，不得拥有 model、tool、scheduler 或 policy state machines。在 `--live` 下，这些命令必须绑定一个 runtime 依赖束，其中 `platform`、`workspaceState` 和 `codeIntelligence` 都由真实 host platform 支持，让模型发出的 tool intent 解析到真实文件系统。

#### Scenario: Run command submits one task / Run 命令提交一个任务

- **WHEN** a user executes `deepseek run "fix tests"` with valid configuration
- **THEN** the command creates a runtime request with task text, workspace scope, output mode, session options, and cancellation signal, then streams runtime events until the turn reaches a terminal state
- **中文** 当用户以有效配置执行 `deepseek run "fix tests"` 时，该命令必须创建包含 task text、workspace scope、output mode、session options 和 cancellation signal 的 runtime request，并串流 runtime events 直到 turn 达到终态。

#### Scenario: Chat command submits multiple turns / Chat 命令提交多个 turns

- **WHEN** a user executes `deepseek chat`
- **THEN** the command opens a chat prompt loop and submits each user message as a runtime turn using the active session id
- **中文** 当用户执行 `deepseek chat` 时，该命令必须打开 chat prompt loop，并使用 active session id 把每条 user message 提交为 runtime turn。

#### Scenario: Live run reads real files / Live run 读取真实文件

- **WHEN** a user executes `deepseek run --live` and the model emits a `core.file.read` tool intent for a workspace-relative path that exists on the real filesystem
- **THEN** the tool result feedback contains the real file contents from the host filesystem, not a fake-filesystem error
- **中文** 当用户执行 `deepseek run --live`，模型发出针对真实文件系统中存在路径的 `core.file.read` tool intent 时，tool result feedback 必须包含真实 host 文件内容，而不是 fake 文件系统错误。

### Requirement: Agent CLI Output Modes / Agent CLI 输出模式

The command system SHALL support text, JSON, and JSONL output modes for agent loop commands with stable exit codes and redacted diagnostics.

command system 必须为 agent loop commands 支持 text、JSON 和 JSONL output modes，并提供稳定 exit codes 与脱敏 diagnostics。

#### Scenario: JSONL output is stream-safe / JSONL 输出适合流式消费

- **WHEN** `deepseek run --output jsonl "inspect repo"` is executed
- **THEN** each runtime event is written as one JSON line and process exit code reflects terminal success, failure, cancellation, or usage error
- **中文** 当执行 `deepseek run --output jsonl "inspect repo"` 时，每个 runtime event 必须写成一行 JSON，且进程退出码反映 terminal success、failure、cancellation 或 usage error。

#### Scenario: JSON output summarizes final result / JSON 输出总结最终结果

- **WHEN** `deepseek run --output json "inspect repo"` completes
- **THEN** stdout contains a single JSON object with final status, assistant summary, trace id, session id, turn id, diagnostics, and redaction metadata
- **中文** 当 `deepseek run --output json "inspect repo"` 完成时，stdout 必须包含单个 JSON object，包含 final status、assistant summary、trace id、session id、turn id、diagnostics 和 redaction metadata。

### Requirement: Agent Command Configuration / Agent 命令配置

Agent CLI commands SHALL resolve model profile, credential reference, workspace root, policy profile, output mode, timeout, and live/offline mode through the shared config service and platform abstraction.

agent CLI commands 必须通过 shared config service 与 platform abstraction 解析 model profile、credential reference、workspace root、policy profile、output mode、timeout 和 live/offline mode。

#### Scenario: Missing configuration fails with guidance / 缺少配置时返回指引

- **WHEN** agent command configuration is missing a required model profile or credential for live mode
- **THEN** the command exits with a typed diagnostic, redacted details, and suggested setup command or environment variable
- **中文** 当 agent command configuration 缺少 live mode 必需的 model profile 或 credential 时，命令必须以 typed diagnostic、脱敏 details 和建议的 setup command 或 environment variable 退出。

### Requirement: Live CLI Dependency Factory / Live CLI 依赖 Factory

The CLI (and any future same-process host) SHALL obtain its live runtime dependencies from a single `createLiveCliDependencies` factory that composes a deterministic dependency bundle, then overrides `platform`, `workspaceState`, `codeIntelligence`, and `models` with real-platform implementations. Hosts SHALL NOT rebuild live wiring inline.

CLI（以及未来任何进程内 host）必须通过单一 `createLiveCliDependencies` factory 获取 live runtime 依赖；factory 先组合 deterministic 依赖束，然后用真实平台实现覆盖 `platform`、`workspaceState`、`codeIntelligence` 和 `models`。Host 不得内联重建 live wiring。

#### Scenario: Factory returns platform-overridden bundle / Factory 返回 platform 被覆盖的依赖束

- **WHEN** `createLiveCliDependencies({ workspaceRoot })` is called
- **THEN** the returned `RuntimeDependencies` has `platform`, `workspaceState`, and `codeIntelligence` constructed against a real `NodePlatformRuntime`, while all other keys mirror the deterministic factory
- **中文** 当调用 `createLiveCliDependencies({ workspaceRoot })` 时，返回的 `RuntimeDependencies` 必须让 `platform`、`workspaceState` 和 `codeIntelligence` 基于真实 `NodePlatformRuntime` 构造，其它键与 deterministic factory 一致。

#### Scenario: CLI delegates to factory under --live / CLI 在 --live 下委托到 factory

- **WHEN** `runCli` receives `--live` and calls `createCliAgentRuntime`
- **THEN** runtime construction delegates to `createLiveCliDependencies` so CLI code contains no inline live provider wiring beyond forwarding `workspaceRoot`, credential, and transport options
- **中文** 当 `runCli` 收到 `--live` 并调用 `createCliAgentRuntime` 时，runtime 构造必须委托到 `createLiveCliDependencies`，CLI 代码除了转发 `workspaceRoot`、credential 和 transport 选项外，不得包含内联 live provider wiring。

