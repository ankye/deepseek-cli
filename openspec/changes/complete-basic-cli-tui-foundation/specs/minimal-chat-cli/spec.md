## ADDED Requirements

### Requirement: Basic Line TUI Shell / 基础行式 TUI Shell

The chat shell SHALL provide a basic line-oriented TUI foundation in text TTY sessions, including a deterministic startup status, visible prompt, and prompt redraw after local commands or completed turns.

Chat shell 必须在 text TTY sessions 中提供基础行式 TUI 基座，包括确定性的启动状态、可见 prompt，以及 local commands 或 completed turns 后的 prompt redraw。

#### Scenario: Interactive chat shows startup status and prompt / 交互式 Chat 显示启动状态与 Prompt

- **WHEN** a user starts `deepseek chat` with text output and reliable TTY line input
- **THEN** the shell renders a compact status line derived from terminal profile and chat state, then renders a visible prompt before waiting for input
- **中文** 当用户以 text output 和可靠 TTY line input 启动 `deepseek chat` 时，shell 必须渲染基于 terminal profile 与 chat state 的紧凑状态行，然后在等待输入前渲染可见 prompt。

#### Scenario: Prompt redraw follows local commands / 本地命令后重绘 Prompt

- **WHEN** a user enters a local slash command such as `/help`, `/mode`, `/palette`, `/history`, or `/cost`
- **THEN** the shell renders that command locally and then redraws the prompt without submitting slash text to the model
- **中文** 当用户输入 `/help`、`/mode`、`/palette`、`/history` 或 `/cost` 等本地 slash command 时，shell 必须本地渲染该命令，然后重绘 prompt，不得将 slash text 提交给 model。

#### Scenario: Prompt redraw follows runtime turn / Runtime Turn 后重绘 Prompt

- **WHEN** a normal prompt turn completes, fails, or is cancelled
- **THEN** text TTY chat renders the terminal event summary and then redraws the prompt for the next line
- **中文** 当普通 prompt turn completed、failed 或 cancelled 时，text TTY chat 必须渲染 terminal event summary，然后为下一行重绘 prompt。

#### Scenario: Structured and scripted modes remain prompt-free / 结构化与脚本模式保持无 Prompt

- **WHEN** chat runs with JSON, JSONL, redirected IO, CI, or scripted input
- **THEN** startup status, prompt text, cursor controls, alternate-screen controls, and terminal-only hints are omitted while command/runtime semantics remain unchanged
- **中文** 当 chat 以 JSON、JSONL、redirected IO、CI 或 scripted input 运行时，必须省略 startup status、prompt text、cursor controls、alternate-screen controls 与 terminal-only hints，同时保持 command/runtime 语义不变。
