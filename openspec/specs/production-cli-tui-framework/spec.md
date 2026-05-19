# production-cli-tui-framework Specification

## Purpose
TBD - created by archiving change ship-production-cli-tui-framework. Update Purpose after archive.
## Requirements
### Requirement: Framework-Backed Chat TUI Shell / 框架支撑的 Chat TUI Shell

The CLI SHALL provide a production TUI framework for chat that owns shell state, terminal gating, viewport rendering, prompt rendering, diagnostics, and local action dispatch without becoming a runtime execution engine.

CLI 必须为 chat 提供 production TUI framework，用于管理 shell state、terminal gating、viewport rendering、prompt rendering、diagnostics 与 local action dispatch，且不得成为 runtime execution engine。

#### Scenario: Framework starts in interactive TTY / 框架在交互 TTY 中启动

- **WHEN** `deepseek chat` starts with text output, TTY stdin/stdout, interactive renderer profile, and line or raw-capable input
- **THEN** the framework renders a deterministic startup viewport containing framework id, interaction mode, viewport profile, input strategy, keymap profile, contribution counts, diagnostic counts, plugin readiness, and session id
- **中文** 当 `deepseek chat` 以 text output、TTY stdin/stdout、interactive renderer profile 以及 line 或 raw-capable input 启动时，framework 必须渲染确定性的 startup viewport，包含 framework id、interaction mode、viewport profile、input strategy、keymap profile、contribution counts、diagnostic counts、plugin readiness 与 session id。

#### Scenario: Framework is inert for structured output / 结构化输出下框架惰性

- **WHEN** chat runs with JSON, JSONL, scripted input, CI, redirected IO, or a non-interactive renderer profile
- **THEN** the framework produces no prompt text, ANSI cursor control, alternate-screen sequence, or terminal-only status line while preserving command and runtime semantics
- **中文** 当 chat 以 JSON、JSONL、scripted input、CI、redirected IO 或 non-interactive renderer profile 运行时，framework 不得输出 prompt text、ANSI cursor control、alternate-screen sequence 或 terminal-only status line，同时必须保持 command 与 runtime 语义。

### Requirement: TUI State Snapshot / TUI 状态快照

The TUI framework SHALL maintain a deterministic state snapshot that includes interaction mode, composition snapshot, viewport profile, keymap profile, contribution registry summary, diagnostics, and prompt status.

TUI framework 必须维护确定性的 state snapshot，包含 interaction mode、composition snapshot、viewport profile、keymap profile、contribution registry summary、diagnostics 与 prompt status。

#### Scenario: Local command updates state / 本地命令更新状态

- **WHEN** a local slash command updates palette focus, references, history selection, mode status, or diagnostics
- **THEN** the TUI state snapshot records the resulting mode, active target, result-list focus, reference count, jump count, and diagnostics without submitting slash text to the model
- **中文** 当本地 slash command 更新 palette focus、references、history selection、mode status 或 diagnostics 时，TUI state snapshot 必须记录 resulting mode、active target、result-list focus、reference count、jump count 与 diagnostics，且不得将 slash text 提交给 model。

#### Scenario: Runtime turn updates prompt status / Runtime Turn 更新 Prompt 状态

- **WHEN** a normal prompt turn completes, fails, or is cancelled
- **THEN** the framework updates turn count, session id, and prompt readiness before rendering the next prompt
- **中文** 当普通 prompt turn completed、failed 或 cancelled 时，framework 必须在渲染下一条 prompt 前更新 turn count、session id 与 prompt readiness。

### Requirement: Declarative TUI Contribution Registry / 声明式 TUI 贡献注册表

The TUI framework SHALL accept declarative core, user, and plugin contributions for commands, actions, target resolvers, result-list providers, keymaps, palette entries, and render hints, and SHALL validate them without executing contribution owners.

TUI framework 必须接收 core、user 与 plugin 对 commands、actions、target resolvers、result-list providers、keymaps、palette entries 与 render hints 的声明式 contributions，并且必须在不执行 contribution owners 的情况下校验它们。

#### Scenario: Plugin keymap conflict is diagnostic / 插件快捷键冲突是诊断

- **WHEN** a plugin contribution defines a key binding that conflicts with a core or user binding in the same mode
- **THEN** the registry deterministically keeps the higher-precedence binding and records a conflict diagnostic naming the winner and loser ids
- **中文** 当 plugin contribution 定义的 key binding 与同一 mode 下 core 或 user binding 冲突时，registry 必须确定性保留优先级更高的 binding，并记录包含 winner 与 loser ids 的 conflict diagnostic。

#### Scenario: Registry does not execute plugins / 注册表不执行插件

- **WHEN** plugin-sourced contributions are registered or rendered in startup/help/status
- **THEN** the framework reads only declarative metadata and does not import, invoke, initialize, or mutate plugin code
- **中文** 当 plugin-sourced contributions 被注册或在 startup/help/status 中渲染时，framework 只能读取声明式 metadata，不得 import、invoke、initialize 或 mutate plugin code。

### Requirement: Vi-Inspired TUI Dispatch / Vi 启发式 TUI Dispatch

The TUI framework SHALL dispatch slash controls and keymap controls through the same vi-inspired action model over typed targets, composition snapshots, result lists, reference sets, and jump history.

TUI framework 必须让 slash controls 与 keymap controls 通过同一 vi-inspired action model 分发到 typed targets、composition snapshots、result lists、reference sets 与 jump history。

#### Scenario: Key dispatch resolves typed action / Key Dispatch 解析类型化 Action

- **WHEN** the framework receives a key token such as `j`, `k`, `gg`, `G`, `Enter`, or `:`
- **THEN** it resolves the token against the active keymap profile and mode into a typed action request or typed local command descriptor without executing runtime primitives
- **中文** 当 framework 收到 `j`、`k`、`gg`、`G`、`Enter` 或 `:` 等 key token 时，必须基于 active keymap profile 与 mode 解析为 typed action request 或 typed local command descriptor，且不得执行 runtime primitives。

#### Scenario: Slash and key paths share state / Slash 与按键路径共享状态

- **WHEN** slash navigation and key navigation invoke equivalent actions
- **THEN** they update the same active target, result-list focus, reference sets, jump history, and diagnostics
- **中文** 当 slash navigation 与 key navigation 调用等价 actions 时，它们必须更新同一 active target、result-list focus、reference sets、jump history 与 diagnostics。

### Requirement: Viewport Rendering Contract / Viewport 渲染契约

The TUI framework SHALL render bounded line-oriented viewport snapshots for the current release and SHALL keep the renderer API compatible with future raw/full-screen renderers.

TUI framework 必须为当前 release 渲染有界的 line-oriented viewport snapshots，并且 renderer API 必须兼容未来 raw/full-screen renderers。

#### Scenario: Viewport is bounded / Viewport 有界

- **WHEN** the framework renders startup, status, help, diagnostics, or post-command state
- **THEN** output is bounded, deterministic, width-aware where a width is known, and contains no private reasoning, raw transcript dumps, secret values, or unbounded plugin metadata
- **中文** 当 framework 渲染 startup、status、help、diagnostics 或 post-command state 时，输出必须有界、确定性，在 width 已知时 width-aware，且不包含 private reasoning、raw transcript dumps、secret values 或无界 plugin metadata。

#### Scenario: Prompt rendering follows prompt state / Prompt 渲染遵循 Prompt State

- **WHEN** the prompt is ready in an interactive text TTY
- **THEN** the framework renders exactly one prompt marker for the next input boundary and does not render prompts during streaming runtime output
- **中文** 当 interactive text TTY 中 prompt ready 时，framework 必须为下一次 input boundary 渲染且只渲染一个 prompt marker，不得在 streaming runtime output 期间渲染 prompt。

