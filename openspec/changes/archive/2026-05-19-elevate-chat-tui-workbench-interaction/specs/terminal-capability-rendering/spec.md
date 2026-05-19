## MODIFIED Requirements

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
