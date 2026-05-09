## ADDED Requirements

### Requirement: Interactive Command Dispatch / 交互式命令分发

The command system SHALL define command metadata and routing behavior for minimal interactive CLI controls and delegated commands.

command system 必须为 minimal interactive CLI controls 与 delegated commands 定义 command metadata 和 routing behavior。

#### Scenario: Interactive control has stable identity / 交互控制有稳定身份

- **WHEN** the interactive shell exposes `/help`, `/exit`, `/quit`, `/clear`, or `/cancel`
- **THEN** each control has stable command identity, host support metadata, side-effect metadata, and deterministic help projection
- **中文** 当 interactive shell 暴露 `/help`、`/exit`、`/quit`、`/clear` 或 `/cancel` 时，每个 control 必须具备 stable command identity、host support metadata、side-effect metadata 和 deterministic help projection。

#### Scenario: Side-effect command is delegated / 副作用命令被委托

- **WHEN** an interactive command can mutate workspace, config, credentials, runtime execution, session, memory, cache, policy, or process state
- **THEN** it routes through the owning command/runtime/platform contract rather than being executed as an anonymous CLI string
- **中文** 当 interactive command 可能修改 workspace、config、credentials、runtime execution、session、memory、cache、policy 或 process state 时，必须通过所属 command/runtime/platform contract 路由，而不是作为匿名 CLI string 执行。

### Requirement: Interactive Command Results Are Host-Agnostic / 交互命令结果与 Host 无关

Interactive commands SHALL return structured results that can be rendered by CLI text, CLI stream-json, tests, and future VSCode/server host adapters.

interactive commands 必须返回 structured results，可被 CLI text、CLI stream-json、tests 和未来 VSCode/server host adapters 渲染。

#### Scenario: Help projection is structured / help 投影是结构化的

- **WHEN** `/help` is invoked in the interactive shell
- **THEN** the command result includes structured command names, aliases, descriptions, side-effect metadata, and host support without embedding terminal-only objects
- **中文** 当 `/help` 在 interactive shell 中被调用时，command result 必须包含 structured command names、aliases、descriptions、side-effect metadata 和 host support，且不得嵌入 terminal-only objects。

#### Scenario: Unknown command returns typed error / 未知命令返回类型化错误

- **WHEN** the user enters an unsupported interactive slash command
- **THEN** the command system returns a typed command error that the shell can render without throwing an unstructured exception
- **中文** 当用户输入不支持的 interactive slash command 时，command system 必须返回 typed command error，使 shell 可以渲染而不是抛出非结构化异常。
