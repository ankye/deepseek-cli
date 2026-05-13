## Context

Workspace PageIndex storage already persists bounded pages across chat sessions, and workspace-state checkpoints already expose an append-only list of workspace mutations. The previous stale policy uses current chat turn ordering, but persisted pages from earlier sessions do not have that ordering available in a later session.

Workspace PageIndex storage 已经跨 chat sessions 持久化有界 pages，workspace-state checkpoints 也已经暴露 workspace mutations 的追加列表。上一版 stale policy 使用当前 chat turn ordering，但较早 session 持久化的 pages 在后续 session 中没有可用的本地 turn ordering。

## Goals / Non-Goals

**Goals:**
- Store a durable, deterministic workspace mutation watermark with PageIndex pages.
- Use the checkpoint count as the first workspace-level mutation watermark because it is already available and ordered by append semantics.
- Downgrade only `fresh` pages when the current watermark is greater than the page watermark.
- Keep legacy pages without a watermark compatible and explicit as `unknown` rather than pretending they are fresh.

**Non-Goals:**
- Path-level freshness based on affected files or file hashes.
- Semantic freshness based on embeddings, zvec, or code-intelligence analysis.
- New platform/runtime contracts or migration of existing workspace metadata files.

## Decisions

- Represent the watermark as `evidenceQuality.workspaceCheckpointWatermark`.
  - Rationale: freshness is already grouped under evidence quality, and this avoids changing the top-level PageIndex page schema.
  - Alternative considered: add top-level `workspaceWatermark`. That would make page shape broader and less clearly tied to quality evidence.

- Use current `workspaceState.checkpoints().length` as the watermark.
  - Rationale: checkpoint records are append-only evidence for workspace mutations and deterministic in tests.
  - Alternative considered: use checkpoint timestamps. Existing in-memory checkpoints use deterministic epoch timestamps, so timestamps are not reliable for ordering.

- Treat missing watermarks as `unknown` for workspace recall when current checkpoint evidence exists.
  - Rationale: a legacy page cannot prove it was captured after current mutations. `unknown` is more honest than `fresh`.

- Keep the stale adjustment pure and parameterized.
  - Rationale: PageIndex command code stays testable and does not import workspace-state implementations.

## Risks / Trade-offs

- [Risk] Workspace-level watermarks may mark unrelated recall stale after an edit to an unrelated file. -> Mitigation: stale is a conservative warning; path-level invalidation can refine this later.
- [Risk] Checkpoint count is process/store-local and not a globally durable revision id. -> Mitigation: this first implementation uses the currently injected workspace-state evidence; future persistent workspace-state can replace the source without changing PageIndex semantics.
- [Risk] Legacy pages may shift from `fresh` to `unknown` in workspaces with checkpoints. -> Mitigation: this avoids false freshness and keeps recall usable with explicit uncertainty.
