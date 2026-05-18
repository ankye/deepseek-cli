## Context

`deepseek chat` already has a governed runtime loop, terminal capability profiles, local slash commands, palette/result-list state, PageIndex recall, session controls, and a basic line prompt renderer. That renderer is intentionally small and does not provide a complete TUI framework for modal state, key dispatch, contribution validation, viewport rendering, or plugin-safe extension points.

`deepseek chat` 已经具备受治理的 runtime loop、terminal capability profiles、本地 slash commands、palette/result-list state、PageIndex recall、session controls 与基础行式 prompt renderer。该 renderer 有意保持很小，并未提供 modal state、key dispatch、contribution validation、viewport rendering 或 plugin-safe extension points 所需的完整 TUI framework。

## Goals / Non-Goals

**Goals:**

- Provide a release-ready CLI TUI framework module that is reusable by chat and future host surfaces.
- Keep vi-inspired modes as the composition model: prompt, normal, command, selection, result-list, and approval.
- Route slash controls and future raw-key controls through one action dispatcher and one composition snapshot.
- Validate declarative core/user/plugin contributions with deterministic precedence and diagnostics.
- Render deterministic text viewport snapshots for interactive terminals and clean fallback text for degraded profiles.
- Preserve structured/scripted behavior exactly: no prompt text, ANSI cursor controls, alternate screen, or terminal-only records.

- 提供可上线的 CLI TUI framework module，可被 chat 与未来 host surfaces 复用。
- 将 vi-inspired modes 作为组合模型：prompt、normal、command、selection、result-list 与 approval。
- 让 slash controls 与未来 raw-key controls 通过同一个 action dispatcher 与 composition snapshot。
- 用确定性优先级和 diagnostics 校验声明式 core/user/plugin contributions。
- 为交互终端渲染确定性的 text viewport snapshots，并为降级 profile 渲染干净 fallback text。
- 严格保持 structured/scripted 行为：不得输出 prompt text、ANSI cursor controls、alternate screen 或 terminal-only records。

**Non-Goals:**

- No full Vim emulation: registers, macros, marks, visual mode, and text objects remain out of scope.
- No plugin execution or marketplace loading in this change.
- No third-party terminal UI dependency.
- No runtime/model execution path changes.

- 不做完整 Vim 模拟：registers、macros、marks、visual mode 与 text objects 仍不在范围内。
- 本变更不执行 plugin 或加载 marketplace。
- 不引入第三方 terminal UI dependency。
- 不改变 runtime/model execution path。

## Decisions

1. Build `chat-tui.ts` as a framework surface with small companion modules if needed.

   The CLI host already owns chat-specific state, but the TUI framework must not turn `chat.ts` into another central file. The framework exposes state creation, contribution registration, key/action dispatch, viewport rendering, and prompt rendering behind a small `ChatTui` interface.

   将 `chat-tui.ts` 建成 framework surface，并按需拆出小型 companion modules。CLI host 已拥有 chat-specific state，但 TUI framework 不得把 `chat.ts` 再次变成 central file。Framework 通过小型 `ChatTui` interface 暴露 state creation、contribution registration、key/action dispatch、viewport rendering 与 prompt rendering。

2. Keep rendering line-oriented but framework-backed for this release.

   A production framework can render deterministic viewport snapshots without requiring alternate screen or cursor addressing on day one. This keeps Windows, CI, redirected output, tests, and npm release behavior stable while establishing the same state model future raw/full-screen rendering will consume.

   本次上线保持 line-oriented 但 framework-backed 的渲染方式。Production framework 可以先渲染确定性 viewport snapshots，不必第一天就依赖 alternate screen 或 cursor addressing。这样能稳定 Windows、CI、redirected output、tests 与 npm release 行为，同时建立未来 raw/full-screen rendering 会复用的状态模型。

3. Treat plugin support as declarative contribution intake, not execution.

   The TUI registry accepts plugin-sourced contributions and validates conflicts now, but actionable execution still flows through existing command/action/runtime contracts. This gives plugin scalability without letting plugin code mutate host internals.

   将 plugin support 视为声明式 contribution intake，而不是执行。TUI registry 现在接收 plugin-sourced contributions 并校验冲突，但可执行行为仍通过现有 command/action/runtime contracts。这样既具备插件扩展性，又不允许 plugin code 修改 host internals。

4. Use terminal profiles as the only gate for terminal-only UX.

   The framework enables interactive viewport and prompt rendering only for text output, TTY stdin/stdout, interactive renderer, and line/raw-capable input. JSON, JSONL, scripted input, CI, and redirected IO receive no terminal-only controls.

   只通过 terminal profiles 门控 terminal-only UX。Framework 仅在 text output、TTY stdin/stdout、interactive renderer 与 line/raw-capable input 下启用 interactive viewport 与 prompt rendering。JSON、JSONL、scripted input、CI 与 redirected IO 不接收 terminal-only controls。

## Risks / Trade-offs

- Framework state grows too quickly -> Keep the public surface small and cover it with contract tests before adding plugins.
- Users expect full-screen TUI immediately -> Status/help must say `viewport=line` until raw/full-screen rendering is added.
- Plugin conflicts become confusing -> Emit deterministic conflict diagnostics and show counts in startup/help.
- Prompt text pollutes automation -> Gate every TUI-only render through terminal profile and test structured/scripted absence.
- Keymap dispatch diverges from slash commands -> Route both through the same contribution registry and action resolver.

- Framework state 增长过快 -> 保持 public surface 小，并在加插件前用 contract tests 覆盖。
- 用户马上期待 full-screen TUI -> Status/help 必须显示 `viewport=line`，直到 raw/full-screen rendering 加入。
- Plugin conflicts 变得难理解 -> 输出确定性 conflict diagnostics，并在 startup/help 显示计数。
- Prompt text 污染自动化 -> 所有 TUI-only render 都通过 terminal profile 门控，并测试 structured/scripted absence。
- Keymap dispatch 与 slash commands 分叉 -> 两者都通过同一 contribution registry 与 action resolver。

## Migration Plan

1. Add framework-backed TUI state, registry, dispatcher, and renderer while keeping current line prompt behavior as the interactive viewport.
2. Wire chat startup, prompt redraw, and local slash command status to the new framework.
3. Add tests for state, contributions, dispatch, rendering, and structured fallback.
4. Keep previous JSON/JSONL/scripted behavior unchanged, so rollback is removing the framework-backed TUI wiring and restoring the prior basic renderer.

1. 增加 framework-backed TUI state、registry、dispatcher 与 renderer，同时保留现有行式 prompt 行为作为 interactive viewport。
2. 将 chat startup、prompt redraw 与 local slash command status 接入新 framework。
3. 增加 state、contributions、dispatch、rendering 与 structured fallback 测试。
4. 保持之前 JSON/JSONL/scripted 行为不变，因此回滚路径是移除 framework-backed TUI wiring 并恢复之前基础 renderer。

## Open Questions

- Whether raw-key input should become the default in a later release or remain opt-in per terminal profile.
- Which plugin manifest loader will feed the TUI registry after plugin execution policy is finalized.

- 后续版本 raw-key input 是否应成为默认，还是继续按 terminal profile opt-in。
- Plugin execution policy 定稿后，哪个 plugin manifest loader 会向 TUI registry 输入贡献。
