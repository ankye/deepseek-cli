## Context

The current TUI is contractually strong but visually and behaviorally thin. It reports framework id, mode, keymap, plugin metadata, and reasoning counts, yet it does not compose them into a stable product surface. Users need to understand where they are, what is active, why the agent is acting, what evidence backs a decision, and which command is available next.

当前 TUI 契约强但体验薄。它能报告 framework id、mode、keymap、plugin metadata 与 reasoning counts，却没有组合成稳定产品界面。用户需要知道自己在哪里、当前焦点是什么、agent 为什么行动、证据来自哪里、下一步可执行什么命令。

## Goals / Non-Goals

**Goals:**

- Create a deterministic workbench state model that can drive current line rendering and future fullscreen renderers.
- 创建确定性 workbench state model，可驱动当前 line rendering 与未来 fullscreen renderers。
- Make reasoning, inspector, command bar, activity, palette/results, and plugins feel like one native surface.
- 让 reasoning、inspector、command bar、activity、palette/results 与 plugins 像同一个原生界面。
- Preserve scripted, non-TTY, JSON, and JSONL output behavior.
- 保持 scripted、non-TTY、JSON 与 JSONL output 行为不变。
- Keep app-host rendering in `src/apps/cli` while using shared platform contracts for ids, targets, composition, and visible reasoning.
- 将 app-host rendering 保持在 `src/apps/cli`，同时使用共享 platform contracts 表示 ids、targets、composition 与 visible reasoning。

**Non-Goals:**

- Implementing raw terminal fullscreen drawing, mouse support, alternate screen buffering, or terminal cursor diffing in this change.
- 本变更不实现 raw terminal fullscreen drawing、mouse support、alternate screen buffering 或 terminal cursor diffing。
- Allowing plugins to execute arbitrary private renderers.
- 不允许插件执行任意私有 renderer。
- Exposing raw provider/internal reasoning.
- 不暴露 raw provider/internal reasoning。

## Decisions

### Decision: Workbench State Before Fullscreen Renderer

Build a host-level `ChatTuiWorkbench` projection with layout regions, focus, command bar, reasoning rail, inspector, activity feed, and plugin shelf. Render it as deterministic line frames now; future fullscreen/raw renderers can consume the same projection.

先构建 host-level `ChatTuiWorkbench` projection，包含 layout regions、focus、command bar、reasoning rail、inspector、activity feed 与 plugin shelf。当前渲染为确定性 line frames；未来 fullscreen/raw renderer 可消费同一 projection。

Alternative considered: jump directly to raw terminal alternate-screen rendering. Rejected because it would create high surface-area terminal risk before the product model is stable.

备选方案：直接进入 raw terminal alternate-screen rendering。拒绝原因是产品模型尚未稳定时，终端控制风险与平台差异过大。

### Decision: Focus Is A First-Class State Machine

Panel focus uses explicit panel ids, a focus history, and deterministic shortcuts. Focus changes never call the model and never mutate repo state.

Panel focus 使用显式 panel ids、focus history 与确定性快捷键。焦点变化不调用模型，也不修改仓库状态。

Alternative considered: infer focus from command mode only. Rejected because command mode cannot distinguish reasoning, inspector, activity, result-list, and plugin shelf.

备选方案：只从 command mode 推断 focus。拒绝原因是 command mode 无法区分 reasoning、inspector、activity、result-list 与 plugin shelf。

### Decision: Command Bar As Product Router

The command bar projects commands, palette entries, context workflows, reference actions, reasoning views, history, and plugin actions into searchable suggestions. It is a product router, not a prompt hack.

Command bar 将 commands、palette entries、context workflows、reference actions、reasoning views、history 与 plugin actions 投影成可搜索 suggestions。它是产品路由器，不是 prompt hack。

Alternative considered: keep slash help as the main command surface. Rejected because slash help scales poorly once plugins and workflows grow.

备选方案：继续以 slash help 作为主命令界面。拒绝原因是插件与工作流扩展后 slash help 会迅速失控。

### Decision: Reasoning Rail Stays Compact By Default

The rail displays bounded step summaries, status/certainty markers, evidence counts, and active record id. Details and evidence navigation live in the inspector.

Reasoning rail 默认保持紧凑，只展示 step summaries、status/certainty markers、evidence counts 与 active record id。细节与证据导航进入 inspector。

Alternative considered: render every reasoning record inline in the transcript. Rejected because it makes the main work unreadable.

备选方案：把每条 reasoning record 直接渲染进 transcript。拒绝原因是会干扰主工作流阅读。

## Risks / Trade-offs

- Workbench frames may feel verbose in narrow terminals. → Use compact stacked layout and bounded line counts.
- Workbench frame 在窄终端可能显得冗长。→ 使用 compact stacked layout 与有界行数。
- A richer state model can drift from existing palette/session state. → Derive from existing `CliCompositionSnapshot`, `ChatSessionState`, and visible reasoning projection rather than duplicating sources of truth.
- 更丰富 state model 可能与现有 palette/session state 漂移。→ 从既有 `CliCompositionSnapshot`、`ChatSessionState` 与 visible reasoning projection 派生，而不是复制 truth source。
- Plugins can overwhelm the command bar. → Rank trusted/core entries first, cap suggestion count, and show overflow counts.
- 插件可能淹没 command bar。→ core/trusted entries 优先、限制 suggestion 数量、显示 overflow counts。

## Migration Plan

1. Add workbench DTOs and projector functions in CLI host code.
2. 在 CLI host code 中增加 workbench DTO 与 projector functions。
3. Update startup/status rendering to use deterministic workbench frame lines.
4. 将 startup/status rendering 更新为确定性 workbench frame lines。
5. Add focus dispatch shortcuts and command bar suggestions without changing model dispatch.
6. 增加 focus dispatch shortcuts 与 command bar suggestions，不改变 model dispatch。
7. Add tests for layout, focus, command bar, reasoning rail, inspector, activity feed, plugins, and fallback.
8. 增加 layout、focus、command bar、reasoning rail、inspector、activity feed、plugins 与 fallback 测试。

Rollback is safe because the workbench projection is additive and scripted/structured output paths can continue using existing renderers.

回滚是安全的，因为 workbench projection 是增量能力，scripted/structured output paths 可继续使用现有 renderer。
