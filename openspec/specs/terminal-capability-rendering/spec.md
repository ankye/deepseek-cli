# terminal-capability-rendering Specification

## Purpose
TBD - created by archiving change split-cli-host-and-architecture-scale-guardrails. Update Purpose after archive.
## Requirements
### Requirement: Terminal Capability Profile / 终端能力 Profile

The CLI SHALL detect terminal capabilities and select a renderer profile that preserves deterministic output across text, interactive, JSON, and JSONL modes. Interactive text profiles MAY render deterministic workbench frames, but structured output MUST remain free of ANSI styling, cursor controls, alternate-screen state, and terminal-only layout metadata.

CLI 必须检测 terminal capabilities，并选择 renderer profile，使 text、interactive、JSON 与 JSONL modes 保持确定性输出。Interactive text profiles 可以渲染确定性 workbench frames，但 structured output 不得包含 ANSI styling、cursor controls、alternate-screen state 或 terminal-only layout metadata。

#### Scenario: Structured output remains terminal independent

- **WHEN** output mode is JSON or JSONL
- **THEN** the renderer profile is structured, output contains schema-versioned data only, and no TUI workbench frame lines or terminal controls are emitted
- **中文** 当 output mode 是 JSON 或 JSONL 时，renderer profile 必须是 structured，输出只包含 schema-versioned data，不得发出 TUI workbench frame lines 或 terminal controls。

#### Scenario: Interactive text can render workbench frames

- **WHEN** output mode is text, stdin/stdout are TTY, and the terminal profile supports interactive line input
- **THEN** the renderer profile can expose deterministic workbench frame lines with bounded layout, focus, command bar, reasoning, inspector, activity, and plugin summaries
- **中文** 当 output mode 是 text、stdin/stdout 是 TTY 且 terminal profile 支持 interactive line input 时，renderer profile 可以暴露确定性 workbench frame lines，包含有界 layout、focus、command bar、reasoning、inspector、activity 与 plugin summaries。

### Requirement: Renderer Profiles / Renderer Profiles

The CLI SHALL select renderer behavior through explicit profiles including `plain`, `ansi`, `interactive`, `full-screen`, `json`, and `jsonl`.

CLI 必须通过显式 profiles 选择 renderer 行为，包括 `plain`、`ansi`、`interactive`、`full-screen`、`json` 和 `jsonl`。

#### Scenario: Structured modes bypass rich terminal rendering / 结构化模式绕过 Rich 终端渲染

- **WHEN** the user selects JSON or JSONL output, or output is redirected to a non-TTY structured consumer
- **THEN** the CLI emits deterministic structured records without ANSI decoration, spinners, alternate screens, prompts, raw key events, full-screen frames, or terminal cursor controls
- **中文** 当用户选择 JSON 或 JSONL output，或 output 被重定向到 non-TTY structured consumer 时，CLI 必须输出确定性的结构化 records，不得包含 ANSI decoration、spinners、alternate screens、prompts、raw key events、full-screen frames 或 terminal cursor controls。

#### Scenario: Interactive profile requires capability support / Interactive Profile 要求能力支持

- **WHEN** the CLI selects an interactive or full-screen renderer
- **THEN** the terminal profile confirms compatible TTY streams, width handling, color or plain fallback, raw input support when needed, teardown support, and reliable degradation behavior
- **中文** 当 CLI 选择 interactive 或 full-screen renderer 时，terminal profile 必须确认兼容的 TTY streams、width handling、color 或 plain fallback、必要时的 raw input support、teardown support，以及可靠降级行为。

### Requirement: Input Strategy Profiles / 输入策略 Profiles

The CLI SHALL select input behavior through explicit strategies including `line`, `raw`, `scripted`, and `none`, and SHALL expose typed degradation evidence when a requested strategy cannot be used.

CLI 必须通过显式 strategies 选择输入行为，包括 `line`、`raw`、`scripted` 和 `none`；当请求的 strategy 不可用时，必须暴露类型化 degradation evidence。

#### Scenario: Raw input gates vi-inspired controls / Raw 输入门控 vi-inspired 控制

- **WHEN** vi-inspired modal controls, keymaps, full-screen navigation, or plugin leader shortcuts require raw input
- **THEN** they are enabled only when the terminal capability profile declares raw input reliable for the current host and the user/config has not disabled raw mode
- **中文** 当 vi-inspired modal controls、keymaps、full-screen navigation 或 plugin leader shortcuts 需要 raw input 时，只有 terminal capability profile 声明当前 host raw input 可靠，且 user/config 未禁用 raw mode 时才能启用。

### Requirement: Cross-Platform Terminal Fixtures / 跨平台终端 Fixtures

Terminal behavior SHALL be covered by deterministic profile fixtures rather than only by the developer's live terminal.

终端行为必须由确定性的 profile fixtures 覆盖，而不能只依赖开发者当前 live terminal。

#### Scenario: Platform profiles are tested / 平台 Profile 被测试

- **WHEN** terminal capability and rendering tests run
- **THEN** fixtures cover Windows Terminal, PowerShell, cmd, ConPTY-like TTY, macOS/Linux TTY, CI, non-TTY pipes, redirected output, remote or unknown width, and no-color environments where applicable
- **中文** 当 terminal capability 与 rendering tests 运行时，fixtures 必须覆盖 Windows Terminal、PowerShell、cmd、类似 ConPTY 的 TTY、macOS/Linux TTY、CI、non-TTY pipes、redirected output、remote 或 unknown width，以及适用的 no-color environments。

#### Scenario: Width and unicode are deterministic / 宽度与 Unicode 行为确定

- **WHEN** renderer golden tests normalize terminal output
- **THEN** width-sensitive layout, unicode fallback, ANSI stripping, and line wrapping are derived from the terminal profile fixture
- **中文** 当 renderer golden tests 规范化 terminal output 时，width-sensitive layout、unicode fallback、ANSI stripping 和 line wrapping 必须从 terminal profile fixture 派生。

### Requirement: Approval Rendering Uses Terminal Profile / 审批渲染使用终端 Profile

Approval prompts and summaries SHALL be selected from terminal capability, renderer profile, input strategy, output mode, and user preferences.

approval prompts 与 summaries 必须基于 terminal capability、renderer profile、input strategy、output mode 和 user preferences 选择。

#### Scenario: Interactive approval requires reliable input / 交互审批要求可靠输入

- **WHEN** the CLI wants to show an interactive approval prompt
- **THEN** the terminal profile must declare compatible TTY streams and reliable line or raw input; otherwise the CLI degrades to structured output, plain non-interactive summary, injected broker, or fail-closed denial
- **中文** 当 CLI 想显示 interactive approval prompt 时，terminal profile 必须声明兼容 TTY streams 以及可靠 line 或 raw input；否则 CLI 必须降级为 structured output、plain non-interactive summary、injected broker 或 fail-closed denial。

#### Scenario: Narrow or no-color terminal remains readable / 窄屏或无色终端仍可读

- **WHEN** approval summaries render in narrow width, no-color, unknown-width, CI, or redirected output profiles
- **THEN** output uses deterministic wrapping, no required color semantics, no cursor movement, and no alternate-screen state
- **中文** 当 approval summaries 在 narrow width、no-color、unknown-width、CI 或 redirected output profiles 中渲染时，output 必须使用确定性换行、不依赖颜色语义、不移动光标且不使用 alternate-screen state。

### Requirement: Approval Terminal Fixtures / 审批终端 Fixtures

Approval rendering SHALL be covered by deterministic terminal profile fixtures.

approval rendering 必须由确定性 terminal profile fixtures 覆盖。

#### Scenario: Cross-platform approval profiles are tested / 跨平台审批 Profile 被测试

- **WHEN** approval renderer tests run
- **THEN** fixtures cover Windows Terminal, PowerShell/cmd-like profiles, macOS/Linux TTY, CI, non-TTY pipes, redirected output, no-color, unknown width, and unsupported raw input where applicable
- **中文** 当 approval renderer tests 运行时，fixtures 必须按需覆盖 Windows Terminal、PowerShell/cmd-like profiles、macOS/Linux TTY、CI、non-TTY pipes、redirected output、no-color、unknown width 和 unsupported raw input。

### Requirement: Full-Screen Terminal Lifecycle / Full-Screen 终端生命周期

Full-screen rendering SHALL have deterministic lifecycle records for setup, repaint, resize, teardown, cancellation, and degradation.

Full-screen rendering 必须为 setup、repaint、resize、teardown、cancellation 与 degradation 提供确定性的 lifecycle records。

#### Scenario: Teardown is guaranteed / Teardown 有保障

- **WHEN** a full-screen session exits normally, errors, receives SIGINT, or falls back to line mode
- **THEN** the renderer leaves alternate screen, restores cursor visibility, flushes pending output, records teardown evidence, and does not leave terminal state corrupted
- **中文** 当 full-screen session 正常退出、出错、收到 SIGINT 或 fallback 到 line mode 时，renderer 必须离开 alternate screen、恢复 cursor visibility、flush pending output、记录 teardown evidence，且不得留下损坏的 terminal state。

#### Scenario: Resize recomputes layout / Resize 重新计算布局

- **WHEN** terminal size changes during full-screen interaction
- **THEN** the renderer recomputes region bounds, scroll offsets, command bar width, and visible truncation deterministically without losing active focus
- **中文** 当 full-screen interaction 中 terminal size 变化时，renderer 必须确定性重算 region bounds、scroll offsets、command bar width 与 visible truncation，且不得丢失 active focus。

### Requirement: Prompt Rendering Uses Terminal Profile / Prompt 渲染使用终端 Profile

Prompt and startup-status rendering SHALL be enabled only by terminal capability profile decisions and SHALL remain absent from structured output modes.

Prompt 与 startup-status 渲染必须只由 terminal capability profile 决策启用，并且必须在 structured output modes 中保持缺席。

#### Scenario: Prompt requires text TTY line input / Prompt 需要 Text TTY 行输入

- **WHEN** terminal profile selects text output with TTY stdin/stdout and `line` input strategy
- **THEN** the CLI may render the basic chat prompt through the inline writer without cursor addressing or alternate-screen state
- **中文** 当 terminal profile 选择 text output、TTY stdin/stdout 与 `line` input strategy 时，CLI 可以通过 inline writer 渲染基础 chat prompt，且不得使用 cursor addressing 或 alternate-screen state。

#### Scenario: Degraded terminal gets semantic output only / 降级终端只获得语义输出

- **WHEN** terminal profile selects `plain`, `json`, `jsonl`, `scripted`, or `none` behavior
- **THEN** the CLI emits only semantic lines or structured records and never emits prompt redraws, cursor movement, or raw-key affordances
- **中文** 当 terminal profile 选择 `plain`、`json`、`jsonl`、`scripted` 或 `none` 行为时，CLI 只能输出语义行或结构化 records，不得输出 prompt redraw、cursor movement 或 raw-key affordances。

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
