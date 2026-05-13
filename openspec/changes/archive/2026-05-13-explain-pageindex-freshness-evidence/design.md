## Context

Freshness decisions are currently encoded inside PageIndex evidence quality metadata, but explain output and projected model context only surface the final freshness status. This hides why a page is stale or unknown, even though the decision was made from deterministic evidence such as session turn order or workspace checkpoint watermarks.

Freshness decisions 目前编码在 PageIndex evidence quality metadata 中，但 explain output 与 projected model context 只暴露最终 freshness status。这会隐藏 page 为什么 stale 或 unknown，即使该决策来自 session turn order 或 workspace checkpoint watermarks 等确定性 evidence。

## Goals / Non-Goals

**Goals:**
- Surface bounded freshness evidence in recall explain output.
- Carry freshness evidence through result target metadata so references preserve it.
- Include freshness evidence in PageIndex projection content and provenance.
- Keep redaction boundaries unchanged and avoid raw transcript/file content.

**Non-Goals:**
- Change PageIndex ranking, matching, or freshness policy.
- Add path-level invalidation or semantic freshness scoring.
- Add new persisted storage formats beyond already existing evidence quality fields.

## Decisions

- Reuse `evidenceQuality` as the source of truth and expose selected metadata fields.
  - Rationale: freshness policy already writes `staleReason`, `staleScope`, `staleMutationTurnId`, `workspaceCheckpointWatermark`, and `currentWorkspaceCheckpointWatermark` there.
  - Alternative considered: create a second derived `freshnessEvidence` object during recall. That risks divergence from stored evidence quality.

- Render a compact `freshnessEvidence` object in JSON explain and a single evidence line in text explain/projection.
  - Rationale: this keeps CLI output auditable without bloating normal result rows.

- Include freshness evidence in projection fingerprints.
  - Rationale: a stale reason or watermark change should change replay/context identity even if the preview text is unchanged.

## Risks / Trade-offs

- [Risk] Extra metadata can clutter projection text. -> Mitigation: include only one compact line and omit absent fields.
- [Risk] Field names become part of test expectations. -> Mitigation: use existing evidence quality field names rather than inventing aliases.
