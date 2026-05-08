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

### Requirement: CLI Stream JSON Compatibility

The CLI command system SHALL support a stream-json output mode for kernel-backed runtime events.

CLI command system 必须支持 kernel-backed runtime events 的 stream-json output mode。

#### Scenario: Stream canonical runtime events

- **WHEN** the user runs the kernel-backed command with stream-json output
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

