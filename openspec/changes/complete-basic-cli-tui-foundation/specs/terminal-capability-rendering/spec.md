## ADDED Requirements

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
