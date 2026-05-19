# builtin-navigation-plugins Specification

## Purpose
TBD - created by archiving change ship-file-manager-jump-navigator-plugins. Update Purpose after archive.
## Requirements
### Requirement: File manager built-in plugin
The built-in plugin pack SHALL include a read-only file manager plugin that contributes file list, file preview, and file reference workflows through declarative plugin metadata.

Built-in plugin pack 必须包含一个只读 file manager plugin，通过声明式 plugin metadata 贡献 file list、file preview 与 file reference workflows。

#### Scenario: File manager commands produce file targets
- **WHEN** `file.manager.list`, `file.manager.preview`, or `file.manager.references` executes through an owner route
- **THEN** the result includes typed file targets, result-list metadata when applicable, reference targets, diagnostics, and redaction metadata without plugin-private handlers
- **中文** 当 `file.manager.list`、`file.manager.preview` 或 `file.manager.references` 通过 owner route 执行时，结果必须包含 typed file targets、适用时的 result-list metadata、reference targets、diagnostics 与 redaction metadata，且不得使用 plugin-private handlers。

### Requirement: Jump navigator built-in plugin
The built-in plugin pack SHALL include a jump navigator plugin that contributes quick file and text jumps and exposes symbol jump as a deferred code-intelligence route.

Built-in plugin pack 必须包含 jump navigator plugin，贡献快速 file/text jumps，并将 symbol jump 暴露为 deferred code-intelligence route。

#### Scenario: Jump navigator routes are explicit
- **WHEN** jump navigator command routes are inspected
- **THEN** file and text routes are dispatchable, symbol routes are marked deferred, and all routes carry fallback guidance
- **中文** 当 jump navigator command routes 被检查时，file 与 text routes 必须可 dispatch，symbol routes 必须标记为 deferred，并且所有 routes 都携带 fallback guidance。

### Requirement: Navigation plugins stay native in the workbench
File manager and jump navigator plugin executions SHALL appear in palette, TUI workbench, plugin shelf, activity feed, and extension inspection surfaces like other built-in plugins.

File manager 与 jump navigator plugin executions 必须像其他 built-in plugins 一样出现在 palette、TUI workbench、plugin shelf、activity feed 与 extension inspection surfaces。

#### Scenario: Navigation plugin execution attaches active results
- **WHEN** an implemented navigation plugin route returns a result list
- **THEN** the interactive plugin workbench attaches it as the active result list and projects the plugin's last execution status
- **中文** 当 implemented navigation plugin route 返回 result list 时，interactive plugin workbench 必须将其作为 active result list 附加，并投影该插件最近 execution status。

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
