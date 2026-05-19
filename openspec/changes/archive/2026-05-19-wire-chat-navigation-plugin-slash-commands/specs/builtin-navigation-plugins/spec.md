## ADDED Requirements

### Requirement: Navigation plugins expose chat slash commands
File manager and jump navigator built-in plugins SHALL expose chat slash commands that execute locally through the same host-owned adapters as their CLI commands and owner routes.

File manager 与 jump navigator built-in plugins 必须暴露 chat slash commands，并通过与 CLI commands 和 owner routes 相同的 host-owned adapters 本地执行。

#### Scenario: File slash command returns file manager results
- **WHEN** a user enters `/file list <query>`, `/file preview <path|query>`, or `/file refs <query>` in chat
- **THEN** chat returns typed file manager output in text, JSON, or JSONL without submitting the slash text to the agent model
- **中文** 当用户在 chat 中输入 `/file list <query>`、`/file preview <path|query>` 或 `/file refs <query>` 时，chat 必须返回 typed file manager output，支持 text、JSON 或 JSONL，且不得将 slash 文本提交给 agent model。

#### Scenario: Jump slash command returns jump navigator results
- **WHEN** a user enters `/jump file <query>`, `/jump text <query>`, or `/jump symbol <query>` in chat
- **THEN** file and text jumps return active result lists while symbol jump returns the same deferred code-intelligence diagnostics as the CLI command
- **中文** 当用户在 chat 中输入 `/jump file <query>`、`/jump text <query>` 或 `/jump symbol <query>` 时，file 与 text jumps 必须返回 active result lists，而 symbol jump 必须返回与 CLI command 相同的 deferred code-intelligence diagnostics。

#### Scenario: Navigation slash missing query is typed
- **WHEN** a user omits the required query for `/file` or `/jump`
- **THEN** chat returns deterministic local diagnostics and suggested actions instead of creating an agent turn
- **中文** 当用户遗漏 `/file` 或 `/jump` 所需 query 时，chat 必须返回确定性的 local diagnostics 与 suggested actions，而不是创建 agent turn。
