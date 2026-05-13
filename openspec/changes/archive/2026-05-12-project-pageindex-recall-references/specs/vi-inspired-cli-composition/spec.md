## ADDED Requirements

### Requirement: PageIndex Recall References Preserve Target Metadata / PageIndex 回溯引用保留 Target Metadata

The vi-inspired CLI composition model SHALL preserve PageIndex recall metadata when a recall result-list item becomes a reference item.

Vi-inspired CLI composition model 必须在 recall result-list item 成为 reference item 时保留 PageIndex recall metadata。

#### Scenario: Recall reference keeps page metadata / Recall 引用保留 Page Metadata

- **WHEN** a recall result-list item is added to the active reference set
- **THEN** the reference item target remains `kind=turn` and preserves page id, turn id, session id, status, trace id, prompt preview, assistant preview, score, ranking, semantic placeholder metadata, and redaction metadata
- **中文** 当 recall result-list item 被加入 active reference set 时，reference item target 必须保持 `kind=turn`，并保留 page id、turn id、session id、status、trace id、prompt preview、assistant preview、score、ranking、semantic placeholder metadata 与 redaction metadata。
