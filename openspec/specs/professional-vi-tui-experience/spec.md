# professional-vi-tui-experience Specification

## Purpose
Define professional vi-inspired TUI experience requirements for modal editing, keybindings, result navigation, command actions, and terminal ergonomics.

定义 professional vi-inspired TUI experience 对 modal editing、keybindings、result navigation、command actions 与 terminal ergonomics 的要求。

## Requirements
### Requirement: Professional Vi Workbench Product Boundary / 专业 Vi Workbench 产品边界

The CLI SHALL distinguish the release-ready line workbench from the professional raw/full-screen vi workbench and SHALL report their readiness separately in diagnostics, docs, and acceptance evidence.

CLI 必须区分 release-ready line workbench 与 professional raw/full-screen vi workbench，并在 diagnostics、docs 与 acceptance evidence 中分别报告它们的 readiness。

#### Scenario: Readiness is not inflated / 就绪度不得虚高

- **WHEN** diagnostics evaluate TUI readiness
- **THEN** line workbench readiness, raw-key readiness, full-screen renderer readiness, vi grammar readiness, and plugin extension UX readiness are reported as separate gates
- **中文** 当 diagnostics 评估 TUI readiness 时，line workbench readiness、raw-key readiness、full-screen renderer readiness、vi grammar readiness 与 plugin extension UX readiness 必须作为独立 gates 报告。

#### Scenario: Product copy is honest / 产品文案诚实

- **WHEN** README, CLI help, release notes, or npm package docs describe the TUI
- **THEN** they state whether the active renderer is line, full-screen, or degraded and MUST NOT imply full-screen/raw-key support unless that evidence gate passed
- **中文** 当 README、CLI help、release notes 或 npm package docs 描述 TUI 时，必须说明 active renderer 是 line、full-screen 还是 degraded；除非相关 evidence gate 已通过，不得暗示 full-screen/raw-key support 已完成。

### Requirement: Raw-Key Input Pipeline / Raw-Key 输入管线

The CLI SHALL provide a raw-key input pipeline that converts terminal bytes into typed local input events before action resolution.

CLI 必须提供 raw-key input pipeline，将 terminal bytes 转换为类型化 local input events，然后再进行 action resolution。

#### Scenario: Key tokens are typed / 按键 Token 类型化

- **WHEN** the user presses printable keys, arrows, Tab, Shift+Tab, Enter, Escape, Ctrl+C, Ctrl+D, Ctrl+U, or terminal resize events in raw mode
- **THEN** the input pipeline emits typed events with source profile, timestamp/order, raw-token redaction metadata, and no model-visible prompt text
- **中文** 当用户在 raw mode 下按 printable keys、arrows、Tab、Shift+Tab、Enter、Escape、Ctrl+C、Ctrl+D、Ctrl+U 或触发 terminal resize events 时，input pipeline 必须发出带 source profile、timestamp/order、raw-token redaction metadata 的类型化 events，且不得产生 model-visible prompt text。

#### Scenario: Raw mode degrades safely / Raw Mode 安全降级

- **WHEN** raw input is unsupported, unreliable, redirected, running in CI, or explicitly disabled
- **THEN** the CLI falls back to line/scripted input with equivalent slash-command semantics and records a typed degradation reason
- **中文** 当 raw input unsupported、unreliable、redirected、运行于 CI 或被显式禁用时，CLI 必须回退到 line/scripted input，并保留等价 slash-command semantics，同时记录类型化 degradation reason。

### Requirement: Full-Screen Renderer Lifecycle / Full-Screen Renderer 生命周期

The CLI SHALL provide a full-screen renderer profile that consumes the workbench projection and owns terminal lifecycle without owning runtime execution state.

CLI 必须提供 full-screen renderer profile，它消费 workbench projection 并拥有 terminal lifecycle，但不拥有 runtime execution state。

#### Scenario: Alternate screen lifecycle is deterministic / Alternate Screen 生命周期确定

- **WHEN** full-screen mode starts, exits normally, exits after error, receives cancellation, or degrades
- **THEN** enter/leave alternate-screen, cursor visibility, repaint bounds, statusline state, and teardown evidence are deterministic and tested
- **中文** 当 full-screen mode 启动、正常退出、错误退出、收到 cancellation 或降级时，enter/leave alternate-screen、cursor visibility、repaint bounds、statusline state 与 teardown evidence 必须确定且经过测试。

#### Scenario: Structured output stays clean / 结构化输出保持干净

- **WHEN** JSON, JSONL, scripted, CI, redirected, or support-bundle output is requested
- **THEN** full-screen escape sequences, terminal-only status, cursor controls, and local key events are absent
- **中文** 当请求 JSON、JSONL、scripted、CI、redirected 或 support-bundle output 时，full-screen escape sequences、terminal-only status、cursor controls 与 local key events 必须不存在。

### Requirement: Professional Vi Grammar / 专业 Vi Grammar

The CLI SHALL provide a `vi-professional` keymap grammar that supports familiar modal navigation while remaining smaller than full Vim emulation.

CLI 必须提供 `vi-professional` keymap grammar，支持熟悉的 modal navigation，同时保持小于完整 Vim 模拟的范围。

#### Scenario: Multi-key and count grammar resolves locally / 多键与 Count Grammar 本地解析

- **WHEN** the user enters counts, `gg`, `G`, `j`, `k`, `h`, `l`, `Ctrl+d`, `Ctrl+u`, `/`, `:`, `Enter`, `Esc`, `q`, `?`, or leader-prefixed plugin keys
- **THEN** the grammar resolves them into typed local actions, command entry, search entry, focus changes, previews, or diagnostics without invoking the model
- **中文** 当用户输入 counts、`gg`、`G`、`j`、`k`、`h`、`l`、`Ctrl+d`、`Ctrl+u`、`/`、`:`、`Enter`、`Esc`、`q`、`?` 或 leader-prefixed plugin keys 时，grammar 必须将其解析为类型化 local actions、command entry、search entry、focus changes、previews 或 diagnostics，且不得调用模型。

#### Scenario: Vim gaps are explicit / Vim 差距显式化

- **WHEN** a user requests unsupported Vim features such as registers, macros, visual selections, text objects, windows, buffers, or arbitrary ex commands
- **THEN** the CLI returns a typed local diagnostic and, where possible, suggests an available DeepSeek action or plugin extension point
- **中文** 当用户请求 unsupported Vim features，如 registers、macros、visual selections、text objects、windows、buffers 或 arbitrary ex commands 时，CLI 必须返回类型化 local diagnostic，并在可能时建议可用的 DeepSeek action 或 plugin extension point。

### Requirement: Friendly Plugin Extension Mode / 友好的插件扩展模式

The CLI SHALL make plugin-contributed TUI behavior inspectable, configurable, previewable, and governed before execution.

CLI 必须让 plugin-contributed TUI behavior 在执行前可检查、可配置、可预览且受治理。

#### Scenario: Contribution inspector explains state / 贡献检查器解释状态

- **WHEN** a plugin contributes commands, actions, keymaps, palette entries, result lists, render hints, or reasoning records
- **THEN** the user can inspect stable id, namespace, owner, mode scopes, permissions, side effects, conflict group, winner/loser status, preview text, and rejection/degradation reasons
- **中文** 当 plugin 贡献 commands、actions、keymaps、palette entries、result lists、render hints 或 reasoning records 时，用户必须能检查 stable id、namespace、owner、mode scopes、permissions、side effects、conflict group、winner/loser status、preview text 与 rejection/degradation reasons。

#### Scenario: Plugin action execution is governed / 插件动作执行受治理

- **WHEN** a plugin-contributed action would execute work
- **THEN** the TUI converts it into a typed governed descriptor with policy, permission, audit, redaction, and dry-run preview metadata before any side effect is allowed
- **中文** 当 plugin-contributed action 将执行工作时，TUI 必须先将其转换成带 policy、permission、audit、redaction 与 dry-run preview metadata 的类型化受治理 descriptor，然后才允许任何 side effect。

#### Scenario: User override is deterministic / 用户覆盖确定化

- **WHEN** a user override changes a plugin or core binding
- **THEN** precedence, conflict diagnostics, active profile, source, and rollback information are persisted and visible in TUI/plugin diagnostics
- **中文** 当 user override 修改 plugin 或 core binding 时，precedence、conflict diagnostics、active profile、source 与 rollback information 必须持久化并在 TUI/plugin diagnostics 中可见。

### Requirement: TUI plugin actions execute owner routes
The professional TUI SHALL provide host-governed execution for implemented built-in plugin command actions without granting direct host access to plugin code.

Professional TUI 必须为 implemented built-in plugin command actions 提供 host-governed execution，同时不得向插件代码授予 direct host access。

#### Scenario: Leader plugin action executes route
- **WHEN** a user selects a built-in plugin command action from a TUI plugin action surface
- **THEN** the TUI requests host dispatch through the owner route and updates recent executions, result lists, activity feed, and inspector targets
- **中文** 当用户从 TUI plugin action surface 选择 built-in plugin command action 时，TUI 必须通过 owner route 请求 host dispatch，并更新 recent executions、result lists、activity feed 与 inspector targets。

#### Scenario: Deferred action is explained in place
- **WHEN** a TUI plugin action points at a deferred route
- **THEN** the TUI records and renders the route as recognized but not directly dispatchable, including fallback guidance
- **中文** 当 TUI plugin action 指向 deferred route 时，TUI 必须记录并渲染该 route 为“已识别但不可直接 dispatch”，并包含 fallback guidance。

### Requirement: TUI keeps command-system dry-runs inert
The professional TUI SHALL keep command-system action resolution dry-run and perform real plugin execution only through host-owned execution helpers.

Professional TUI 必须保持 command-system action resolution dry-run 惰性，并且只通过 host-owned execution helpers 执行真实插件。

#### Scenario: Plugin dry-run does not execute process or filesystem work
- **WHEN** the TUI resolves a plugin action through command-system dry-run
- **THEN** no process, filesystem, model, MCP, or hook execution occurs until the host execution helper is called
- **中文** 当 TUI 通过 command-system dry-run 解析 plugin action 时，在 host execution helper 被调用前不得发生 process、filesystem、model、MCP 或 hook execution。

### Requirement: Plugin TUI Actions Show Owner Route Readiness / 插件 TUI Action 展示 Owner Route 就绪状态
The professional TUI SHALL surface owner route readiness for plugin command actions in shelves, keymaps, palettes, and inspectors.

Professional TUI 必须在 shelves、keymaps、palettes 与 inspectors 中展示 plugin command actions 的 owner route readiness。

#### Scenario: TUI can explain a deferred route / TUI 可解释 Deferred Route
- **WHEN** a plugin keymap or palette entry points at a deferred route
- **THEN** the TUI explains the route is recognized but not directly dispatchable and offers the current fallback guidance
- **中文** 当 plugin keymap 或 palette entry 指向 deferred route 时，TUI 必须解释该 route 已识别但不可直接 dispatch，并提供当前 fallback guidance。

#### Scenario: TUI can dispatch implemented routes / TUI 可调度已实现 Route
- **WHEN** a plugin keymap or palette entry points at an implemented route
- **THEN** the TUI has enough metadata to request host dispatch without direct host access from the plugin
- **中文** 当 plugin keymap 或 palette entry 指向 implemented route 时，TUI 必须拥有足够 metadata 来请求 host dispatch，而无需插件获得 direct host access。

