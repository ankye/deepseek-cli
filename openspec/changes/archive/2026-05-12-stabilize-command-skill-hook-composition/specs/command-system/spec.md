## ADDED Requirements

### Requirement: Command Composition Metadata / 命令组合元数据

Command manifests SHALL expose additive composition metadata for owner subsystem, contribution source, permissions, side-effect level, compatibility, projection visibility, and result-list target identity.

Command manifests 必须暴露增量 composition metadata，包含 owner subsystem、contribution source、permissions、side-effect level、compatibility、projection visibility 和 result-list target identity。

#### Scenario: Existing command remains invocable / 现有命令仍可调用
- **WHEN** a command manifest lacks optional composition metadata
- **THEN** command invocation remains compatible and the composition layer fills conservative defaults for projection
- **中文** 当 command manifest 缺少可选 composition metadata 时，command invocation 必须保持兼容，composition layer 为 projection 填充保守默认值。

#### Scenario: Command metadata feeds projection / 命令元数据进入投影
- **WHEN** a command manifest declares owner, permissions, side effects, and projection visibility
- **THEN** the composition layer projects those fields without invoking the command handler
- **中文** 当 command manifest 声明 owner、permissions、side effects 和 projection visibility 时，composition layer 必须投影这些字段，且不调用 command handler。

### Requirement: Slash Command Projection / Slash 命令投影

The command system SHALL provide a structured slash command projection for chat and CLI help based on composition records.

Command system 必须基于 composition records 为 chat 和 CLI help 提供 structured slash command projection。

#### Scenario: Chat help uses composition records / Chat Help 使用组合记录
- **WHEN** chat help projects slash commands
- **THEN** it uses composition records with stable ids, aliases, side effects, host support, and redaction metadata instead of hard-coded prose-only entries
- **中文** 当 chat help 投影 slash commands 时，必须使用带 stable ids、aliases、side effects、host support 和 redaction metadata 的 composition records，而不是硬编码纯文本 entries。

#### Scenario: Model projection excludes host controls / 模型投影排除 Host 控制
- **WHEN** model-visible command projection is requested
- **THEN** host lifecycle controls such as `/exit`, `/clear`, and `/cancel` are excluded unless a future owner explicitly exposes a safe model command
- **中文** 当请求 model-visible command projection 时，`/exit`、`/clear`、`/cancel` 等 host lifecycle controls 必须被排除，除非未来 owner 显式暴露安全 model command。
