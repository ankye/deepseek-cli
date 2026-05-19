## MODIFIED Requirements

### Requirement: Jump navigator built-in plugin
The built-in plugin pack SHALL include a jump navigator plugin that contributes quick file, text, and symbol jumps through declarative plugin metadata and host-owned execution.

Built-in plugin pack 必须包含 jump navigator plugin，通过声明式 plugin metadata 与 host-owned execution 贡献 file、text 与 symbol jumps。

#### Scenario: Jump navigator routes are explicit
- **WHEN** jump navigator command routes are inspected
- **THEN** file, text, and symbol routes are dispatchable, carry fallback guidance where applicable, and remain free of plugin-private handlers
- **中文** 当 jump navigator command routes 被检查时，file、text 与 symbol routes 必须可 dispatch，按需携带 fallback guidance，并保持不包含 plugin-private handlers。

#### Scenario: Symbol jump returns code-intelligence targets
- **WHEN** `jump.navigator.symbol` executes through an owner route with a symbol query
- **THEN** the result includes a code-intelligence result list with typed file targets, line metadata, provider metadata, active target, diagnostics, and redaction metadata
- **中文** 当 `jump.navigator.symbol` 带 symbol query 通过 owner route 执行时，结果必须包含 code-intelligence result list，带 typed file targets、line metadata、provider metadata、active target、diagnostics 与 redaction metadata。

### Requirement: Navigation plugins expose scriptable CLI commands
File manager and jump navigator built-in plugins SHALL expose top-level CLI commands that execute through the same host-owned adapters as their owner routes.

File manager 与 jump navigator built-in plugins 必须暴露顶层 CLI commands，并通过与 owner routes 相同的 host-owned adapters 执行。

#### Scenario: File manager CLI commands return structured results
- **WHEN** a user runs `deepseek file list <query>`, `deepseek file preview <path|query>`, or `deepseek file refs <query>`
- **THEN** the CLI returns the typed file manager result in text, JSON, or JSONL output without plugin-private handlers
- **中文** 当用户运行 `deepseek file list <query>`、`deepseek file preview <path|query>` 或 `deepseek file refs <query>` 时，CLI 必须以 text、JSON 或 JSONL 返回 typed file manager result，且不得使用 plugin-private handlers。

#### Scenario: Jump navigator CLI commands return structured results
- **WHEN** a user runs `deepseek jump file <query>`, `deepseek jump text <query>`, or `deepseek jump symbol <query>`
- **THEN** file, text, and symbol jumps return active result lists in text, JSON, or JSONL output without submitting text to the agent model
- **中文** 当用户运行 `deepseek jump file <query>`、`deepseek jump text <query>` 或 `deepseek jump symbol <query>` 时，file、text 与 symbol jumps 必须以 text、JSON 或 JSONL 返回 active result lists，且不得把文本提交给 agent model。

#### Scenario: Missing query remains typed
- **WHEN** a user omits the required query for a file or jump command
- **THEN** the CLI returns a typed failed result with deterministic diagnostics and suggested actions instead of submitting text to the agent model
- **中文** 当用户遗漏 file 或 jump command 所需 query 时，CLI 必须返回带确定性 diagnostics 与 suggested actions 的 typed failed result，而不是把文本提交给 agent model。

### Requirement: Navigation plugins expose chat slash commands
File manager and jump navigator built-in plugins SHALL expose chat slash commands that execute locally through the same host-owned adapters as their CLI commands and owner routes.

File manager 与 jump navigator built-in plugins 必须暴露 chat slash commands，并通过与 CLI commands 和 owner routes 相同的 host-owned adapters 本地执行。

#### Scenario: File slash command returns file manager results
- **WHEN** a user enters `/file list <query>`, `/file preview <path|query>`, or `/file refs <query>` in chat
- **THEN** chat returns typed file manager output in text, JSON, or JSONL without submitting the slash text to the agent model
- **中文** 当用户在 chat 中输入 `/file list <query>`、`/file preview <path|query>` 或 `/file refs <query>` 时，chat 必须返回 typed file manager output，支持 text、JSON 或 JSONL，且不得将 slash 文本提交给 agent model。

#### Scenario: Jump slash command returns jump navigator results
- **WHEN** a user enters `/jump file <query>`, `/jump text <query>`, or `/jump symbol <query>` in chat
- **THEN** file, text, and symbol jumps return active result lists through local host-owned execution without submitting the slash text to the agent model
- **中文** 当用户在 chat 中输入 `/jump file <query>`、`/jump text <query>` 或 `/jump symbol <query>` 时，file、text 与 symbol jumps 必须通过本地 host-owned execution 返回 active result lists，且不得将 slash 文本提交给 agent model。

#### Scenario: Navigation slash missing query is typed
- **WHEN** a user omits the required query for `/file` or `/jump`
- **THEN** chat returns deterministic local diagnostics and suggested actions instead of creating an agent turn
- **中文** 当用户遗漏 `/file` 或 `/jump` 所需 query 时，chat 必须返回确定性的 local diagnostics 与 suggested actions，而不是创建 agent turn。
