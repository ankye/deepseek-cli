## Context

The platform already has a contract-level `WorkspaceStateManager.revertRequest` API. `dryRun=true` powers CLI revert preview, while the same API with `dryRun=false` restores matching eligible checkpoints and rejects stale files through hash checks. The CLI currently exposes the preview path in scriptable mode and chat mode, including `current` resolution through local chat history.

平台已经具备 contract-level `WorkspaceStateManager.revertRequest` API。`dryRun=true` 支撑 CLI revert preview；同一个 API 在 `dryRun=false` 时会恢复 hash 匹配的 eligible checkpoints，并通过 hash checks 拒绝 stale files。当前 CLI 已经在可脚本化模式和 chat 模式暴露 preview，包括通过本地 chat history 解析 `current`。

This change adds a minimal apply surface on top of those existing contracts. It must keep the CLI host thin, avoid app-to-app imports, and avoid inventing a second rollback engine in the CLI.

本变更只在现有 contracts 之上增加最小 apply surface。它必须保持 CLI host 轻量，不做 app-to-app imports，也不在 CLI 里发明第二套 rollback engine。

## Goals / Non-Goals

**Goals:**

- Expose scriptable `deepseek revert apply ...` with typed output and checkpoint safety checks.
- Expose chat-local `/revert apply current` that resolves selected history to explicit session/turn ids.
- Preserve preview/apply separation in naming, output kind, dry-run flag, and mutation behavior.
- Keep malformed and unavailable targets typed, local, and non-model-visible.
- Add deterministic tests for success, stale rejection, chat-local apply, and no-model-submission behavior.

- 暴露可脚本化 `deepseek revert apply ...`，输出类型化结果，并复用 checkpoint safety checks。
- 暴露 chat-local `/revert apply current`，把 selected history 解析成显式 session/turn ids。
- 在命名、output kind、dry-run flag 与 mutation behavior 上保持 preview/apply 分离。
- malformed 与 unavailable targets 必须类型化、本地化、不可见于 model。
- 增加 success、stale rejection、chat-local apply、no-model-submission 的确定性测试。

**Non-Goals:**

- No force revert, conflict resolution UI, patch editing UI, or interactive confirmation prompt in this slice.
- No destructive session history rewriting; revert remains compensating evidence.
- No raw rollback content in CLI output, traces, tests, or specs.
- No new checkpoint storage backend.

- 本次不做 force revert、conflict resolution UI、patch editing UI 或交互确认 prompt。
- 不做破坏性 session history rewriting；revert 仍是补偿性 evidence。
- CLI output、traces、tests 或 specs 中不暴露 raw rollback content。
- 不增加新的 checkpoint storage backend。

## Decisions

1. Reuse `WorkspaceStateManager.revertRequest` for apply.

   `applyRevert` will call `revertRequest({ target, dryRun: false, reason })`. This keeps all restore ordering, stale-file checks, status calculation, checkpoint status updates, and redaction in the workspace state manager. The alternative was to loop over checkpoints inside the CLI, but that would duplicate policy-critical restore rules and violate the thin host boundary.

   `applyRevert` 将调用 `revertRequest({ target, dryRun: false, reason })`。这样 restore ordering、stale-file checks、status calculation、checkpoint status updates 与 redaction 都继续由 workspace state manager 负责。备选方案是在 CLI 内循环 checkpoints，但这会复制关键 restore 规则，并破坏 thin host boundary。

2. Keep preview and apply records separate.

   Preview records stay `kind: "revert.preview"` and `dryRun: true`. Apply records use `kind: "revert.apply"` and `dryRun: false`. JSONL summaries use `revert.apply.summary` and `revert.apply.diagnostic`, while chat wraps them as `chat.command.revert-apply`. This makes automation able to distinguish non-mutating evidence from actual compensation.

   Preview records 保持 `kind: "revert.preview"` 与 `dryRun: true`。Apply records 使用 `kind: "revert.apply"` 与 `dryRun: false`。JSONL summary 使用 `revert.apply.summary` 和 `revert.apply.diagnostic`，chat 中外层包装为 `chat.command.revert-apply`。这样自动化脚本可以清楚区分非修改 evidence 与真实补偿动作。

3. Resolve `current` before applying.

   Chat `/revert apply current` reuses the selected chat history entry and sends explicit `{ sessionId, turnId }` to `applyRevert`. If no selected history exists, it emits `CLI_REVERT_CURRENT_UNAVAILABLE`. The CLI never passes an opaque `current` selector into workspace contracts.

   Chat `/revert apply current` 复用 selected chat history entry，并把显式 `{ sessionId, turnId }` 传给 `applyRevert`。如果没有 selected history，则输出 `CLI_REVERT_CURRENT_UNAVAILABLE`。CLI 不会把不透明的 `current` selector 传入 workspace contracts。

4. No force flag in this change.

   Stale files remain rejected. This is intentionally conservative because force revert needs a separate design for user intent, diff display, partial conflict handling, and audit evidence.

   本次不提供 force flag。Stale files 继续拒绝。这样更保守，因为 force revert 需要单独设计用户意图、diff display、partial conflict handling 与 audit evidence。

## Risks / Trade-offs

- **Risk:** Users may expect `/revert apply current` to ask again before mutation. → **Mitigation:** This slice keeps the command explicit and scriptable; a future richer TUI can add a confirmation layer before invoking the same apply API.
- **Risk:** In-memory test/runtime checkpoints may not persist across separate CLI processes. → **Mitigation:** Tests inject runtime dependencies; persistent storage is a separate backend concern and not hidden by CLI behavior.
- **Risk:** Partial restore can be misunderstood as success. → **Mitigation:** Render `status`, restored/stale/non-restorable counts, diagnostics, and redaction metadata in every output mode.

- **风险：** 用户可能期望 `/revert apply current` 在 mutation 前再次确认。→ **缓解：** 本阶段保持命令显式且可脚本化；未来 richer TUI 可以在调用同一个 apply API 前增加 confirmation layer。
- **风险：** In-memory test/runtime checkpoints 无法跨独立 CLI 进程持久化。→ **缓解：** 测试注入 runtime dependencies；持久化存储是单独 backend 问题，不由 CLI 行为掩盖。
- **风险：** Partial restore 可能被误解成成功。→ **缓解：** 每种 output mode 都渲染 `status`、restored/stale/non-restorable counts、diagnostics 和 redaction metadata。

## Migration Plan

1. Add OpenSpec delta requirements.
2. Extend CLI arg parsing and help for `revert apply`.
3. Extend revert command implementation with `applyRevert` and renderer.
4. Wire chat `/revert apply current`.
5. Add deterministic CLI tests and run validation.

1. 增加 OpenSpec delta requirements。
2. 扩展 CLI arg parsing 和 help，支持 `revert apply`。
3. 扩展 revert command implementation，增加 `applyRevert` 和 renderer。
4. 接入 chat `/revert apply current`。
5. 增加确定性 CLI tests 并运行验证。

## Open Questions

None for this slice. Force revert, interactive confirmation, and persisted checkpoint storage remain future changes.

本阶段无开放问题。Force revert、interactive confirmation 与 persisted checkpoint storage 留给后续变更。
