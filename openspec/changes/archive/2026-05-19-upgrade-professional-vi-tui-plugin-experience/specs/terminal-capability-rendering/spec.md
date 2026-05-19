## MODIFIED Requirements

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

## ADDED Requirements

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
