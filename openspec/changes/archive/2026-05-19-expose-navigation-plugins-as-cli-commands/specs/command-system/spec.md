## ADDED Requirements

### Requirement: Navigation plugin CLI command projection
The CLI command system SHALL parse, dispatch, and document file manager and jump navigator plugin commands as structured local commands.

CLI command system 必须将 file manager 与 jump navigator plugin commands 作为结构化 local commands 进行 parse、dispatch 与 document。

#### Scenario: Help lists executable navigation commands
- **WHEN** a user runs `deepseek help`
- **THEN** help output lists `deepseek file list|preview|refs` and `deepseek jump file|text|symbol` only when those commands are parseable and dispatchable through CLI host adapters
- **中文** 当用户运行 `deepseek help` 时，help output 必须列出 `deepseek file list|preview|refs` 与 `deepseek jump file|text|symbol`，且仅在这些 commands 可 parse 并可通过 CLI host adapters dispatch 时列出。

#### Scenario: Parser produces typed navigation options
- **WHEN** CLI args begin with `file` or `jump`
- **THEN** `parseCliArgs` returns typed `CliOptions` carrying command-specific action and input fields rather than falling back to generic help or agent run mode
- **中文** 当 CLI args 以 `file` 或 `jump` 开头时，`parseCliArgs` 必须返回带 command-specific action 与 input fields 的 typed `CliOptions`，而不是回退到 generic help 或 agent run mode。

#### Scenario: Navigation command output mode parity
- **WHEN** a file or jump CLI command is invoked with `--output text`, `--output json`, or `--output jsonl`
- **THEN** the selected renderer emits deterministic structured output with redaction metadata and no terminal-only private state
- **中文** 当 file 或 jump CLI command 使用 `--output text`、`--output json` 或 `--output jsonl` 调用时，所选 renderer 必须输出带 redaction metadata 的确定性结构化结果，且不得包含 terminal-only private state。
