## Context

Chat PageIndex currently records completed prompt turns as session-scoped pages and can restore those pages from session snapshots. The CLI already returns `scope: "session"` in recall summaries and item provenance, but users cannot explicitly request a scope. The product direction allows PageIndex to support session isolation and future non-isolated workspace/global recall, while ZVec remains a future semantic ranking layer rather than an R1 dependency.

Chat PageIndex 目前把完成的 prompt turns 记录为 session-scoped pages，并能从 session snapshots 恢复。CLI 已经在 recall summary 与 item provenance 中返回 `scope: "session"`，但用户还不能显式请求 scope。产品方向允许 PageIndex 支持 session 隔离以及未来非隔离 workspace/global recall，而 ZVec 仍是后续语义排序层，不作为 R1 依赖。

## Goals / Non-Goals

**Goals:**

- Make `/palette recall` scope explicit without changing default session behavior.
- Keep unsupported workspace/global recall safe and typed instead of silently returning session data.
- Preserve result provenance so later projection and hallucination guards can rely on scope.
- Keep the implementation local to the CLI host PageIndex recall path.

**Non-Goals:**

- Do not implement workspace/global PageIndex storage in this slice.
- Do not introduce ZVec, embedding providers, semantic ranking, or code indexing.
- Do not move PageIndex into a shared package before there is a second host/index consumer.

## Decisions

1. Use a small local parser for recall scope.
   - Decision: parse `--scope <session|workspace|global>` inside the chat-local palette recall branch.
   - Rationale: the command is only available inside the chat shell today, and the rest of chat-local palette controls already parse locally.
   - Alternative considered: add a global CLI flag or command-system manifest field. That would be premature because scriptable recall and workspace/global indexes do not exist yet.

2. Default scope remains `session`.
   - Decision: `/palette recall <query>` is equivalent to `/palette recall --scope session <query>`.
   - Rationale: this preserves existing behavior and matches the only implemented storage boundary.
   - Alternative considered: require `--scope` for all recall calls. That would break current ergonomics without adding safety.

3. Workspace/global return typed deferred records.
   - Decision: broader scopes emit a local `chat.command.palette-recall.deferred` record in structured modes and a concise text notice in text mode.
   - Rationale: users can express intent, tests can assert behavior, and the CLI does not hallucinate unavailable memory.
   - Alternative considered: fall back to session recall. That would be misleading because the result scope would not match the requested scope.

## Risks / Trade-offs

- [Risk] Scope parsing could conflict with user queries that intentionally contain `--scope`.
  → Mitigation: only treat `--scope` as an option when followed by a recognized position; invalid or missing values produce typed local failures.

- [Risk] Deferring workspace/global could feel like an incomplete feature.
  → Mitigation: return explicit records with `requestedScope`, `availableScopes`, and a stable diagnostic code so the next implementation slice can replace the deferred path cleanly.

- [Risk] Scope types could become duplicated later.
  → Mitigation: keep a local narrow type now; promote it to `platform-contracts` when another package or host consumes it.
