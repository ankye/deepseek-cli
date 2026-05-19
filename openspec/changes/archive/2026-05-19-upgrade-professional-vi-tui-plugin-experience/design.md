## Context

The existing TUI stack is intentionally conservative: it renders bounded line frames, keeps JSON/JSONL clean, validates declarative plugin contributions, and exposes a shared action model. This makes it reliable, but it does not yet meet the expectations of users who live in Vim, tmux, fzf, lazygit, ranger, or full-screen terminal workflows.

现有 TUI stack 有意保守：它渲染有界 line frames、保持 JSON/JSONL 干净、校验声明式 plugin contributions，并暴露共享 action model。这让它可靠，但还达不到长期使用 Vim、tmux、fzf、lazygit、ranger 或 full-screen terminal workflows 的用户预期。

## Goals / Non-Goals

**Goals:**

- Provide a raw-key input pipeline that can drive TUI state without waiting for newline input.
- Provide a full-screen renderer profile with deterministic lifecycle and teardown.
- Make vi navigation feel native enough for expert users: counts, multi-key sequences, leader maps, command bar, Escape behavior, and scrollable regions.
- Make plugin extension mode explainable and configurable: users can inspect what a plugin contributes, why a binding wins/loses, what permissions execution needs, and what will happen before running it.
- Keep line TUI as a first-class fallback with equivalent semantic actions.
- Keep plugin execution routed through governed command/runtime contracts.

- 提供 raw-key input pipeline，使 TUI state 不必等待换行输入即可响应。
- 提供 full-screen renderer profile，并具备确定性的 lifecycle 与 teardown。
- 让 vi navigation 对专家用户足够自然：counts、多键序列、leader maps、command bar、Escape behavior 与可滚动 regions。
- 让 plugin extension mode 可解释、可配置：用户可以查看插件贡献了什么、某个 binding 为什么赢/输、执行需要哪些权限、执行前会发生什么。
- 保持 line TUI 作为一等 fallback，并具备等价 semantic actions。
- 保持 plugin execution 通过受治理的 command/runtime contracts 路由。

**Non-Goals:**

- No full Vim clone: no register system, macro recorder, visual selections, text objects, tabs/windows, or arbitrary ex command language in this change.
- No unreviewed plugin process execution from the renderer or input layer.
- No terminal-only state in structured outputs or model-visible prompt text.
- No dependence on one developer terminal; all behavior must be covered by deterministic fixtures.

- 不做完整 Vim clone：本变更不包含 register system、macro recorder、visual selections、text objects、tabs/windows 或任意 ex command language。
- renderer 或 input layer 不得直接执行未经审查的 plugin process。
- structured outputs 或 model-visible prompt text 中不得出现 terminal-only state。
- 不依赖某个开发者当前终端；所有行为必须由确定性 fixtures 覆盖。

## Decisions

1. Add raw input as a strategy, not a different product.

   Raw keys and line slash controls must resolve into the same typed action requests. The input adapter parses key tokens, counts, leader sequences, Escape, Enter, resize, and Ctrl+C into local events; it does not execute commands.

   将 raw input 作为 strategy，而不是另一个产品。Raw keys 与 line slash controls 必须解析为同一 typed action requests。Input adapter 将 key tokens、counts、leader sequences、Escape、Enter、resize 与 Ctrl+C 解析成本地 events；它不执行 commands。

2. Add full-screen rendering as a renderer profile with lifecycle evidence.

   The renderer owns alternate-screen enter/leave, cursor visibility, repaint bounds, resize recomputation, teardown on normal exit, teardown on error, and fallback when the terminal is unsafe. It consumes the workbench projection instead of owning runtime state.

   将 full-screen rendering 作为带 lifecycle evidence 的 renderer profile。Renderer 负责 alternate-screen enter/leave、cursor visibility、repaint bounds、resize recomputation、正常退出 teardown、错误 teardown，以及终端不安全时 fallback。它消费 workbench projection，不拥有 runtime state。

3. Make the vi grammar profile-driven and inspectable.

   The default professional profile supports practical navigation grammar: `j/k`, `h/l` where meaningful, `gg/G`, counts, `/` search/command entry, `:` command entry, `Enter` open/inspect, `Esc` cancel/back-to-normal, `q` quit current panel, `Ctrl+d/u` page movement, and a leader namespace for plugin actions. Users and plugins may extend profiles through namespaced manifests.

   让 vi grammar profile-driven 且可检查。默认 professional profile 支持实用导航 grammar：`j/k`、适用场景下的 `h/l`、`gg/G`、counts、`/` search/command entry、`:` command entry、`Enter` open/inspect、`Esc` cancel/back-to-normal、`q` quit current panel、`Ctrl+d/u` page movement，以及用于 plugin actions 的 leader namespace。用户与插件可以通过 namespaced manifests 扩展 profiles。

4. Make plugin extension mode evidence-first.

   Every plugin contribution gets a stable owner id, namespace, target modes, permissions, side effects, command/action descriptor, preview renderer, conflict group, and help text. The UI must show why a contribution is hidden, degraded, rejected, or selected. Executable plugin actions produce governed descriptors and require policy approval when side effects are not read-only.

   让 plugin extension mode evidence-first。每个 plugin contribution 都必须有 stable owner id、namespace、target modes、permissions、side effects、command/action descriptor、preview renderer、conflict group 与 help text。UI 必须展示 contribution 为什么 hidden、degraded、rejected 或 selected。可执行 plugin actions 生成受治理 descriptors，并在 side effects 非 read-only 时要求 policy approval。

5. Treat pleasant degradation as a product requirement.

   If raw/full-screen cannot run, line TUI still exposes the same command palette, plugin inspection, conflict explanation, slash controls, and action preview. JSON/JSONL remain clean and structured.

   将友好降级视为产品要求。如果 raw/full-screen 无法运行，line TUI 仍必须暴露同一 command palette、plugin inspection、conflict explanation、slash controls 与 action preview。JSON/JSONL 保持干净且结构化。

## Risks / Trade-offs

- Raw terminal behavior can corrupt sessions -> gate through terminal profiles, deterministic fixtures, teardown tests, and explicit fallback.
- vi users may expect full Vim -> document supported grammar and expose future extension slots without pretending full parity.
- Plugin keymaps can become chaotic -> require namespaces, conflict groups, precedence, discoverability, and user override rules.
- Full-screen renderer can hide logs -> keep structured event output separate and provide line fallback plus debug capture.
- Extra UX state can leak into model prompts -> tests must assert local-only command/state never enters prompt history.

- Raw terminal behavior 可能破坏会话 -> 通过 terminal profiles、确定性 fixtures、teardown tests 与显式 fallback 门控。
- vi 用户可能期待完整 Vim -> 记录支持的 grammar，并暴露未来 extension slots，但不假装 full parity。
- Plugin keymaps 可能混乱 -> 要求 namespaces、conflict groups、precedence、discoverability 与 user override rules。
- Full-screen renderer 可能隐藏日志 -> 保持 structured event output 独立，并提供 line fallback 与 debug capture。
- 额外 UX state 可能泄露进 model prompts -> 测试必须断言 local-only command/state 不进入 prompt history。

## Migration Plan

1. Introduce contracts and tests for raw input events, full-screen renderer lifecycle, professional vi grammar, and plugin contribution UX.
2. Implement raw input parser and terminal profile gates behind opt-in profile flags while keeping line TUI default where raw is unsafe.
3. Implement full-screen renderer over the existing workbench projection.
4. Implement plugin contribution inspector, conflict explanation, user override records, and governed execution descriptors.
5. Promote raw/full-screen readiness in diagnostics only after pseudo-terminal, matrix, golden, and e2e evidence pass.

1. 为 raw input events、full-screen renderer lifecycle、professional vi grammar 与 plugin contribution UX 引入 contracts 和 tests。
2. 在 opt-in profile flags 后实现 raw input parser 与 terminal profile gates；raw 不安全时保持 line TUI 默认。
3. 基于现有 workbench projection 实现 full-screen renderer。
4. 实现 plugin contribution inspector、conflict explanation、user override records 与 governed execution descriptors。
5. 只有 pseudo-terminal、matrix、golden 与 e2e evidence 全部通过后，才在 diagnostics 中提升 raw/full-screen readiness。

## Open Questions

- Should the first full-screen renderer be dependency-free ANSI or use a small terminal rendering library after boundary review?
- Should raw/full-screen default on only for known-safe profiles first, or behind `--tui full` until broader evidence lands?
- Which user config surface should own keymap overrides: root config, project config, or per-session command?

- 第一个 full-screen renderer 应该保持 dependency-free ANSI，还是经过边界审查后使用小型 terminal rendering library？
- raw/full-screen 是否先只对 known-safe profiles 默认开启，还是在更广证据落地前放在 `--tui full` 后？
- keymap overrides 应由哪个 user config surface 拥有：root config、project config，还是 per-session command？
