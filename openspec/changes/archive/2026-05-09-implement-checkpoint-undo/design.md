## Context

Core coding tools currently emit edit transaction evidence with precondition, affected path, before/after hashes, and rollback metadata. The workspace state manager records these transactions in memory, but it does not yet own a formal checkpoint lifecycle or provide a host-neutral restore/undo API.

当前 core coding tools 已经输出 edit transaction evidence，包含 precondition、affected path、before/after hash 与 rollback metadata。workspace state manager 会在内存中记录这些 transactions，但尚未拥有正式的 checkpoint 生命周期，也没有 host-neutral 的 restore/undo API。

R2 Context And Safety needs this before deeper autonomy: the model can make useful edits, but every write path must have deterministic recovery evidence, policy visibility, and replay coverage.

R2 Context And Safety 需要先补齐这一层再扩大自主能力：模型可以做有用编辑，但每条写入路径都必须有确定性的恢复证据、policy 可见性和 replay 覆盖。

## Goals / Non-Goals

**Goals:**

- Define checkpoint and undo contracts in `platform-contracts`.
- Implement deterministic checkpoint storage in `workspace-state-management`.
- Connect file write/edit transactions to checkpoint records.
- Support restore-by-checkpoint-id and undo-latest-applied-transaction for single-file v1.
- Emit redacted, replay-safe evidence for restore/undo.
- Cover behavior with unit, contract, integration, golden, and matrix tests.

**目标：**

- 在 `platform-contracts` 中定义 checkpoint 与 undo 契约。
- 在 `workspace-state-management` 中实现确定性的 checkpoint 存储。
- 将 file write/edit transactions 连接到 checkpoint records。
- 支持 v1 单文件 restore-by-checkpoint-id 与 undo-latest-applied-transaction。
- 为 restore/undo 输出脱敏、可 replay 的 evidence。
- 用 unit、contract、integration、golden 和 matrix tests 覆盖行为。

**Non-Goals:**

- Full worktree or overlay filesystem isolation.
- Multi-file atomic restore across partial platform failures.
- Git integration or branch-level rollback.
- VSCode visual diff UX.
- Persisted checkpoint schema migration beyond the current in-memory implementation.

**非目标：**

- 完整 worktree 或 overlay filesystem 隔离。
- 跨平台局部失败下的多文件原子恢复。
- Git 集成或分支级 rollback。
- VSCode visual diff UX。
- 超出当前 in-memory 实现的持久化 checkpoint schema migration。

## Decisions

1. **Checkpoint records live in workspace state, not core tools.**

   Core tools know how to produce mutations, but the workspace state manager owns recovery history because future VSCode/server hosts and subagents need the same checkpoint model. Tools will call `transact()` and receive checkpoint metadata from the manager.

   **中文：** checkpoint records 归 workspace state，而不是 core tools。core tools 负责产生 mutation，但恢复历史必须由 workspace state manager 拥有，因为未来 VSCode/server hosts 和 subagents 都要共享同一 checkpoint model。工具调用 `transact()`，并从 manager 得到 checkpoint metadata。

   Alternative considered: keep rollback content only inside tool evidence. Rejected because evidence is a trace artifact, not a restore API.

2. **V1 supports single-file deterministic restore with explicit status.**

   The first version will restore one file per checkpoint record. Multi-file transactions can be represented by multiple checkpoint records and later grouped by transaction id. Restore result status is `restored`, `rejected`, or `failed` so policy and hosts can render typed outcomes.

   **中文：** v1 支持单文件确定性恢复，并返回显式状态。第一版每个 checkpoint record 恢复一个文件。多文件 transaction 可先表示为多个 checkpoint records，未来再按 transaction id 分组。restore result status 为 `restored`、`rejected` 或 `failed`，便于 policy 与 hosts 渲染结构化结果。

   Alternative considered: implement multi-file atomic batches immediately. Rejected because current core tools only mutate one file per transaction.

3. **Checkpoint content is private state; evidence is redacted.**

   The checkpoint store may keep rollback content needed for local restore, but public evidence must include hashes, path metadata, and redaction fields. Secret-like content must be redacted before it reaches tool result metadata, session events, golden fixtures, or assertion messages.

   **中文：** checkpoint content 是私有状态；evidence 必须脱敏。checkpoint store 可以保存本地恢复所需的 rollback content，但公开 evidence 只能包含 hashes、path metadata 和 redaction fields。secret-like content 在进入 tool result metadata、session events、golden fixtures 或 assertion messages 前必须脱敏。

   Alternative considered: persist raw rollback content in session snapshots. Rejected because it violates R2 privacy and secret handling requirements.

4. **Undo uses latest applied eligible checkpoint by default.**

   `undoLatest()` searches applied, not-yet-restored checkpoint records in reverse transaction order, optionally scoped by session and path. This matches expected user behavior and keeps v1 deterministic.

   **中文：** undo 默认使用最近一个已应用且未恢复的 eligible checkpoint。`undoLatest()` 按 transaction 顺序反向查找，可选按 session 与 path 限定。这符合用户预期，也保持 v1 确定性。

   Alternative considered: expose arbitrary undo stack manipulation first. Rejected because policy and UX are not ready for arbitrary stack editing.

## Risks / Trade-offs

- [Risk] Raw rollback content could leak through evidence or snapshots. → Mitigation: keep restore payload private inside manager, expose only redacted evidence, and add no-raw-secret tests.
- [风险] raw rollback content 可能通过 evidence 或 snapshots 泄露。→ 缓解：恢复 payload 只保留在 manager 私有状态中，对外只暴露脱敏 evidence，并增加 no-raw-secret tests。

- [Risk] In-memory checkpoint records disappear across process restart. → Mitigation: document v1 as in-memory; future persisted session checkpoints need schema compatibility tests.
- [风险] in-memory checkpoint records 在进程重启后消失。→ 缓解：明确 v1 为 in-memory；未来持久化 session checkpoints 需要 schema compatibility tests。

- [Risk] Restore can overwrite newer user edits. → Mitigation: restore checks current content hash against expected after-hash unless explicitly forced in a future API.
- [风险] restore 可能覆盖用户后续编辑。→ 缓解：restore 检查当前内容 hash 是否匹配 expected after-hash，未来 API 才考虑显式 force。

- [Risk] Platform adapters may fail writes after a restore decision. → Mitigation: return `failed` with diagnostics and keep checkpoint record eligible for retry.
- [风险] platform adapter 可能在 restore decision 之后写入失败。→ 缓解：返回带 diagnostics 的 `failed`，并保留 checkpoint record 供 retry。

## Migration Plan

This is an additive in-memory capability. Existing transaction records remain valid. After implementation, core tools will receive richer transaction results with checkpoint references. No persisted migration is required for v1.

这是 additive 的 in-memory capability。现有 transaction records 仍然有效。实现后 core tools 会获得带 checkpoint reference 的更丰富 transaction result。v1 不需要持久化迁移。

Rollback strategy: disable calls to restore/undo while preserving transaction recording. Since no persisted schema changes are introduced, rollback is code-only.

回滚策略：禁用 restore/undo 调用，同时保留 transaction recording。由于没有引入持久化 schema 变更，回滚仅涉及代码。

## Open Questions

- Should v2 checkpoint records be persisted in session store, workspace metadata, or a dedicated local cache namespace?
- Should future multi-file restore fail closed when any path fails, or restore unaffected paths and emit partial evidence?
- Should user-facing undo require explicit policy approval when it writes to files, even though it restores a prior state?

- v2 checkpoint records 应该持久化到 session store、workspace metadata，还是专用 local cache namespace？
- 未来多文件 restore 在任意路径失败时是否应 fail closed，还是恢复未受影响路径并输出 partial evidence？
- 用户可见 undo 写文件时，即使是恢复旧状态，是否仍需要显式 policy approval？
