## ADDED Requirements

### Requirement: PageIndex Projection Includes Freshness Evidence / PageIndex Projection 包含 Freshness Evidence

ContextGraph projection SHALL include bounded PageIndex freshness evidence in model-visible recall summaries and node provenance.

ContextGraph projection 必须在模型可见的 PageIndex recall summaries 与 node provenance 中包含有界 PageIndex freshness evidence。

#### Scenario: Projected summary explains stale evidence / 投影摘要解释 Stale Evidence

- **WHEN** a PageIndex recall reference carries stale reason or workspace watermark metadata
- **THEN** the projected model-visible summary includes a compact freshness evidence line and node provenance preserves the same bounded fields
- **中文** 当 PageIndex recall reference 携带 stale reason 或 workspace watermark metadata 时，投影后的模型可见 summary 必须包含 compact freshness evidence line，并且 node provenance 必须保留相同的有界字段。

#### Scenario: Projection fingerprint includes freshness evidence / Projection Fingerprint 包含 Freshness Evidence

- **WHEN** freshness reason or watermark metadata changes for the same PageIndex reference
- **THEN** the projected node dependency fingerprint changes even if prompt and assistant previews are unchanged
- **中文** 当同一个 PageIndex reference 的 freshness reason 或 watermark metadata 改变时，即使 prompt 与 assistant previews 未变化，投影 node dependency fingerprint 也必须改变。
