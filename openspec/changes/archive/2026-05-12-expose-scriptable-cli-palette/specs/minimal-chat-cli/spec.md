## ADDED Requirements

### Requirement: CLI Usage Includes Palette Commands / CLI Usage 包含 Palette 命令

The CLI SHALL list scriptable palette commands in deterministic help output without treating them as chat prompts or model-visible slash commands.

CLI 必须在确定性的 help output 中列出可脚本化 palette commands，且不得将其视为 chat prompts 或 model-visible slash commands。

#### Scenario: Help lists palette commands / Help 列出 Palette 命令
- **WHEN** a user runs `deepseek --help`
- **THEN** usage output includes `palette list`, `palette keymap`, and `palette action` command forms
- **中文** 当用户运行 `deepseek --help` 时，usage output 必须包含 `palette list`、`palette keymap` 和 `palette action` 命令形式。

#### Scenario: Palette command does not start chat / Palette 命令不启动 Chat
- **WHEN** a user runs a `deepseek palette ...` command
- **THEN** the CLI routes it as a local scriptable command and does not start the chat prompt loop or submit a model request
- **中文** 当用户运行 `deepseek palette ...` 命令时，CLI 必须将其路由为本地脚本化命令，不得启动 chat prompt loop 或提交 model request。
