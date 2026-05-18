## ADDED Requirements

### Requirement: TUI Viewport Follows Terminal Profile / TUI Viewport 遵循终端 Profile

The production TUI framework SHALL derive viewport, prompt, key input, color, unicode, and degradation behavior from the terminal capability profile.

Production TUI framework 必须从 terminal capability profile 派生 viewport、prompt、key input、color、unicode 与 degradation behavior。

#### Scenario: Interactive profile enables TUI viewport / Interactive Profile 启用 TUI Viewport

- **WHEN** the terminal profile has text output, TTY stdin/stdout, `interactive` renderer, reliable input, and non-structured output
- **THEN** the TUI framework enables interactive viewport status and prompt rendering according to the profile
- **中文** 当 terminal profile 具备 text output、TTY stdin/stdout、`interactive` renderer、可靠 input 与非结构化 output 时，TUI framework 必须按 profile 启用 interactive viewport status 与 prompt rendering。

#### Scenario: Degraded profile disables terminal-only controls / 降级 Profile 禁用终端专属控制

- **WHEN** terminal profile indicates JSON, JSONL, scripted input, CI, redirected IO, no stdin TTY, no stdout TTY, or unreliable interactive support
- **THEN** the TUI framework disables terminal-only prompts, viewport status, key handling, cursor movement, and alternate screen controls
- **中文** 当 terminal profile 表示 JSON、JSONL、scripted input、CI、redirected IO、无 stdin TTY、无 stdout TTY 或 interactive support 不可靠时，TUI framework 必须禁用 terminal-only prompts、viewport status、key handling、cursor movement 与 alternate screen controls。

### Requirement: TUI Structured Output Absence / TUI 结构化输出缺席

The production TUI framework SHALL never leak terminal-only UX into JSON, JSONL, scripted, CI, or redirected output.

Production TUI framework 绝不能把 terminal-only UX 泄漏到 JSON、JSONL、scripted、CI 或 redirected output 中。

#### Scenario: JSONL remains machine-readable / JSONL 保持机器可读

- **WHEN** chat local commands or prompt turns run with JSONL output
- **THEN** every emitted line is a JSON record and no line contains prompt markers, TUI status prose, ANSI escape sequences, or alternate-screen controls
- **中文** 当 chat local commands 或 prompt turns 以 JSONL output 运行时，每一行都必须是 JSON record，且不得包含 prompt markers、TUI status prose、ANSI escape sequences 或 alternate-screen controls。
