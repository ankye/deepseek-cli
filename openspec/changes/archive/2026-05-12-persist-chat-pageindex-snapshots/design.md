## Context

The CLI already records completed prompt turns into an in-memory PageIndex and exposes `/palette recall <query>` as a local quickfix-style result list. Focused recall results can become `turn` references and runtime projection can materialize those references as bounded `summary` context nodes.

CLI 目前已经把完成的 prompt turns 记录到内存 PageIndex，并通过 `/palette recall <query>` 暴露为本地 quickfix 风格 result list。聚焦的 recall 结果可以成为 `turn` reference，runtime projection 也能把这些 reference 物化为有界 `summary` context node。

The missing piece is durability. The session store already owns versioned snapshots and resume results, so PageIndex should persist as a bounded host snapshot rather than a new transcript database.

缺失的是持久性。session store 已经拥有 versioned snapshots 与 resume results，因此 PageIndex 应作为有界 host snapshot 持久化，而不是新增 transcript database。

## Goals / Non-Goals

**Goals:**

- Restore PageIndex recall after `deepseek chat --session <id>` before any new model request.
- Persist only bounded page metadata through `SessionStore.snapshot`.
- Keep slash recall local and model-hidden after resume.
- Preserve existing runtime/session contracts and app/package boundaries.
- Provide deterministic CLI regression coverage.

**Non-Goals:**

- No full transcript persistence or replay-based transcript reconstruction in this slice.
- No ZVec vector-database index yet; snapshot keeps the existing deferred semantic placeholder and stable page identity for later vector records.
- No durable palette UI state, jump stack, or reference-set restoration.
- No new public session contract types beyond the existing JSON payload.

## Decisions

1. **Snapshot payload is PageIndex-specific and versioned.**

   The payload uses a small JSON shape with `kind: "chat.pageindex.snapshot"`, `schemaVersion`, page count, pages, and redaction metadata. This keeps it explicit and rejectable if another snapshot kind is present.

   Snapshot payload 使用小型 JSON 形态，包含 `kind: "chat.pageindex.snapshot"`、`schemaVersion`、page count、pages 与 redaction metadata。这样可以明确识别，并在遇到其他 snapshot kind 时拒绝 hydrate。

2. **PageIndex scope defaults to session isolation, with future workspace/global expansion.**

   The current snapshot is scoped to the active session. Future non-isolated recall can add `workspace` or `global` PageIndex scopes, but every page and recall result must carry `scope`, `sessionId`, workspace provenance, and redaction metadata. This mirrors the useful reference pattern: global history can exist, but current-session records are prioritized and cross-session recall must be explicit.

   当前 snapshot 作用域限定在 active session。未来非隔离 recall 可以增加 `workspace` 或 `global` PageIndex scope，但每个 page 与 recall result 都必须携带 `scope`、`sessionId`、workspace provenance 与 redaction metadata。这吸收参考实现里有价值的模式：可以存在全局 history，但 current-session records 优先，跨 session recall 必须显式。

3. **ZVec is the vector database/index layer, not the embedding provider.**

   ZVec should store vector records keyed by deterministic PageIndex page ids, collection scope, embedding model id, dimensions, and source hashes. Embedding providers remain pluggable. A collection must not mix incompatible dimensions; provider/model changes require a new collection or reindex migration.

   ZVec 应作为 vector database/index layer，以确定性的 PageIndex page id、collection scope、embedding model id、dimensions 与 source hashes 作为 vector records 的关键元数据。Embedding providers 保持可插拔。一个 collection 不得混用不兼容 dimensions；provider/model 变更必须创建新 collection 或执行 reindex migration。

4. **PageIndex is an evidence catalog, not the whole code index.**

   PageIndex can reference code chunks, but code intelligence remains responsible for AST symbols, definitions/references, diagnostics, language-specific chunking, file versioning, and invalidation. PageIndex should store stable ids, source hashes, bounded previews, scopes, permissions, and optional vector-record pointers.

   PageIndex 可以引用 code chunks，但 code intelligence 仍负责 AST symbols、definitions/references、diagnostics、语言相关 chunking、file versioning 与 invalidation。PageIndex 应保存 stable ids、source hashes、有界 previews、scopes、permissions 与可选 vector-record pointers。

5. **Hydration validates and re-bounds pages.**

   `chatPageIndexPagesFromSnapshot` accepts only PageIndex-shaped records and re-applies preview limits. Invalid or incomplete pages are ignored rather than trusted.

   `chatPageIndexPagesFromSnapshot` 只接受 PageIndex 形态 records，并重新应用 preview 限制。无效或不完整 pages 会被忽略，而不是被信任。

6. **Chat resume fails closed for explicit `--session`.**

   If a user asks for `deepseek chat --session <id>` and the store cannot resume it, chat emits a typed local failure and exits without submitting model requests. This avoids silently starting a new session while the user believes they resumed prior context.

   如果用户显式请求 `deepseek chat --session <id>` 但 store 无法恢复，chat 输出 typed local failure 并退出，不提交 model request。这样避免用户以为恢复了上下文，实际却静默开了新 session。

7. **Default CLI runtime should share the persistent session store.**

   The normal CLI runtime should use the same persistent session store as scriptable session commands when no test runtime is injected. Tests keep deterministic stores by injecting dependencies.

   普通 CLI runtime 在没有注入测试 runtime 时，应使用与 scriptable session commands 相同的持久化 session store。测试通过注入 dependencies 保持确定性。

## Risks / Trade-offs

- [Risk] Snapshot previews can still include sensitive user text. -> Mitigation: persist only bounded previews, carry redaction metadata, and rely on existing session redaction for secret-like strings.
- [Risk] Old or malformed snapshot payloads could break chat startup. -> Mitigation: hydration is defensive and returns an empty PageIndex for unsupported payloads.
- [Risk] Explicit resume failure could interrupt scripted flows. -> Mitigation: only explicit `--session` fails closed; normal chat without `--session` continues to start fresh.
