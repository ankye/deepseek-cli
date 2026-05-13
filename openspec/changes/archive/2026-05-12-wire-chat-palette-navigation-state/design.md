## Context

The current CLI has a typed composition model, palette projection, dry-run action resolution, result-list navigation semantics, reference-set updates, and minimal vi keymap profiles. Chat already exposes `/palette`, `/keymap`, and `/palette action`, but those controls create fresh projections per command and do not retain focus or reference state across chat lines.

当前 CLI 已有 typed composition model、palette projection、dry-run action resolution、result-list navigation semantics、reference-set updates 与 minimal vi keymap profiles。Chat 已暴露 `/palette`、`/keymap` 和 `/palette action`，但这些 controls 每次 command 都创建新的 projection，不能跨 chat lines 保留 focus 或 reference state。

## Goals / Non-Goals

**Goals:**

- Maintain a per-chat local `CliCompositionSnapshot` for palette/result-list interaction. / 为 palette/result-list interaction 维护每个 chat 的本地 `CliCompositionSnapshot`。
- Add bounded slash controls for result-list navigation and reference-set updates. / 增加有边界的 slash controls，用于 result-list navigation 和 reference-set updates。
- Render deterministic text/JSON/JSONL state summaries for tests and scripts. / 为 tests 与 scripts 渲染确定性的 text/JSON/JSONL state summaries。
- Keep every new control local and dry-run; no command owner, model, runtime, plugin, MCP, hook, or tool execution. / 保持所有新增 controls 本地且 dry-run；不执行 command owner、model、runtime、plugin、MCP、hook 或 tool。

**Non-Goals:**

- No raw terminal key handling or full-screen result list. / 不做 raw terminal key handling 或 full-screen result list。
- No persistent palette state after process exit. / 不在进程退出后持久化 palette state。
- No command execution from selected palette entries. / 不从选中的 palette entries 执行命令。
- No full Vim emulation, registers, marks, macros, or visual mode. / 不做完整 Vim 模拟、registers、marks、macros 或 visual mode。

## Decisions

### Decision: Chat owns host-local palette state

Chat will hold a small `paletteState` inside `ChatSessionState`. The state is initialized lazily from `createCliPaletteProjection()` and converted into a composition snapshot using shared palette helpers. Subsequent navigation and reference commands reuse the snapshot and apply `resolveCliAction()` state updates.

Chat 会在 `ChatSessionState` 内持有小型 `paletteState`。该 state 由 `createCliPaletteProjection()` 延迟初始化，并通过共享 palette helpers 转成 composition snapshot。后续 navigation 与 reference commands 会复用该 snapshot，并应用 `resolveCliAction()` 的 state updates。

Alternative considered: make `resolvePaletteAction()` global and stateless for all chat commands. Rejected because navigation requires continuity across slash commands.

备选方案：让所有 chat commands 继续使用全局无状态 `resolvePaletteAction()`。拒绝原因是 navigation 需要跨 slash commands 的连续性。

### Decision: Slash controls are verbs over the existing action model

`/palette next|previous|first|last` will map to `CliActionKind` navigation actions over the command-palette result-list. `/palette refs add current` will map to `add-to-reference-set` against the focused result-list item. `/palette state` will render a compact state projection, not the full snapshot.

`/palette next|previous|first|last` 会映射到 command-palette result-list 上的 `CliActionKind` navigation actions。`/palette refs add current` 会映射到 focused result-list item 上的 `add-to-reference-set`。`/palette state` 会渲染紧凑 state projection，而不是完整 snapshot。

Alternative considered: add new command names like `/next` and `/prev`. Rejected for this change because a bounded `/palette ...` namespace is easier to test, document, and keep local.

备选方案：新增 `/next` 和 `/prev` 等顶级命令。拒绝原因是本变更中有边界的 `/palette ...` namespace 更易测试、文档化并保持本地。

### Decision: Structured output stays record-oriented

JSON/JSONL output will emit small records such as `chat.command.palette-state` and `chat.command.palette-action` instead of dumping all entries on every navigation. Existing `/palette list` remains the way to inspect the full projection.

JSON/JSONL 输出会发出小记录，如 `chat.command.palette-state` 和 `chat.command.palette-action`，而不是每次 navigation 都 dump 所有 entries。现有 `/palette list` 仍用于查看完整 projection。

## Risks / Trade-offs

- [Risk] State in chat may drift from projection helpers. -> Mitigation: initialize snapshots from the same projection helpers and use shared action resolution. / [风险] chat 内 state 可能与 projection helpers 分叉。-> 缓解：从同一 projection helpers 初始化 snapshot，并使用共享 action resolution。
- [Risk] Users may expect navigation to execute/open targets. -> Mitigation: state records describe focus changes only; action results remain dry-run. / [风险] 用户可能以为 navigation 会执行或打开 targets。-> 缓解：state records 只描述 focus changes；action results 保持 dry-run。
- [Risk] Chat file can keep growing. -> Mitigation: isolate palette state helpers outside the main chat loop where practical. / [风险] chat 文件可能继续膨胀。-> 缓解：尽量把 palette state helpers 隔离到 main chat loop 外。

## Migration Plan

1. Export or add helper functions for creating palette composition snapshots and resolving action requests over explicit snapshots. / 导出或增加 helpers，用于创建 palette composition snapshots，并在显式 snapshots 上解析 action requests。
2. Add chat-local palette state and slash control handling. / 增加 chat-local palette state 与 slash control handling。
3. Add focused tests for JSONL navigation, reference updates, state summaries, and no model/runtime events. / 增加 JSONL navigation、reference updates、state summaries 和不产生 model/runtime events 的聚焦测试。
4. Validate OpenSpec, typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and hygiene checks. / 验证 OpenSpec、typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 hygiene checks。

Rollback: remove the new `/palette` subcommands and palette state field; existing stateless palette list/action commands remain intact.

回滚：移除新增 `/palette` subcommands 与 palette state 字段；现有无状态 palette list/action commands 保持可用。
