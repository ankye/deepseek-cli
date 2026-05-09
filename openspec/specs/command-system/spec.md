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

The CLI command system SHALL provide at least one command that delegates executable work to the runtime execution kernel.

CLI command system 必须提供至少一个 command，将 executable work 委托给 runtime execution kernel。

#### Scenario: CLI command invokes kernel

- **WHEN** a user runs the first kernel-backed CLI command
- **THEN** the command constructs or receives a runtime kernel and submits a governed invocation instead of executing the capability directly

#### Scenario: CLI handles kernel terminal events

- **WHEN** the kernel emits completed, failed, cancelled, or timeout events
- **THEN** CLI maps those events to process output and exit code without creating a separate execution lifecycle

### Requirement: CLI JSONL Event Output

The CLI command system SHALL support a JSONL output mode for kernel-backed runtime events.

CLI command system 必须支持 kernel-backed runtime events 的 JSONL output mode。

#### Scenario: Stream canonical runtime events

- **WHEN** the user runs the kernel-backed command with JSONL output
- **THEN** each emitted line is a serialized canonical runtime event with stable event type and trace metadata

### Requirement: CLI Commands Are Kernel Backed

CLI commands that trigger executable runtime work SHALL delegate to `RuntimeKernel` and SHALL NOT own direct execution state machines.

触发 executable runtime work 的 CLI commands 必须委托给 `RuntimeKernel`，不得拥有 direct execution state machines。

#### Scenario: Default prompt uses kernel

- **WHEN** a user runs the default CLI prompt command
- **THEN** the command emits kernel-backed runtime events and does not call legacy runtime direct execution

#### Scenario: CLI direct bypass fails lint

- **WHEN** CLI code directly calls model, capability, scheduler, policy, workflow, bus, command, skill, hook, MCP, plugin, or sandbox execution primitives
- **THEN** architecture lint fails before tests pass

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
