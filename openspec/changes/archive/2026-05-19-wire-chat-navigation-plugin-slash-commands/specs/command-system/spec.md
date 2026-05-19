## ADDED Requirements

### Requirement: Navigation slash commands are structured local commands
The command system and CLI chat host SHALL treat `/file` and `/jump` as structured local commands backed by first-party plugin command adapters.

Command system 与 CLI chat host 必须将 `/file` 与 `/jump` 作为由一方 plugin command adapters 支撑的结构化 local commands。

#### Scenario: Navigation slash commands are not prompts
- **WHEN** a chat input line begins with `/file` or `/jump`
- **THEN** the chat host dispatches a local structured command and SHALL NOT submit the line as a model prompt
- **中文** 当 chat input line 以 `/file` 或 `/jump` 开头时，chat host 必须分发本地结构化命令，且不得将该行作为模型 prompt 提交。

#### Scenario: Navigation slash output preserves renderer parity
- **WHEN** chat runs a navigation slash command under `--output text`, `--output json`, or `--output jsonl`
- **THEN** it uses the same file/jump renderers as the top-level CLI commands, with JSONL wrapped in `chat.command.file` or `chat.command.jump` envelopes
- **中文** 当 chat 在 `--output text`、`--output json` 或 `--output jsonl` 下运行 navigation slash command 时，必须使用与顶层 CLI commands 相同的 file/jump renderers，并将 JSONL 包装在 `chat.command.file` 或 `chat.command.jump` envelopes 中。

#### Scenario: Navigation slash command failures remain local
- **WHEN** a navigation slash command has missing or invalid user input
- **THEN** the command returns typed local failure records or typed plugin diagnostics with no model request
- **中文** 当 navigation slash command 缺少或包含无效 user input 时，命令必须返回 typed local failure records 或 typed plugin diagnostics，且不得产生 model request。
