## ADDED Requirements

### Requirement: Chat Uses Production TUI Framework / Chat 使用 Production TUI Framework

The chat shell SHALL use the production CLI TUI framework for interactive text TTY startup, prompt redraw, local status, and local slash-command state rendering while preserving the governed runtime event path for prompt turns.

Chat shell 必须使用 production CLI TUI framework 处理 interactive text TTY startup、prompt redraw、本地状态与本地 slash-command state rendering，同时保留 prompt turns 的受治理 runtime event path。

#### Scenario: Chat startup identifies framework / Chat 启动标识 Framework

- **WHEN** a user starts `deepseek chat` in an interactive text TTY
- **THEN** startup output identifies the TUI framework, vi-inspired composition profile, viewport profile, keymap profile, plugin readiness, contribution count, diagnostic count, and session id
- **中文** 当用户在 interactive text TTY 中启动 `deepseek chat` 时，startup output 必须标识 TUI framework、vi-inspired composition profile、viewport profile、keymap profile、plugin readiness、contribution count、diagnostic count 与 session id。

#### Scenario: Prompt turn still uses runtime events / Prompt Turn 仍使用 Runtime Events

- **WHEN** the user enters a non-command prompt in the TUI-backed chat shell
- **THEN** the prompt is submitted through the existing runtime/kernel event path and the TUI framework only updates local viewport and prompt state around those events
- **中文** 当用户在 TUI-backed chat shell 中输入非 command prompt 时，该 prompt 必须通过现有 runtime/kernel event path 提交，TUI framework 只围绕这些 events 更新本地 viewport 与 prompt state。

### Requirement: TUI Local Controls Stay Local / TUI 本地控制保持本地

The chat shell SHALL route local slash commands through the TUI framework state and action dispatcher without sending slash inputs to model execution.

Chat shell 必须通过 TUI framework state 与 action dispatcher 路由本地 slash commands，不得将 slash inputs 发送到 model execution。

#### Scenario: Local command redraws framework status / 本地命令重绘 Framework 状态

- **WHEN** a user enters `/help`, `/palette`, `/keymap`, `/history`, `/mode`, `/cost`, `/model`, `/revert`, or approval controls
- **THEN** chat renders the local command result and updates or redraws TUI status/prompt from framework state without submitting a runtime prompt turn
- **中文** 当用户输入 `/help`、`/palette`、`/keymap`、`/history`、`/mode`、`/cost`、`/model`、`/revert` 或 approval controls 时，chat 必须渲染本地 command result，并从 framework state 更新或重绘 TUI status/prompt，且不得提交 runtime prompt turn。

#### Scenario: Unknown slash remains diagnostic / 未知 Slash 保持诊断

- **WHEN** a slash input is not recognized by chat local controls or the TUI contribution registry
- **THEN** chat emits a local typed diagnostic, preserves framework state, and continues the prompt loop
- **中文** 当 slash input 未被 chat local controls 或 TUI contribution registry 识别时，chat 必须发出本地 typed diagnostic、保留 framework state，并继续 prompt loop。
