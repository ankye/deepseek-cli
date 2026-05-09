## Context

DeepSeek now has a kernel-backed headless CLI, core coding tools, and a minimal interactive shell. The current session store records ordered events, but it lacks concrete resume/fork result contracts and CLI-visible controls that let users return to or branch from previous work.

DeepSeek 现在已有 kernel-backed headless CLI、core coding tools 和 minimal interactive shell。当前 session store 能记录有序事件，但缺少具体的 resume/fork result contracts，以及让用户回到或分叉既有工作的 CLI 可见控制入口。

## Goals / Non-Goals

**Goals:**

- Add typed session metadata, resume result, fork result, and lineage contracts to `platform-contracts`.
- 在 `platform-contracts` 中增加 typed session metadata、resume result、fork result 和 lineage contracts。
- Implement resume/fork-lite in the in-memory and development filesystem session stores.
- 在 in-memory 与 development filesystem session stores 中实现 resume/fork-lite。
- Route resumed/forked turns by passing a session id into the runtime kernel, preserving the governed execution path.
- 通过把 session id 传入 runtime kernel 来路由 resumed/forked turns，保持 governed execution path。
- Add CLI/session command surface that exposes resume/fork without the CLI owning private session state.
- 增加 CLI/session command surface，暴露 resume/fork，但 CLI 不拥有私有 session state。
- Add deterministic contract, integration, golden, compatibility, and e2e tests.
- 增加 deterministic contract、integration、golden、compatibility 和 e2e tests。

**Non-Goals:**

- No cloud sync, team memory sync, remote daemon persistence, or enterprise policy sync.
- 不实现 cloud sync、team memory sync、remote daemon persistence 或 enterprise policy sync。
- No rich transcript UI, branch graph visualization, or conflict merge UI.
- 不实现 rich transcript UI、branch graph visualization 或 conflict merge UI。
- No full checkpoint/undo workspace restore; fork-lite is session-history lineage only.
- 不实现完整 checkpoint/undo workspace restore；fork-lite 只处理 session-history lineage。

## Decisions

### Decision 1: Event-sourced resume returns reconstructed metadata, not UI transcript

Resume will reconstruct session state from stored events and snapshots into a typed `SessionResumeResult` containing session id, event count, latest sequence, metadata, lineage, and redacted preview fields. Host adapters can render it, but the store never persists terminal UI state.

resume 会从 stored events 和 snapshots 重建 session state，返回 typed `SessionResumeResult`，包含 session id、event count、latest sequence、metadata、lineage 和 redacted preview fields。host adapters 可以渲染它，但 store 不持久化 terminal UI state。

Alternative considered: persist the CLI transcript and replay it directly. Rejected because CLI rendering is host-specific and would break VSCode/server parity.

备选方案：持久化 CLI transcript 并直接 replay。拒绝原因：CLI rendering 是 host-specific，会破坏 VSCode/server parity。

### Decision 2: Fork-lite copies lineage and selected events, not workspace state

Fork-lite creates a new session id linked to a parent session and records a fork event with parent id, fork point sequence, reason, and inherited event count. The first version does not copy filesystem state; later checkpoint/undo work can attach workspace snapshot references.

fork-lite 创建一个关联 parent session 的新 session id，并记录 fork event，包含 parent id、fork point sequence、reason 和 inherited event count。第一版不复制 filesystem state；后续 checkpoint/undo 工作可以附加 workspace snapshot references。

Alternative considered: copy the whole workspace or create git worktrees. Rejected for R1 because it belongs to later checkpoint/worktree-overlay milestones and has higher safety risk.

备选方案：复制整个 workspace 或创建 git worktree。拒绝原因：这属于后续 checkpoint/worktree-overlay 里程碑，且安全风险更高。

### Decision 3: Runtime remains the execution owner

Resume/fork only affect which session id is used for subsequent kernel invocations. Runtime events, workflow, policy, scheduler, bus, and observability behavior remain unchanged except for preserving lineage metadata in session events.

resume/fork 只影响后续 kernel invocations 使用哪个 session id。runtime events、workflow、policy、scheduler、bus 和 observability 行为保持不变，除了在 session events 中保留 lineage metadata。

Alternative considered: create a special resumed runtime mode. Rejected because it would duplicate execution lifecycle logic.

备选方案：创建特殊 resumed runtime mode。拒绝原因：这会复制 execution lifecycle logic。

### Decision 4: CLI commands are host controls over session contracts

CLI may expose `session resume`, `session fork`, and interactive `/resume`/`/fork` controls, but these controls call session/runtime contracts and return structured command results. The CLI does not own or mutate raw event arrays directly.

CLI 可以暴露 `session resume`、`session fork` 以及 interactive `/resume`/`/fork` controls，但这些控制入口调用 session/runtime contracts 并返回 structured command results。CLI 不拥有或直接修改 raw event arrays。

Alternative considered: keep resume/fork only in tests. Rejected because R1 product needs a user-visible way to exercise the session model.

备选方案：只在 tests 中保留 resume/fork。拒绝原因：R1 产品需要用户可见入口来验证 session model。

## Risks / Trade-offs

- [Risk] Users may expect fork to isolate workspace files. → Mitigation: label this as fork-lite and record only session lineage until checkpoint/worktree work lands.
- [风险] 用户可能期望 fork 隔离 workspace files。→ 缓解：明确标注为 fork-lite，在 checkpoint/worktree 工作完成前只记录 session lineage。
- [Risk] Session ids can leak sensitive context if rendered carelessly. → Mitigation: return redacted previews and keep raw event payloads behind session-store APIs.
- [风险] 如果渲染不当，session ids 可能泄漏敏感上下文。→ 缓解：返回 redacted previews，并把 raw event payloads 保留在 session-store APIs 后面。
- [Risk] Development filesystem persistence can diverge from in-memory behavior. → Mitigation: contract tests run against both store implementations.
- [风险] development filesystem persistence 可能与 in-memory 行为分叉。→ 缓解：contract tests 同时覆盖两种 store implementation。
- [Risk] Compatibility drift can break persisted sessions. → Mitigation: compatibility fixtures require schema version and fail-closed unknown schema behavior.
- [风险] compatibility drift 可能破坏 persisted sessions。→ 缓解：compatibility fixtures 要求 schema version，并对 unknown schema fail closed。

## Migration Plan

1. Extend contracts and deterministic store behavior. / 扩展 contracts 与 deterministic store behavior。
2. Add runtime/session integration tests for explicit session id reuse and fork lineage. / 增加 explicit session id reuse 与 fork lineage 的 runtime/session integration tests。
3. Add CLI command/interactive controls and e2e smoke. / 增加 CLI command/interactive controls 与 e2e smoke。
4. Add compatibility and golden replay coverage before archive. / archive 前增加 compatibility 与 golden replay 覆盖。

Rollback: hide the CLI controls and keep the `SessionStore` contract methods available only to tests/runtime until the product surface is ready.

回滚：隐藏 CLI 控制入口，并暂时只让 tests/runtime 使用 `SessionStore` contract methods，直到产品表面准备好。
