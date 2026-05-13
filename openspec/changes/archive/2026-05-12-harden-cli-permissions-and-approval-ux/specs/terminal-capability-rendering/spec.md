## ADDED Requirements

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
