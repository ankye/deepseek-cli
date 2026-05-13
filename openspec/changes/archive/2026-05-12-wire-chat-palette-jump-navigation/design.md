## Context

The CLI composition layer already models result lists, active targets, reference sets, and jump history. Chat palette slash controls currently update focus with `/palette next|previous|first|last` and can add the focused item to the active reference set, but jump history is only observable as a count and cursor in `/palette state`.

CLI composition layer 已经建模 result lists、active targets、reference sets 和 jump history。Chat palette slash controls 当前可以通过 `/palette next|previous|first|last` 更新 focus，也可以把当前 focus 加入 active reference set，但 jump history 目前只能在 `/palette state` 中作为 count 与 cursor 被观察。

## Goals / Non-Goals

**Goals:**

- Add typed `back` and `forward` actions to the composition model.
- Resolve back/forward against existing jump history without executing command owners or runtime primitives.
- Preserve result-list focus when the jump destination corresponds to a result-list item target.
- Expose `/palette back` and `/palette forward` in chat using the same local state and structured rendering as existing palette navigation.
- Cover contract-level action resolution and CLI JSONL chat behavior.

- 给 composition model 增加类型化 `back` 与 `forward` actions。
- 基于已有 jump history 解析 back/forward，不执行 command owners 或 runtime primitives。
- 当 jump destination 对应 result-list item target 时，同步保留 result-list focus。
- 在 chat 中通过 `/palette back` 与 `/palette forward` 暴露该能力，复用现有 palette navigation 的本地状态和结构化渲染。
- 覆盖 contract-level action resolution 与 CLI JSONL chat behavior。

**Non-Goals:**

- No raw terminal key handling for `Ctrl+O`/`Ctrl+I` or vi key sequences in this slice.
- No persistent jump history across CLI process restarts.
- No new full-screen TUI, marks, registers, visual selection, or buffer model.
- No execution of palette entries, commands, tools, plugins, or workflows from jump traversal.

- 本阶段不做 `Ctrl+O`/`Ctrl+I` 或 vi key sequences 的 raw terminal key handling。
- 不跨 CLI 进程持久化 jump history。
- 不新增 full-screen TUI、marks、registers、visual selection 或 buffer model。
- jump traversal 不执行 palette entries、commands、tools、plugins 或 workflows。

## Decisions

1. Add `back` and `forward` to `CliActionKind`.

   This keeps jump traversal inside the same typed action system as `next`, `previous`, and `add-to-reference-set`. It avoids inventing chat-only command strings that cannot later map to keymaps or other hosts.

   将 `back` 与 `forward` 加入 `CliActionKind`。这样 jump traversal 与 `next`、`previous`、`add-to-reference-set` 处于同一个 typed action system 中，避免发明无法映射到 keymaps 或其他 host 的 chat-only command strings。

2. Store jump history as the source of truth.

   Navigation actions already append jump entries and update `jumpHistory.cursor`. Back decrements the cursor and focuses the destination at the new cursor. Forward increments the cursor and focuses that destination. Bounds failures return typed diagnostics instead of silently no-oping.

   以 jump history 作为 source of truth。Navigation actions 已经 append jump entries 并更新 `jumpHistory.cursor`。Back 递减 cursor 并聚焦新 cursor 上的 destination；forward 递增 cursor 并聚焦该 destination。越界失败返回 typed diagnostics，而不是静默 no-op。

3. Update result-list focus by matching destination target ids.

   Jump destination is a `CliTargetRef`, not a result-list item id. The resolver will update each result list whose item target id matches the destination id. This preserves the result-list cursor while keeping jump entries target-oriented.

   通过匹配 destination target id 更新 result-list focus。Jump destination 是 `CliTargetRef`，不是 result-list item id。Resolver 会更新 item target id 与 destination id 匹配的 result list。这样既保持 result-list cursor，又保持 jump entries 面向 target。

4. Keep chat rendering record-oriented.

   `/palette back|forward` will emit the existing palette action result plus palette state summary. JSONL stays record-oriented through `writeChatLocalLines`, and malformed inputs keep using typed local failures.

   Chat rendering 保持 record-oriented。`/palette back|forward` 会输出现有 palette action result 加 palette state summary。JSONL 继续通过 `writeChatLocalLines` 输出 records，格式错误输入继续使用 typed local failures。

## Risks / Trade-offs

- **Risk:** Back/forward cursor semantics differ from a full editor. → **Mitigation:** Scope this as composition jump traversal only; full Vim emulation remains deferred.
- **Risk:** Jump destination may not exist in the current result list after projection changes. → **Mitigation:** Focus active target from history and update result-list focus only when a matching item exists.
- **Risk:** Out-of-bounds traversal can confuse users. → **Mitigation:** Return `CLI_ACTION_TARGET_NOT_FOUND` diagnostics with the requested direction and preserve prior state.

- **风险：** Back/forward cursor 语义与完整编辑器不同。→ **缓解：** 本阶段只定义 composition jump traversal；完整 Vim emulation 继续延后。
- **风险：** Projection 改变后 jump destination 可能不在当前 result list 中。→ **缓解：** 仍从 history 聚焦 active target；只有存在匹配 item 时才更新 result-list focus。
- **风险：** 越界 traversal 可能让用户困惑。→ **缓解：** 返回包含方向的 `CLI_ACTION_TARGET_NOT_FOUND` diagnostics，并保留原 state。

## Migration Plan

1. Extend contracts and resolver behavior.
2. Wire chat palette back/forward controls and help text.
3. Add contract and CLI host tests.
4. Run OpenSpec, typecheck, lint, targeted tests, and boundary checks before archive.

1. 扩展 contracts 与 resolver behavior。
2. 接入 chat palette back/forward controls 与 help text。
3. 增加 contract 与 CLI host tests。
4. 归档前运行 OpenSpec、typecheck、lint、定向测试与 boundary checks。

## Open Questions

None for this slice. Raw keybindings for back/forward can map to these actions in a later terminal input change.

本阶段无开放问题。Raw keybindings for back/forward 可在后续 terminal input change 中映射到这些 actions。
