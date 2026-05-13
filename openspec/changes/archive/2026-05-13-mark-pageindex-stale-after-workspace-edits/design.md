## Context

PageIndex pages already carry bounded freshness metadata, and workspace edits already produce checkpoint records through `WorkspaceStateManager`. The missing link is recall-time freshness adjustment: a page recorded before a later workspace mutation should not remain model-visible as `fresh` when the CLI can prove the later mutation happened in the same chat session.

PageIndex pages 已经携带有界 freshness metadata，workspace edits 也已经通过 `WorkspaceStateManager` 产生 checkpoint records。缺失的是 recall-time freshness adjustment：当 CLI 能证明同一 chat session 中 page 之后发生了 workspace mutation 时，该 page 不应继续以 `fresh` 暴露给模型。

## Goals / Non-Goals

**Goals:**
- Derive first-version staleness from existing workspace checkpoint evidence.
- Use chat turn ordering, not wall-clock timestamps, because current checkpoint timestamps can be deterministic/fallback values.
- Keep PageIndex logic pure and host-facing: pass in checkpoint-like mutation evidence instead of importing workspace-state implementation.
- Preserve existing `stale` and `unknown` behavior.

**Non-Goals:**
- Path-level invalidation or file hash comparison for recalled pages.
- Cross-session stale inference when local turn order is unavailable.
- zvec/vector semantic freshness, embeddings, or PageIndex ranking changes.
- New persistence fields or migration of existing PageIndex payloads.

## Decisions

- Add a pure PageIndex stale adjustment helper that accepts pages, chat history turn order, and workspace mutation evidence.
  - Rationale: PageIndex stays independent of workspace-state implementation and remains easy to test.
  - Alternative considered: call `workspaceState.checkpoints()` inside `resolveChatPageIndexRecall`. That would couple a search/ranking helper to host runtime dependencies.

- Compare same-session `turnId` order using chat history indexes.
  - Rationale: turn order is the canonical ordering for a chat session and works even when checkpoint timestamps are deterministic.
  - Alternative considered: compare `createdAt`. Current workspace checkpoints can share the same deterministic epoch timestamp, so timestamp ordering would be false precision.

- Downgrade only pages whose current normalized freshness is `fresh`.
  - Rationale: restored `stale` must remain stale, and `unknown` must not be upgraded or reinterpreted.

- For workspace recall, apply the same rule only to pages whose session and turn ids are present in the current chat history.
  - Rationale: persisted workspace PageIndex can contain pages from other sessions; without local ordering, marking them stale would be guessing.

## Risks / Trade-offs

- [Risk] Same-session workspace-level stale can be conservative because it does not know whether the edit touched files relevant to a recalled page. -> Mitigation: mark the first version explicitly as workspace/session-level and keep projection wording that recalled evidence must be verified.
- [Risk] Cross-session workspace recall may still show `fresh` even after edits from another session. -> Mitigation: avoid false precision now; future path/file-snapshot watermarks can add cross-session invalidation.
- [Risk] Reverted checkpoints may still count as mutation evidence. -> Mitigation: this slice treats any checkpoint after the page as workspace-change evidence; later compensation-aware logic can refine restored effects.
