## ADDED Requirements

### Requirement: PageIndex Uses Bounded Freshness States / PageIndex 使用有界新鲜度状态

The chat PageIndex SHALL expose bounded freshness states for recall evidence: `fresh`, `stale`, and `unknown`.

Chat PageIndex 必须为 recall evidence 暴露有界 freshness states：`fresh`、`stale` 与 `unknown`。

#### Scenario: Runtime timestamped page is fresh / Runtime 时间 Page 为 Fresh

- **WHEN** a completed prompt turn records a PageIndex page from a parseable runtime event `createdAt`
- **THEN** the page, recall metadata, explain output, and projected recall evidence mark freshness as `fresh`
- **中文** 当 completed prompt turn 基于可解析的 runtime event `createdAt` 记录 PageIndex page 时，该 page、recall metadata、explain output 与 projected recall evidence 必须将 freshness 标记为 `fresh`。

#### Scenario: Legacy fallback remains unknown / Legacy 回退保持 Unknown

- **WHEN** a legacy or malformed PageIndex page lacks a runtime-sourced timestamp
- **THEN** the page and recall metadata mark freshness as `unknown`
- **中文** 当 legacy 或 malformed PageIndex page 缺少 runtime-sourced timestamp 时，该 page 与 recall metadata 必须将 freshness 标记为 `unknown`。

#### Scenario: Stale status is preserved / Stale 状态被保留

- **WHEN** a restored or externally supplied PageIndex page carries `freshnessStatus=stale`
- **THEN** recall metadata and projection preserve `stale` instead of normalizing it away
- **中文** 当 restored 或 externally supplied PageIndex page 携带 `freshnessStatus=stale` 时，recall metadata 与 projection 必须保留 `stale`，不得将其归一化掉。
