## ADDED Requirements

### Requirement: Navigation plugins expose scriptable CLI commands
File manager and jump navigator built-in plugins SHALL expose top-level CLI commands that execute through the same host-owned adapters as their owner routes.

File manager 与 jump navigator built-in plugins 必须暴露顶层 CLI commands，并通过与 owner routes 相同的 host-owned adapters 执行。

#### Scenario: File manager CLI commands return structured results
- **WHEN** a user runs `deepseek file list <query>`, `deepseek file preview <path|query>`, or `deepseek file refs <query>`
- **THEN** the CLI returns the typed file manager result in text, JSON, or JSONL output without plugin-private handlers
- **中文** 当用户运行 `deepseek file list <query>`、`deepseek file preview <path|query>` 或 `deepseek file refs <query>` 时，CLI 必须以 text、JSON 或 JSONL 返回 typed file manager result，且不得使用 plugin-private handlers。

#### Scenario: Jump navigator CLI commands return structured results
- **WHEN** a user runs `deepseek jump file <query>`, `deepseek jump text <query>`, or `deepseek jump symbol <query>`
- **THEN** file and text jumps return active file result lists, while symbol jump returns deferred code-intelligence diagnostics
- **中文** 当用户运行 `deepseek jump file <query>`、`deepseek jump text <query>` 或 `deepseek jump symbol <query>` 时，file 与 text jumps 必须返回 active file result lists，而 symbol jump 必须返回 deferred code-intelligence diagnostics。

#### Scenario: Missing query remains typed
- **WHEN** a user omits the required query for a file or jump command
- **THEN** the CLI returns a typed failed result with deterministic diagnostics and suggested actions instead of submitting text to the agent model
- **中文** 当用户遗漏 file 或 jump command 所需 query 时，CLI 必须返回带确定性 diagnostics 与 suggested actions 的 typed failed result，而不是把文本提交给 agent model。
