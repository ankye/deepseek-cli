## Context

PageIndex pages already carry `createdAt`, `evidenceQuality`, and `freshnessStatus`, and runtime projection already includes that status in model-visible evidence summaries. The current `known/unknown` wording is too weak: it confirms timestamp provenance but does not say whether the recall is usable as fresh historical evidence.

PageIndex pages 已经携带 `createdAt`、`evidenceQuality` 与 `freshnessStatus`，runtime projection 也已在模型可见 evidence summary 中包含该 status。当前 `known/unknown` 表达过弱：它只能确认 timestamp provenance，不能说明 recall 是否可作为 fresh historical evidence 使用。

## Goals / Non-Goals

**Goals:**
- Introduce a bounded freshness vocabulary that is explicit enough for later PageIndex/zvec/workspace invalidation work.
- Mark newly recorded runtime-sourced PageIndex pages as `fresh`.
- Preserve deterministic fallback behavior for malformed or legacy pages as `unknown`.
- Keep projection conservative so `fresh` does not imply current workspace verification.

**Non-Goals:**
- Add zvec, embeddings, or semantic freshness scoring.
- Detect workspace file edits or invalidate PageIndex pages from file hashes in this slice.
- Change PageIndex ranking or result selection.

## Decisions

- Use string states `fresh`, `stale`, and `unknown`.
  - Rationale: these map directly to model-facing evidence and future invalidation rules.
  - Alternative considered: keep `known` and add separate `stale=true`. That makes projection wording harder to reason about and keeps the ambiguous `known` state.

- Treat runtime-sourced timestamps as `fresh` at record time.
  - Rationale: a just-completed prompt turn is fresh historical evidence for the session/workspace PageIndex.
  - Important limit: projection still says the model must verify against current workspace state before relying on recalled evidence.

- Keep `stale` as a supported normalized state even before automatic staleness detection exists.
  - Rationale: restored snapshots, future workspace metadata, or tests can carry stale evidence without another contract expansion.

## Risks / Trade-offs

- [Risk] `fresh` could be overread as current-file truth. → Mitigation: preserve the projection usage qualifier and keep future workspace invalidation as a separate change.
- [Risk] Existing snapshots may contain `known`. → Mitigation: normalize `known` to `fresh` only when the page is runtime-sourced; deterministic fallback remains `unknown`.
