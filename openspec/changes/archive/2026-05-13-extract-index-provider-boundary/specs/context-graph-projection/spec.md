## ADDED Requirements

### Requirement: Projection Requires PageIndex Provenance For Semantic Recall / Projection 要求 Semantic Recall 具备 PageIndex Provenance

ContextGraph projection SHALL only materialize semantic recall candidates when they preserve deterministic PageIndex provenance and bounded freshness evidence.

ContextGraph projection 只有在 semantic recall candidates 保留 deterministic PageIndex provenance 与有界 freshness evidence 时，才可以将其物化。

#### Scenario: Semantic recall without provenance remains evidence-only / 无 Provenance 的 Semantic Recall 仅作 Evidence
- **WHEN** a ZVec or code-index recall candidate lacks PageIndex page id, session id, turn id, or freshness evidence
- **THEN** projection records the candidate as unresolved or evidence-only without adding it to model-visible context
- **中文** 当 ZVec 或 code-index recall candidate 缺少 PageIndex page id、session id、turn id 或 freshness evidence 时，projection 必须将该 candidate 记录为 unresolved 或 evidence-only，不得加入模型可见 context。

#### Scenario: Semantic provider status is visible in provenance / Semantic Provider Status 在 Provenance 可见
- **WHEN** projection materializes a PageIndex-backed semantic recall candidate
- **THEN** node provenance and replay fingerprints include provider id, provider kind, semantic status, PageIndex page id, and freshness evidence
- **中文** 当 projection 物化由 PageIndex 支撑的 semantic recall candidate 时，node provenance 与 replay fingerprints 必须包含 provider id、provider kind、semantic status、PageIndex page id 与 freshness evidence。
