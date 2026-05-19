# cli-interaction-modes Specification

## Purpose
TBD - created by archiving change formalize-cli-interaction-agent-modes. Update Purpose after archive.
## Requirements
### Requirement: Interaction Mode State Contract / 交互模式状态契约

The system SHALL represent CLI interaction mode as a host-agnostic, versioned contract that can be emitted, persisted, resumed, replayed, and rendered by any host.

系统必须把 CLI interaction mode 表示为 host-agnostic、versioned contract，可被 emit、persist、resume、replay，并由任意 host 渲染。

#### Scenario: Mode is explicit session state / Mode 是显式 Session 状态
- **WHEN** a CLI turn enters one-shot, chat, interactive, command-palette, result-list, approval, review-diff, background-task, headless, remote, or degraded interaction
- **THEN** the active interaction mode is recorded as structured session/runtime metadata rather than only as terminal-local state
- **中文** 当 CLI turn 进入 one-shot、chat、interactive、command-palette、result-list、approval、review-diff、background-task、headless、remote 或 degraded interaction 时，active interaction mode 必须记录为结构化 session/runtime metadata，而不能只作为 terminal-local state。

#### Scenario: Mode transition is replayable / Mode Transition 可回放
- **WHEN** the active interaction mode changes
- **THEN** the system emits a typed transition event with previous mode, next mode, reason code, initiator, affected session, trace metadata, and redaction metadata
- **中文** 当 active interaction mode 变化时，系统必须发出 typed transition event，包含 previous mode、next mode、reason code、initiator、affected session、trace metadata 与 redaction metadata。

#### Scenario: Unknown mode fails closed / 未知 Mode 安全失败
- **WHEN** a host receives an interaction mode it does not understand
- **THEN** it degrades to a safe plain/scripted renderer and preserves structured data for diagnostics without treating the mode as a model prompt
- **中文** 当 host 收到无法理解的 interaction mode 时，必须降级到安全的 plain/scripted renderer，并为 diagnostics 保留结构化数据，不得把该 mode 当作 model prompt。

### Requirement: Terminal Profile Projects Mode Rendering / 终端 Profile 投影 Mode 渲染

Terminal capability profiles SHALL project interaction mode into input and rendering behavior without owning the canonical mode state, and SHALL distinguish line, raw-key, and full-screen readiness.

Terminal capability profiles 必须把 interaction mode 投影为 input 与 rendering behavior，但不得拥有 canonical mode state；并且必须区分 line、raw-key 与 full-screen readiness。

#### Scenario: Interactive terminal renders interactive mode / 交互终端渲染 Interactive Mode
- **WHEN** the session mode is chat, command-palette, result-list, approval, reasoning-inspector, plugin-inspector, or full-screen workbench and the terminal profile supports the required TTY/input/rendering capabilities
- **THEN** the CLI may render interactive controls while preserving the same structured mode and action events used by plain mode
- **中文** 当 session mode 是 chat、command-palette、result-list、approval、reasoning-inspector、plugin-inspector 或 full-screen workbench，且 terminal profile 支持所需 TTY/input/rendering capabilities 时，CLI 可以渲染 interactive controls，但必须保留与 plain mode 相同的结构化 mode 与 action events。

#### Scenario: Degraded terminal preserves semantics / 降级终端保留语义
- **WHEN** the terminal is CI, redirected IO, no-color, unknown width, unreliable raw input, unsupported alternate screen, or explicitly configured for line mode
- **THEN** the CLI uses line/scripted input and plain/JSONL rendering while preserving local command, approval, result-list, plugin-inspection, and runtime event semantics
- **中文** 当 terminal 是 CI、redirected IO、no-color、unknown width、unreliable raw input、unsupported alternate screen，或被显式配置为 line mode 时，CLI 必须使用 line/scripted input 与 plain/JSONL rendering，同时保留 local command、approval、result-list、plugin-inspection 与 runtime event 语义。

### Requirement: Local Mode Controls / 本地 Mode 控制

Mode controls SHALL resolve locally through command/action contracts and SHALL NOT be sent to the model as prompt text.

Mode controls 必须通过 command/action contracts 在本地解析，不得作为 prompt text 发送给 model。

#### Scenario: Mode status command stays local / Mode 状态命令保持本地
- **WHEN** a user enters `/mode` or runs a scriptable mode-status command
- **THEN** the CLI renders the current interaction mode, agent mode summary, transition history pointer, and available transitions without invoking model or runtime execution primitives
- **中文** 当用户输入 `/mode` 或运行可脚本化 mode-status command 时，CLI 必须渲染当前 interaction mode、agent mode summary、transition history pointer 与 available transitions，且不得调用 model 或 runtime execution primitives。

#### Scenario: Unsupported transition is typed / 不支持的切换类型化
- **WHEN** a user requests a transition that is unavailable in the current host, terminal profile, permission state, or session state
- **THEN** the CLI returns a typed local diagnostic and preserves the prior mode
- **中文** 当用户请求当前 host、terminal profile、permission state 或 session state 不可用的 transition 时，CLI 必须返回 typed local diagnostic，并保留原 mode。

### Requirement: Command Visibility Is Mode-Aware / 命令可见性感知 Mode

Command, palette, slash, keymap, and bridge/remote controls SHALL declare which interaction modes can expose or execute them.

Command、palette、slash、keymap 与 bridge/remote controls 必须声明哪些 interaction modes 可以展示或执行它们。

#### Scenario: Remote mode filters unsafe controls / Remote Mode 过滤不安全控制
- **WHEN** a remote or bridge-like interaction mode is active
- **THEN** local-only, terminal-UI-only, filesystem-dependent, or permission-dialog-dependent commands are hidden or rejected unless explicitly declared safe for that mode
- **中文** 当 remote 或 bridge-like interaction mode 激活时，local-only、terminal-UI-only、filesystem-dependent 或 permission-dialog-dependent commands 必须被隐藏或拒绝，除非显式声明对该 mode 安全。

#### Scenario: Unknown slash command is not prompt text / 未知 Slash 命令不是 Prompt 文本
- **WHEN** a user enters an unknown slash or mode command
- **THEN** the CLI emits a local command diagnostic and does not submit the text to the model
- **中文** 当用户输入未知 slash 或 mode command 时，CLI 必须发出本地 command diagnostic，不得将该文本提交给 model。

### Requirement: Mode Completion Matrix / Mode 完成度矩阵

The CLI SHALL expose a diagnostics matrix showing interaction modes and whether each is complete, partial, planned, disabled, or unsupported, including separate evidence for professional vi/full-screen readiness.

CLI 必须暴露 diagnostics matrix，展示各 interaction modes 的 complete、partial、planned、disabled 或 unsupported 状态，并包含 professional vi/full-screen readiness 的独立证据。

#### Scenario: Diagnostics reports mode readiness / Diagnostics 报告 Mode 就绪度
- **WHEN** a user runs diagnostics for CLI readiness or product route status
- **THEN** the report includes interaction mode status, implemented command surfaces, raw/full-screen evidence, plugin extension UX evidence, missing acceptance evidence, and next implementation tasks
- **中文** 当用户运行 CLI readiness 或 product route status diagnostics 时，报告必须包含 interaction mode status、implemented command surfaces、raw/full-screen evidence、plugin extension UX evidence、missing acceptance evidence 与 next implementation tasks。

### Requirement: Reasoning Effort Is Not Interaction Mode / 推理强度不是交互模式

Model reasoning effort SHALL NOT be treated as a CLI interaction mode or as proof that evidence/verification loops ran.

模型 reasoning effort 不得被视为 CLI interaction mode，也不得被当作 evidence/verification loops 已运行的证明。

#### Scenario: Reasoning effort is reported separately / 推理强度单独报告
- **WHEN** a turn uses a model reasoning effort such as low, medium, high, or extra-high
- **THEN** diagnostics and evaluation report it separately from evidence loop count, verification loop count, repair attempts, and delegation fan-out
- **中文** 当一个 turn 使用 low、medium、high 或 extra-high 等模型 reasoning effort 时，diagnostics 与 evaluation 必须将它与 evidence loop count、verification loop count、repair attempts 与 delegation fan-out 分开报告。

### Requirement: Professional TUI Mode Transitions / 专业 TUI Mode 转换

The system SHALL represent raw-key, full-screen, plugin-inspector, reasoning-inspector, and command-bar transitions as typed local mode transitions.

系统必须将 raw-key、full-screen、plugin-inspector、reasoning-inspector 与 command-bar transitions 表示为类型化本地 mode transitions。

#### Scenario: Key-driven transition is local / 按键驱动转换保持本地

- **WHEN** a raw key changes focus, opens command bar, enters plugin inspector, exits a panel, or cancels a preview
- **THEN** the transition is emitted as local interaction-mode evidence and is not submitted to the model as prompt text
- **中文** 当 raw key 改变 focus、打开 command bar、进入 plugin inspector、退出 panel 或取消 preview 时，transition 必须作为 local interaction-mode evidence 发出，且不得作为 prompt text 提交给模型。

#### Scenario: Full-screen fallback is explainable / Full-screen 回退可解释

- **WHEN** a requested full-screen mode cannot start
- **THEN** the CLI records the requested mode, selected fallback, terminal facts, reason codes, and available remediation without treating fallback as full completion
- **中文** 当请求的 full-screen mode 无法启动时，CLI 必须记录 requested mode、selected fallback、terminal facts、reason codes 与 available remediation，且不得把 fallback 当作 full completion。

### Requirement: Basic TUI Is A Chat Interaction Projection / 基础 TUI 是 Chat 交互投影

The basic line TUI SHALL be a renderer/input projection of canonical `chat` interaction mode, not a new runtime execution mode.

基础行式 TUI 必须是 canonical `chat` interaction mode 的 renderer/input 投影，而不是新的 runtime execution mode。

#### Scenario: Basic TUI preserves chat mode / 基础 TUI 保留 Chat Mode

- **WHEN** text TTY chat renders prompt/status affordances
- **THEN** the canonical interaction mode remains `chat`, and local status exposes renderer/input/degradation evidence without changing runtime execution semantics
- **中文** 当 text TTY chat 渲染 prompt/status affordances 时，canonical interaction mode 必须保持为 `chat`，且本地状态暴露 renderer/input/degradation evidence，不改变 runtime execution semantics。

#### Scenario: Rich TUI remains a later mode projection / Rich TUI 保持后续 Mode 投影

- **WHEN** future work adds full-screen panels, review-diff panes, approval queues, or plugin-contributed visual surfaces
- **THEN** those surfaces must consume the same canonical interaction mode and action events rather than creating host-only hidden state
- **中文** 当未来增加 full-screen panels、review-diff panes、approval queues 或 plugin-contributed visual surfaces 时，这些 surface 必须消费同一 canonical interaction mode 与 action events，而不是创建 host-only hidden state。

### Requirement: Production TUI Mode Status Is Explicit / Production TUI Mode 状态显式化

The production TUI framework SHALL expose explicit mode/status records for prompt, normal, command, approval, selection, result-list, and degraded interaction.

Production TUI framework 必须为 prompt、normal、command、approval、selection、result-list 与 degraded interaction 暴露显式 mode/status records。

#### Scenario: Startup reports mode status / 启动报告 Mode 状态

- **WHEN** interactive chat starts
- **THEN** TUI startup status includes the active interaction mode, composition mode, input strategy, renderer profile, viewport profile, and degradation reasons when any
- **中文** 当 interactive chat 启动时，TUI startup status 必须包含 active interaction mode、composition mode、input strategy、renderer profile、viewport profile 与任何 degradation reasons。

#### Scenario: Degraded mode is diagnosable / 降级模式可诊断

- **WHEN** terminal capability disables interactive viewport or key handling
- **THEN** the framework exposes a degraded mode diagnostic explaining the reason while keeping structured command/runtime behavior available
- **中文** 当 terminal capability 禁用 interactive viewport 或 key handling 时，framework 必须暴露 degraded mode diagnostic 说明原因，同时保持 structured command/runtime behavior 可用。

### Requirement: TUI Diagnostics Matrix Covers Framework Readiness / TUI 诊断矩阵覆盖框架就绪度

The CLI SHALL expose TUI readiness through deterministic status/help output and tests before release.

CLI 必须在 release 前通过确定性的 status/help output 与 tests 暴露 TUI readiness。

#### Scenario: Help includes framework readiness / Help 包含 Framework 就绪度

- **WHEN** a user runs `/help` in interactive chat
- **THEN** help output includes the TUI framework name, vi-inspired keymap profile, viewport profile, plugin contribution policy, and structured fallback policy
- **中文** 当用户在 interactive chat 中运行 `/help` 时，help output 必须包含 TUI framework name、vi-inspired keymap profile、viewport profile、plugin contribution policy 与 structured fallback policy。

