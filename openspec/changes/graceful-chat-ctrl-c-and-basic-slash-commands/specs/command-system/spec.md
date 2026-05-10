## MODIFIED Requirements

### Requirement: Chat Command Dispatch / Chat 命令分发

The command system SHALL define command metadata and routing behavior for minimal chat CLI controls and delegated commands, and SHALL provide a deterministic text renderer `renderInteractiveControlText(result)` so every host adapter (CLI today, VSCode and servers later) can render the same control results.

command system 必须为 minimal chat CLI controls 与 delegated commands 定义 command metadata 和 routing behavior，并必须提供确定性文本渲染器 `renderInteractiveControlText(result)`，使所有 host adapter（现在 CLI、未来 VSCode 与 server）都能渲染同一套 control 结果。

#### Scenario: Chat control has stable identity / 交互控制有稳定身份

- **WHEN** the chat shell exposes `/help`, `/exit`, `/quit`, `/clear`, or `/cancel`
- **THEN** each control has stable command identity, host support metadata, side-effect metadata, and deterministic help projection
- **中文** 当 chat shell 暴露 `/help`、`/exit`、`/quit`、`/clear` 或 `/cancel` 时，每个 control 必须具备 stable command identity、host support metadata、side-effect metadata 和 deterministic help projection。

#### Scenario: Side-effect command is delegated / 副作用命令被委托

- **WHEN** a chat command can mutate workspace, config, credentials, runtime execution, session, memory, cache, policy, or process state
- **THEN** it routes through the owning command/runtime/platform contract rather than being executed as an anonymous CLI string
- **中文** 当 chat command 可能修改 workspace、config、credentials、runtime execution、session、memory、cache、policy 或 process state 时，必须通过所属 command/runtime/platform contract 路由，而不是作为匿名 CLI string 执行。

#### Scenario: Interactive result has deterministic text renderer / 交互结果有确定性文本渲染器

- **WHEN** any host adapter needs to display an `InteractiveControlResult`
- **THEN** it SHALL call `renderInteractiveControlText(result)` exported from `@deepseek/command-system` and render the returned lines in order, without reading private fields of the result
- **中文** 当任何 host adapter 需要展示 `InteractiveControlResult` 时，必须调用 `@deepseek/command-system` 导出的 `renderInteractiveControlText(result)`，按顺序渲染返回的行，不得读取 result 的私有字段。
