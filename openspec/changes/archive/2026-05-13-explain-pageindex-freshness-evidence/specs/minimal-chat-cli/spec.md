## ADDED Requirements

### Requirement: PageIndex Explains Freshness Evidence / PageIndex 解释 Freshness Evidence

The chat PageIndex SHALL expose bounded freshness evidence alongside freshness status in recall metadata and `/palette recall explain` output.

Chat PageIndex 必须在 recall metadata 与 `/palette recall explain` output 中随 freshness status 一起暴露有界 freshness evidence。

#### Scenario: Explain stale reason / 解释 Stale 原因

- **WHEN** a PageIndex recall result is marked `stale` because of session turn order or workspace checkpoint watermark evidence
- **THEN** `/palette recall explain` includes the freshness reason, freshness evidence scope, and available mutation or watermark evidence without exposing raw transcript or file content
- **中文** 当 PageIndex recall result 因 session turn order 或 workspace checkpoint watermark evidence 被标记为 `stale` 时，`/palette recall explain` 必须包含 freshness reason、freshness evidence scope 以及可用的 mutation 或 watermark evidence，且不得暴露原始 transcript 或 file content。

#### Scenario: Explain unknown reason / 解释 Unknown 原因

- **WHEN** a PageIndex recall result is marked `unknown` because required freshness evidence is missing
- **THEN** `/palette recall explain` includes the missing-evidence reason instead of silently presenting only `freshnessStatus=unknown`
- **中文** 当 PageIndex recall result 因缺少必要 freshness evidence 被标记为 `unknown` 时，`/palette recall explain` 必须包含 missing-evidence reason，而不是只静默显示 `freshnessStatus=unknown`。

#### Scenario: Recall metadata preserves freshness evidence / Recall Metadata 保留 Freshness Evidence

- **WHEN** a PageIndex recall result is added to references
- **THEN** the reference target metadata preserves freshness evidence so later projection can explain why the evidence is fresh, stale, or unknown
- **中文** 当 PageIndex recall result 被加入 references 时，reference target metadata 必须保留 freshness evidence，使后续 projection 能解释该 evidence 为什么是 fresh、stale 或 unknown。
