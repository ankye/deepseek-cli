## Context

The CLI now supports both dry-run revert preview and real revert apply. Chat users can also target the selected history turn with `/revert apply current`. That is functional, but it compresses review and mutation into one command in the interactive surface.

CLI 现在同时支持 dry-run revert preview 与真实 revert apply。Chat 用户也可以通过 `/revert apply current` 定位 selected history turn。但在交互界面里，这仍然把 review 和 mutation 压缩在一条命令里。

This change adds a local confirmation layer in the chat adapter. The layer must stay host-local, deterministic, and small: it stores pending review metadata, not raw rollback content, and delegates all dry-run/apply behavior to existing revert helpers and workspace state contracts.

本变更在 chat adapter 中增加一个本地确认层。该层必须保持 host-local、deterministic、small：它保存 pending review metadata，而不是 raw rollback content，并把所有 dry-run/apply 行为委托给现有 revert helpers 和 workspace state contracts。

## Goals / Non-Goals

**Goals:**

- Add `/revert review current` to create a pending review from the selected chat history turn.
- Add `/revert confirm <review-id|current>` to apply the exact reviewed target.
- Render stable review ids and structured review/confirmation records in text, JSON, and JSONL output.
- Keep review and confirm local, model-hidden, and free of raw rollback content.
- Preserve scriptable `deepseek revert apply ...` and existing `/revert apply current`.

- 增加 `/revert review current`，基于 selected chat history turn 创建 pending review。
- 增加 `/revert confirm <review-id|current>`，只对已 review 的精确 target 执行 apply。
- 在 text、JSON、JSONL output 中渲染稳定 review ids 和结构化 review/confirmation records。
- review 与 confirm 保持本地、对 model 不可见，且不包含 raw rollback content。
- 保留可脚本化 `deepseek revert apply ...` 与现有 `/revert apply current`。

**Non-Goals:**

- No full-screen TUI, key-driven modal interaction, or patch editing UI in this slice.
- No forced apply, conflict merge, or stale override.
- No durable review storage across CLI process restarts.

- 本次不做全屏 TUI、键盘 modal interaction 或 patch editing UI。
- 不做 forced apply、conflict merge 或 stale override。
- 不跨 CLI 进程持久化 review。

## Decisions

1. Store pending reviews in chat session state.

   Each review contains `reviewId`, explicit revert target, preview status, affected counts, diagnostics, selected turn id, and redaction metadata. It does not store raw rollback content or private checkpoint content. A deterministic id such as `review-<n>` is enough for a single chat process.

   每个 review 包含 `reviewId`、显式 revert target、preview status、affected counts、diagnostics、selected turn id 和 redaction metadata。不存储 raw rollback content 或私有 checkpoint content。单个 chat 进程内使用 `review-<n>` 这种确定性 id 足够。

2. Confirm reuses `applyRevert`.

   Confirmation does not implement restore itself. It looks up the pending review target and invokes `applyRevert`. If workspace state changed after review, the existing checkpoint stale checks reject safely.

   Confirm 不自行实现 restore。它查找 pending review target，然后调用 `applyRevert`。如果 workspace state 在 review 后发生变化，现有 checkpoint stale checks 会安全拒绝。

3. Keep `/revert apply current` for explicit direct apply.

   The review/confirm flow is the safer interactive path, but direct apply remains available because it was already specified and is useful for scripted chat inputs. Help will show both surfaces and make review/confirm visible.

   review/confirm 是更安全的交互路径，但 direct apply 继续保留，因为它已经被规格化，并对 scripted chat inputs 有用。Help 会同时展示两种 surface，并突出 review/confirm。

## Risks / Trade-offs

- **Risk:** A pending review can become stale before confirm. → **Mitigation:** Confirm invokes real apply and relies on hash safety checks; stale files remain unchanged and return typed diagnostics.
- **Risk:** Users may confuse multiple pending reviews. → **Mitigation:** Render deterministic `reviewId`, target ids, selected turn id, and counts; `current` resolves to the latest pending review.
- **Risk:** Confirmation state is process-local. → **Mitigation:** This is acceptable for the chat shell slice; durable review records can be added when persistent checkpoint/session views are introduced.

- **风险：** pending review 可能在 confirm 前变 stale。→ **缓解：** Confirm 调用真实 apply 并依赖 hash safety checks；stale files 保持不变并返回类型化 diagnostics。
- **风险：** 用户可能混淆多个 pending reviews。→ **缓解：** 渲染确定性的 `reviewId`、target ids、selected turn id 和 counts；`current` 解析为最新 pending review。
- **风险：** confirmation state 只存在于进程内。→ **缓解：** 对 chat shell 阶段可接受；持久 review records 可在后续 persistent checkpoint/session views 中增加。

## Migration Plan

1. Add review record state and rendering helpers.
2. Wire `/revert review current` and `/revert confirm <review-id|current>`.
3. Update chat help and tests.
4. Validate OpenSpec and run regression checks.

1. 增加 review record state 与 rendering helpers。
2. 接入 `/revert review current` 和 `/revert confirm <review-id|current>`。
3. 更新 chat help 和 tests。
4. 验证 OpenSpec 并运行 regression checks。

## Open Questions

None for this slice. Full TUI confirmation and diff rendering remain future polish.

本阶段无开放问题。完整 TUI confirmation 和 diff rendering 留给后续打磨。
