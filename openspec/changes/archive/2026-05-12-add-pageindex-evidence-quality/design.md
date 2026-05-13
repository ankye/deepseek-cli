## Context

The CLI currently records bounded PageIndex pages with page/session/turn ids, status, trace id, previews, and redaction metadata. Recall ranking is deterministic text scoring, but the ranking reason is implicit in code and not available to users or runtime projection. Runtime can project PageIndex-shaped `turn` references, but projected summaries do not yet distinguish fresh evidence from legacy or unknown-timestamp evidence.

CLI 当前记录的 PageIndex page 包含 page/session/turn ids、status、trace id、previews 与 redaction metadata。Recall ranking 是确定性文本评分，但命中原因只隐含在代码里，用户与 runtime projection 都看不到。Runtime 已能投影 PageIndex 形态的 `turn` reference，但投影摘要还不能区分新鲜证据与 legacy/unknown-timestamp 证据。

## Goals / Non-Goals

**Goals:**
- Add bounded, replayable PageIndex evidence quality fields.
- Preserve backward compatibility for older snapshots/workspace records that lack `createdAt`.
- Surface evidence quality in local recall output metadata and runtime-owned model context.
- Keep prompt text unchanged and avoid reading full transcripts.

**Non-Goals:**
- Implement semantic freshness scoring.
- Introduce embedding providers, ZVec persistence, or vector recall.
- Filter out old evidence automatically; this slice only exposes quality metadata.
- Store or project raw full transcript content.

## Decisions

- Use deterministic timestamp fallback.
  - New pages receive `createdAt` from the terminal event when available, falling back to `1970-01-01T00:00:00.000Z`. Older pages normalize to the same fallback. This keeps tests replayable and avoids real-time drift.
  - Alternative considered: use `new Date()` at CLI recording time. That would make snapshots and tests non-deterministic.

- Keep freshness status coarse.
  - `freshnessStatus` is `known` when a parseable `createdAt` exists and `unknown` otherwise; this avoids pretending we know actual staleness windows before a real retention/freshness policy exists.
  - Alternative considered: hard-code stale thresholds. That would encode product policy too early.

- Make match reason explicit, not semantic.
  - Recall items include `matchedFields` and `rankingReason=deterministic-text-match`. This explains why a result was selected without claiming semantic confidence.
  - Alternative considered: add semantic confidence fields now. Those belong to later ZVec integration.

## Risks / Trade-offs

- Legacy records may all show the deterministic fallback timestamp -> Mitigation: freshness status remains explicit and bounded, and no filtering depends on it.
- Additional metadata slightly increases JSONL size -> Mitigation: fields are short, structured, and redacted alongside existing previews.
- Users may over-trust deterministic matches -> Mitigation: projection labels ranking as deterministic text match, not semantic memory.
