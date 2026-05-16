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

Terminal capability profiles SHALL project interaction mode into input and rendering behavior without owning the canonical mode state.

Terminal capability profiles 必须把 interaction mode 投影为 input 与 rendering behavior，但不得拥有 canonical mode state。

#### Scenario: Interactive terminal renders interactive mode / 交互终端渲染 Interactive Mode
- **WHEN** the session mode is chat or result-list and the terminal profile supports TTY, raw input, color, and width detection
- **THEN** the CLI may render interactive controls while preserving the same structured mode and action events used by plain mode
- **中文** 当 session mode 是 chat 或 result-list，且 terminal profile 支持 TTY、raw input、color 与 width detection 时，CLI 可以渲染 interactive controls，但必须保留与 plain mode 相同的结构化 mode 与 action events。

#### Scenario: Degraded terminal preserves semantics / 降级终端保留语义
- **WHEN** the terminal is CI, redirected IO, no-color, unknown width, or unreliable raw input
- **THEN** the CLI uses line/scripted input and plain/JSONL rendering while preserving local command, approval, result-list, and runtime event semantics
- **中文** 当 terminal 是 CI、redirected IO、no-color、unknown width 或 raw input 不可靠时，CLI 必须使用 line/scripted input 与 plain/JSONL rendering，同时保留 local command、approval、result-list 与 runtime event 语义。

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

The CLI SHALL expose a diagnostics matrix showing interaction modes and whether each is complete, partial, planned, disabled, or unsupported.

CLI 必须暴露 diagnostics matrix，展示各 interaction modes 的 complete、partial、planned、disabled 或 unsupported 状态。

#### Scenario: Diagnostics reports mode readiness / Diagnostics 报告 Mode 就绪度
- **WHEN** a user runs diagnostics for CLI readiness or product route status
- **THEN** the report includes interaction mode status, implemented command surfaces, missing acceptance evidence, and next implementation tasks
- **中文** 当用户运行 CLI readiness 或 product route status diagnostics 时，报告必须包含 interaction mode status、implemented command surfaces、missing acceptance evidence 与 next implementation tasks。

### Requirement: Reasoning Effort Is Not Interaction Mode / 推理强度不是交互模式

Model reasoning effort SHALL NOT be treated as a CLI interaction mode or as proof that evidence/verification loops ran.

模型 reasoning effort 不得被视为 CLI interaction mode，也不得被当作 evidence/verification loops 已运行的证明。

#### Scenario: Reasoning effort is reported separately / 推理强度单独报告
- **WHEN** a turn uses a model reasoning effort such as low, medium, high, or extra-high
- **THEN** diagnostics and evaluation report it separately from evidence loop count, verification loop count, repair attempts, and delegation fan-out
- **中文** 当一个 turn 使用 low、medium、high 或 extra-high 等模型 reasoning effort 时，diagnostics 与 evaluation 必须将它与 evidence loop count、verification loop count、repair attempts 与 delegation fan-out 分开报告。

