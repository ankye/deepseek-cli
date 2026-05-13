## Context

PageIndex projection creates bounded `summary` nodes from selected recall references. These summaries contain source, score, previews, and quality metadata. They still need explicit guidance that they are historical recall evidence and may be stale or incomplete.

PageIndex projection 会从选中的 recall references 创建有界 `summary` nodes。这些 summary 已包含 source、score、previews 与 quality metadata，但仍需要明确说明这些内容是历史 recall evidence，可能过期或不完整。

## Goals / Non-Goals

**Goals:**
- Make the evidence boundary model-visible in every PageIndex projected summary.
- Keep the qualifier deterministic and replayable.
- Preserve prompt boundary; do not alter user prompt text.

**Non-Goals:**
- Add dynamic freshness policy or automatic filtering.
- Add prompt engineering for non-PageIndex references.
- Change recall ranking or storage.

## Decisions

- Use a fixed qualifier string.
  - Rationale: deterministic, testable, and easy to include in replay fingerprints.
  - Alternative considered: generate qualifier based on freshness. That belongs after explicit freshness policies are defined.

- Store qualifier in provenance and fingerprint.
  - Rationale: replay evidence must explain why selected context changed if the qualifier changes.

## Risks / Trade-offs

- Additional model context tokens -> Mitigation: one short line per PageIndex summary.
- Model may still over-trust old evidence -> Mitigation: this is a boundary marker; future slices can add staleness filtering and warning severity.
