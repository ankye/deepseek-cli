## Context

The CLI now has session-scoped PageIndex recall, session snapshot resume, and explicit recall scope parsing. Workspace/global scope requests are currently deferred locally. The next useful increment is workspace recall because it can be implemented as a deterministic local evidence catalog over existing bounded PageIndex pages. ZVec and embedding providers remain future ranking layers over this catalog.

CLI 现在已有 session-scoped PageIndex recall、session snapshot resume 和显式 recall scope parsing。workspace/global scope 请求当前仍本地 deferred。下一步最有价值的是 workspace recall，因为它可以作为现有有界 PageIndex pages 之上的确定性本地 evidence catalog 来实现。ZVec 与 embedding providers 仍是未来叠加在该 catalog 之上的 ranking layers。

## Goals / Non-Goals

**Goals:**

- Make `/palette recall --scope workspace <query>` return real workspace evidence across chat sessions.
- Persist only bounded previews and stable provenance, never raw full transcript content.
- Keep storage host-owned and small, without leaking implementation into `platform-contracts`.
- Avoid further growth in `chat.ts` and `pageindex.ts` by adding a focused store module.

**Non-Goals:**

- Do not implement global recall.
- Do not implement ZVec, embeddings, semantic ranking, reindexing, or code chunk indexing.
- Do not create a new shared package until a second host or runtime component needs the store.

## Decisions

1. Store workspace PageIndex under workspace metadata.
   - Decision: derive the location from `platform.workspaceMetadataPath(workspaceRoot, "deepseek")` and store a sibling `pageindex.json`.
   - Rationale: this keeps the data workspace-local and uses existing platform path validation.
   - Alternative considered: user config storage. That would blur workspace/global boundaries and complicate isolation.

2. Persist normalized workspace copies of chat pages.
   - Decision: convert session pages to `scope: "workspace"` records with the same bounded previews, ids, session id, turn id, rank metadata, and redaction metadata.
   - Rationale: recall results need explicit provenance and must not mix scope semantics.
   - Alternative considered: reuse the same `scope=session` page objects. That would make later projection unable to distinguish workspace evidence.

3. Use deterministic text ranking first.
   - Decision: workspace recall uses the same deterministic text search/ranking as session recall.
   - Rationale: it is transparent, testable, and enough for R1. ZVec can later index the same page ids.
   - Alternative considered: add a vector provider now. That would increase configuration, failure modes, and test surface before the catalog is stable.

4. Fail closed on workspace storage errors.
   - Decision: if workspace metadata cannot be resolved or read/write fails, workspace recall emits a typed local failure/deferred diagnostic instead of falling back to session results.
   - Rationale: a requested scope must not silently return a different scope.

## Risks / Trade-offs

- [Risk] Local workspace metadata could grow.
  → Mitigation: cap stored pages and keep only bounded previews.

- [Risk] Chat turns continue if workspace persistence fails.
  → Mitigation: prompt execution remains successful, but workspace recall later reports typed local storage failure; session recall and session snapshots remain available.

- [Risk] Store shape may need migration.
  → Mitigation: include schema version and ignore incompatible payloads until a migration requirement is added.
