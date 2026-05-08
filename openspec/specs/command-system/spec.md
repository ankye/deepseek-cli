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

