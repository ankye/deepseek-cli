## Why

The current chat TUI has a solid framework-backed line workbench, visible reasoning projection, palette/result-list contracts, and metadata-only plugin contribution intake. From a professional terminal and vi user perspective, the product is still not fluid enough: key navigation is not connected to live raw-key input, the renderer is not a full-screen/partial-refresh terminal surface, vi behavior lacks a coherent multi-key grammar, and plugin extension points are discoverable but not yet pleasant to configure, debug, or execute safely.

当前 chat TUI 已具备 framework-backed line workbench、visible reasoning projection、palette/result-list contracts 与 metadata-only plugin contribution intake。但从专业终端与 vi 用户视角看，产品体验仍不够顺手：按键导航尚未接入真实 raw-key input，renderer 还不是 full-screen/partial-refresh 终端界面，vi 行为缺少一致的多键 grammar，插件扩展点虽然可发现，但配置、调试和安全执行体验还不友好。

## What Changes

- Add a professional vi TUI experience contract that promotes raw-key/full-screen interaction from future work into a scoped implementation track.
- Introduce a typed raw input pipeline for key tokens, multi-key sequences, counts, leader mappings, Escape timing, command entry, cancellation, and terminal resize.
- Add a full-screen renderer profile with alternate-screen lifecycle, partial repaint, persistent statusline/command bar, scrollable transcript/result-list regions, and deterministic teardown.
- Upgrade the vi action grammar from minimal key bindings to a profile-driven command grammar that remains smaller than full Vim but feels familiar to experienced users.
- Make plugin extension mode friendlier with namespaced keymap profiles, contribution inspection, conflict explanation, permission-aware execution descriptors, dry-run preview, and governed action routing.
- Preserve line/scripted/JSON/JSONL fallback semantics and keep plugin code unable to bypass policy, audit, or runtime contracts.
- Add product-grade regression coverage with pseudo-terminal fixtures, renderer golden tests, plugin contribution matrices, and structured-output pollution checks.

- 增加 professional vi TUI experience 契约，把 raw-key/full-screen interaction 从未来工作推进为明确实施轨道。
- 引入类型化 raw input pipeline，覆盖 key tokens、多键序列、counts、leader mappings、Escape timing、command entry、cancel 与 terminal resize。
- 增加 full-screen renderer profile，覆盖 alternate-screen lifecycle、partial repaint、常驻 statusline/command bar、可滚动 transcript/result-list regions 与确定性 teardown。
- 将 vi action grammar 从最小 key bindings 升级为 profile-driven command grammar；不做完整 Vim，但要让资深用户感觉熟悉。
- 优化插件扩展模式：namespaced keymap profiles、contribution inspection、conflict explanation、permission-aware execution descriptors、dry-run preview 与 governed action routing。
- 保留 line/scripted/JSON/JSONL fallback 语义，并确保 plugin code 不能绕过 policy、audit 或 runtime contracts。
- 增加产品级回归覆盖：pseudo-terminal fixtures、renderer golden tests、plugin contribution matrices 与 structured-output pollution checks。

## Capabilities

### New Capabilities

- `professional-vi-tui-experience`: Defines raw-key/full-screen vi workbench behavior, plugin extension UX, terminal lifecycle, command grammar, and acceptance evidence.

### Modified Capabilities

- `vi-inspired-cli-composition`: Extend the composition model with count prefixes, multi-key sequences, leader scopes, action preview, and plugin keymap namespaces.
- `terminal-capability-rendering`: Add raw/full-screen renderer and input profiles, lifecycle safety, resize behavior, and deterministic fallback.
- `command-palette-vi-actions`: Make plugin-contributed actions inspectable, previewable, executable only through governed descriptors, and explainable when rejected.
- `cli-interaction-modes`: Add raw/full-screen TUI mode transitions, degradation evidence, and mode matrix requirements for professional vi readiness.

## Impact

- Affected code: CLI terminal profile, input line/raw adapters, chat TUI controller, workbench renderer, palette/action resolver, command-system keymap profile, plugin contribution projection, first-party plugin pack, tests, and acceptance evidence.
- Affected docs/specs: README/CLI README wording, TUI OpenSpec specs, product roadmap status, mode matrix, and diagnostics evidence.
- No full Vim emulation is required; registers, macros, text objects, buffers, windows, and ex commands remain out of scope unless explicitly represented as future extension slots.
- Third-party plugin execution remains governed. Plugin manifests may contribute commands/actions/keymaps/render hints, but executable work must be converted into typed descriptors and pass policy, permission, and audit gates.

- 影响代码：CLI terminal profile、input line/raw adapters、chat TUI controller、workbench renderer、palette/action resolver、command-system keymap profile、plugin contribution projection、first-party plugin pack、tests 与 acceptance evidence。
- 影响文档/规格：README/CLI README wording、TUI OpenSpec specs、product roadmap status、mode matrix 与 diagnostics evidence。
- 不要求完整 Vim 模拟；registers、macros、text objects、buffers、windows 与 ex commands 不在范围内，除非明确作为未来扩展槽表达。
- 第三方 plugin execution 仍受治理。Plugin manifests 可以贡献 commands/actions/keymaps/render hints，但可执行工作必须转换成 typed descriptors，并通过 policy、permission 与 audit gates。
