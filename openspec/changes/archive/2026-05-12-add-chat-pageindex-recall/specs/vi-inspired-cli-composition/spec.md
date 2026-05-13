## ADDED Requirements

### Requirement: PageIndex Recall Results Are Navigable Targets / PageIndex 回溯结果是可导航 Target

The vi-inspired CLI composition model SHALL represent PageIndex recall matches as quickfix-style result-list items with typed `turn` targets that can be navigated, focused, and used as local evidence targets.

Vi-inspired CLI composition model 必须将 PageIndex recall matches 表示为 quickfix-style result-list items，并带 typed `turn` targets，可被导航、聚焦，并作为本地 evidence targets 使用。

#### Scenario: Recall result item preserves turn target / 回溯结果项保留 Turn Target

- **WHEN** a PageIndex recall result list is created
- **THEN** each result item stores a stable item id, display label, ordering, and a target with `kind=turn`, `sessionId`, `turnId`, and metadata for page id, status, trace id, sequence, previews, and deterministic score
- **中文** 当 PageIndex recall result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering，以及包含 `kind=turn`、`sessionId`、`turnId`、page id、status、trace id、sequence、previews 与 deterministic score metadata 的 target。

#### Scenario: Recall navigation uses jump history / 回溯导航使用 Jump History

- **WHEN** the user navigates between recall result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 recall result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。

#### Scenario: Recall target remains evidence-only for projection / 回溯 Target 对 Projection 保持 Evidence-Only

- **WHEN** a recall result target is later used as a reference before turn/page projection is implemented
- **THEN** the target remains structured local evidence and MUST NOT be materialized into model-visible content by the CLI host
- **中文** 当 recall result target 在 turn/page projection 实现前被用作 reference 时，该 target 必须保持结构化本地 evidence，CLI host 不得将其物化为 model-visible content。
