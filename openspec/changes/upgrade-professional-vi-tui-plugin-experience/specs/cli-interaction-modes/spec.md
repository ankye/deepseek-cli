## MODIFIED Requirements

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

### Requirement: Mode Completion Matrix / Mode 完成度矩阵

The CLI SHALL expose a diagnostics matrix showing interaction modes and whether each is complete, partial, planned, disabled, or unsupported, including separate evidence for professional vi/full-screen readiness.

CLI 必须暴露 diagnostics matrix，展示各 interaction modes 的 complete、partial、planned、disabled 或 unsupported 状态，并包含 professional vi/full-screen readiness 的独立证据。

#### Scenario: Diagnostics reports mode readiness / Diagnostics 报告 Mode 就绪度
- **WHEN** a user runs diagnostics for CLI readiness or product route status
- **THEN** the report includes interaction mode status, implemented command surfaces, raw/full-screen evidence, plugin extension UX evidence, missing acceptance evidence, and next implementation tasks
- **中文** 当用户运行 CLI readiness 或 product route status diagnostics 时，报告必须包含 interaction mode status、implemented command surfaces、raw/full-screen evidence、plugin extension UX evidence、missing acceptance evidence 与 next implementation tasks。

## ADDED Requirements

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
