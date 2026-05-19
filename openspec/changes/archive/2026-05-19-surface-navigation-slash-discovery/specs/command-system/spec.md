## ADDED Requirements

### Requirement: Navigation slash commands are discoverable in chat help
The command system SHALL include `/file` and `/jump` local navigation workflows in chat help output.

Command system 必须在 chat help output 中包含 `/file` 与 `/jump` local navigation workflows。

#### Scenario: Chat help lists file and jump workflows
- **WHEN** a user invokes `/help` in chat
- **THEN** the text help lists `/file list|preview|refs <query>` and `/jump file|text|symbol <query>` as local workflows
- **中文** 当用户在 chat 中调用 `/help` 时，text help 必须将 `/file list|preview|refs <query>` 与 `/jump file|text|symbol <query>` 列为 local workflows。

#### Scenario: Help remains local
- **WHEN** `/help` lists navigation slash commands
- **THEN** the chat host SHALL NOT submit help discovery text or navigation slash documentation to the model
- **中文** 当 `/help` 列出 navigation slash commands 时，chat host 不得将 help discovery 文本或 navigation slash documentation 提交给模型。
