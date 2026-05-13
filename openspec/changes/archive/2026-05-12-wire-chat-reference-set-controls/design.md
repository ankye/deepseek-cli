## Context

The current chat palette state owns a `CliCompositionSnapshot` with result lists, reference sets, active target, and jump history. `/palette refs add current` already uses the shared `add-to-reference-set` action to append the focused result-list item to the active reference set, but the only visible result is the aggregate reference count in `/palette state`.

当前 chat palette state 持有 `CliCompositionSnapshot`，其中包含 result lists、reference sets、active target 和 jump history。`/palette refs add current` 已经通过共享 `add-to-reference-set` action 将当前 result-list item 加入 active reference set，但目前用户只能在 `/palette state` 中看到聚合的 reference count。

## Goals / Non-Goals

**Goals:**

- Render reference sets and reference items deterministically in text, JSON, and JSONL.
- Allow chat users to focus an existing reference by reference id, one-based index, target id, or `current`.
- Keep focus switching as a local composition snapshot update.
- Return typed diagnostics for missing or malformed reference focus selectors.
- Preserve existing result-list navigation, jump history, and reference add behavior.

- 以 text、JSON、JSONL 确定性渲染 reference sets 与 reference items。
- 允许 chat 用户通过 reference id、一基 index、target id 或 `current` 聚焦已有 reference。
- 将 focus switching 保持为本地 composition snapshot update。
- 对 missing 或 malformed reference focus selectors 返回类型化 diagnostics。
- 保留现有 result-list navigation、jump history 和 reference add behavior。

**Non-Goals:**

- No prompt context injection or runtime context projection in this slice.
- No reference removal, rename, persistence, multi-set creation, or token budgeting UI.
- No raw file content preview.
- No full-screen TUI or raw keybindings.

- 本阶段不做 prompt context injection 或 runtime context projection。
- 不做 reference removal、rename、persistence、multi-set creation 或 token budgeting UI。
- 不预览 raw file content。
- 不做 full-screen TUI 或 raw keybindings。

## Decisions

1. Add a typed focus action instead of chat-only mutation.

   `focus-reference` becomes a `CliActionKind`, allowing the same resolver semantics to support slash controls now and keymap/palette controls later.

   增加类型化 focus action，而不是 chat-only mutation。`focus-reference` 成为 `CliActionKind`，这样同一 resolver 语义现在可支持 slash controls，后续也可支持 keymap/palette controls。

2. Keep reference list rendering in the CLI host.

   Listing is read-only rendering of snapshot state. It does not need a command-system resolver call, but it must still use platform contracts and redaction metadata.

   将 reference list rendering 保留在 CLI host。Listing 是 snapshot state 的只读渲染，不需要 command-system resolver call，但仍必须使用 platform contracts 与 redaction metadata。

3. Resolve focus selectors locally and deterministically.

   Focus selectors match `current`, reference id, one-based order/index, or target id. `current` resolves to the active reference item if present, otherwise the first item. Missing selectors produce a typed action result with `CLI_ACTION_TARGET_NOT_FOUND`.

   本地且确定性地解析 focus selectors。Focus selectors 匹配 `current`、reference id、一基 order/index 或 target id。`current` 优先解析 active reference item，否则解析第一个 item。缺失 selector 产生带 `CLI_ACTION_TARGET_NOT_FOUND` 的 typed action result。

4. Focus updates active reference item and active target.

   A successful focus updates the owning `CliReferenceSet.activeItemId` and `snapshot.activeTarget`, without changing result-list focus or jump history. This keeps reference focus separate from result navigation.

   Focus 会更新 active reference item 与 active target。成功 focus 会更新所属 `CliReferenceSet.activeItemId` 和 `snapshot.activeTarget`，但不改变 result-list focus 或 jump history。这样 reference focus 与 result navigation 保持分离。

## Risks / Trade-offs

- **Risk:** Users may expect focused references to automatically enter prompts. → **Mitigation:** This slice explicitly renders and focuses references only; runtime context projection is a follow-up.
- **Risk:** Multiple reference sets later may need richer selectors. → **Mitigation:** Current resolver preserves set ids and item ids, so later multi-set selectors can extend without breaking existing controls.
- **Risk:** Text output can become noisy. → **Mitigation:** Text lists concise ids, active marker, label, and target id only; structured output carries full metadata.

- **风险：** 用户可能期待 focused references 自动进入 prompts。→ **缓解：** 本阶段只渲染和聚焦 references；runtime context projection 是后续工作。
- **风险：** 后续多个 reference sets 可能需要更丰富 selectors。→ **缓解：** 当前 resolver 保留 set ids 与 item ids，后续 multi-set selectors 可扩展且不破坏现有 controls。
- **风险：** Text output 可能变得嘈杂。→ **缓解：** Text 只列简洁 ids、active marker、label 和 target id；structured output 保留完整 metadata。

## Migration Plan

1. Extend action contracts and resolver with `focus-reference`.
2. Add reference list/focus helpers and renderers in chat palette state.
3. Wire `/palette refs list` and `/palette refs focus ...`.
4. Add contract and CLI host tests, then run verification and archive.

1. 扩展 action contracts 与 resolver，加入 `focus-reference`。
2. 在 chat palette state 中增加 reference list/focus helpers 与 renderers。
3. 接入 `/palette refs list` 与 `/palette refs focus ...`。
4. 增加 contract 与 CLI host tests，然后运行验证并归档。

## Open Questions

None for this slice. Reference removal, persistence, and prompt context projection remain follow-up work.

本阶段无开放问题。Reference removal、persistence 与 prompt context projection 留作后续工作。
