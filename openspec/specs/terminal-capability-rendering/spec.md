# terminal-capability-rendering Specification

## Purpose
TBD - created by archiving change split-cli-host-and-architecture-scale-guardrails. Update Purpose after archive.
## Requirements
### Requirement: Terminal Capability Profile / 终端能力 Profile

The CLI SHALL compute a typed terminal capability profile once per process or session from stdio facts, output mode, environment, platform facts, CI indicators, width, color support, unicode support, raw input support, and user preferences.

CLI 必须每个 process 或 session 基于 stdio facts、output mode、environment、platform facts、CI indicators、width、color support、unicode support、raw input support 和用户偏好计算一次类型化 terminal capability profile。

#### Scenario: Profile replaces inline terminal branching / Profile 替代内联终端分支

- **WHEN** input handlers or renderers need to decide how to behave
- **THEN** they consume the terminal capability profile instead of branching directly on `process.platform`, raw `isTTY`, or ad hoc ANSI assumptions
- **中文** 当 input handlers 或 renderers 需要决定行为时，它们必须消费 terminal capability profile，而不是直接基于 `process.platform`、原始 `isTTY` 或临时 ANSI 假设分支。

#### Scenario: Unknown terminal is fail-soft / 未知终端软降级

- **WHEN** terminal capability cannot be determined confidently
- **THEN** the CLI selects stable plain text, JSON, or JSONL behavior and avoids raw interactive controls that could corrupt input or output
- **中文** 当 terminal capability 无法可靠确定时，CLI 必须选择稳定 plain text、JSON 或 JSONL 行为，并避免可能破坏输入或输出的 raw interactive controls。

### Requirement: Renderer Profiles / Renderer Profiles

The CLI SHALL select renderer behavior through explicit profiles including `plain`, `ansi`, `interactive`, `json`, and `jsonl`.

CLI 必须通过显式 profiles 选择 renderer 行为，包括 `plain`、`ansi`、`interactive`、`json` 和 `jsonl`。

#### Scenario: Structured modes bypass rich terminal rendering / 结构化模式绕过 Rich 终端渲染

- **WHEN** the user selects JSON or JSONL output, or output is redirected to a non-TTY structured consumer
- **THEN** the CLI emits deterministic structured records without ANSI decoration, spinners, alternate screens, prompts, or terminal cursor controls
- **中文** 当用户选择 JSON 或 JSONL output，或 output 被重定向到 non-TTY structured consumer 时，CLI 必须输出确定性的结构化 records，不得包含 ANSI decoration、spinners、alternate screens、prompts 或 terminal cursor controls。

#### Scenario: Interactive profile requires capability support / Interactive Profile 要求能力支持

- **WHEN** the CLI selects an interactive renderer
- **THEN** the terminal profile confirms compatible TTY streams, width handling, color or plain fallback, raw input support when needed, and reliable degradation behavior
- **中文** 当 CLI 选择 interactive renderer 时，terminal profile 必须确认兼容的 TTY streams、width handling、color 或 plain fallback、必要时的 raw input support，以及可靠降级行为。

### Requirement: Input Strategy Profiles / 输入策略 Profiles

The CLI SHALL select input behavior through explicit strategies including `line`, `raw`, `scripted`, and `none`.

CLI 必须通过显式 strategies 选择输入行为，包括 `line`、`raw`、`scripted` 和 `none`。

#### Scenario: Scripted chat uses scripted input / 脚本化 Chat 使用脚本输入

- **WHEN** tests or non-interactive callers provide scripted chat input
- **THEN** the CLI uses the scripted input strategy and avoids terminal-only key handling or prompt state assumptions
- **中文** 当 tests 或 non-interactive callers 提供 scripted chat input 时，CLI 必须使用 scripted input strategy，并避免 terminal-only key handling 或 prompt state assumptions。

#### Scenario: Raw input gates vi-inspired controls / Raw 输入门控 vi-inspired 控制

- **WHEN** vi-inspired modal controls, keymaps, or navigation shortcuts require raw input
- **THEN** they are enabled only when the terminal capability profile declares raw input reliable for the current host
- **中文** 当 vi-inspired modal controls、keymaps 或 navigation shortcuts 需要 raw input 时，只有 terminal capability profile 声明当前 host raw input 可靠时才能启用。

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
