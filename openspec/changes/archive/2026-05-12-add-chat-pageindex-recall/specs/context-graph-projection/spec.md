## ADDED Requirements

### Requirement: PageIndex Recall Projection Boundary / PageIndex 回溯投影边界

ContextGraph projection SHALL treat PageIndex as deterministic recall evidence and SHALL NOT materialize PageIndex pages into model-visible context until an explicit projection capability is added.

ContextGraph projection 必须将 PageIndex 视为 deterministic recall evidence，并且在明确增加 projection capability 前，不得将 PageIndex pages 物化为 model-visible context。

#### Scenario: PageIndex is recall truth source / PageIndex 是回溯 Truth Source

- **WHEN** semantic recall or ZVec ranking is introduced later
- **THEN** every semantic candidate must point back to a deterministic PageIndex page id, session id, and turn id
- **中文** 当未来引入 semantic recall 或 ZVec ranking 时，每个 semantic candidate 都必须指回确定性的 PageIndex page id、session id 与 turn id。

#### Scenario: Turn page references remain unsupported in this slice / 本片不支持 Turn Page 引用投影

- **WHEN** a prompt turn contains a PageIndex recall target or `turn` reference before turn/page projection is implemented
- **THEN** projection evidence records it as unsupported or evidence-only without reading transcript content or failing the turn
- **中文** 当 prompt turn 在 turn/page projection 实现前包含 PageIndex recall target 或 `turn` reference 时，projection evidence 必须将其记录为 unsupported 或 evidence-only，不读取 transcript content，也不让 turn 失败。
