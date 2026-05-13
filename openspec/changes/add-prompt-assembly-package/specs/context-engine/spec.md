## ADDED Requirements

### Requirement: Context Projection Feeds Prompt Assembly / Context Projection 输入 Prompt Assembly

The context engine SHALL expose projection results as typed, immutable evidence that prompt assembly can consume without re-running retrieval or bypassing projection policy.

Context engine 必须将 projection results 暴露为 typed、immutable evidence，使 prompt assembly 可以消费它们，且不重新运行 retrieval 或绕过 projection policy。

#### Scenario: Projection result becomes section evidence / Projection Result 成为 Section Evidence
- **WHEN** runtime receives a `ContextProjectionResult` for a turn
- **THEN** prompt assembly can convert selected nodes and projection metadata into context evidence sections with provenance, dependency fingerprints, redaction metadata, freshness metadata, and budget estimates
- **中文** 当 runtime 为某个 turn 收到 `ContextProjectionResult` 时，prompt assembly 必须能将 selected nodes 与 projection metadata 转换为 context evidence sections，包含 provenance、dependency fingerprints、redaction metadata、freshness metadata 与 budget estimates。

#### Scenario: Prompt assembly does not retrieve context / Prompt Assembly 不检索上下文
- **WHEN** prompt assembly needs context evidence
- **THEN** it consumes the projection input supplied by runtime and does not scan the workspace, query PageIndex, call ZVec, read files, or consult host UI state directly
- **中文** 当 prompt assembly 需要 context evidence 时，必须消费 runtime 提供的 projection input，不得直接扫描 workspace、查询 PageIndex、调用 ZVec、读取文件或访问 host UI state。

### Requirement: Exact And Semantic Recall Are Distinguished / 区分精确与语义召回

Context evidence consumed by prompt assembly SHALL distinguish exact recall sources such as PageIndex/session records from semantic recall sources such as future ZVec results.

Prompt assembly 消费的 context evidence 必须区分 PageIndex/session records 等 exact recall sources 与 future ZVec results 等 semantic recall sources。

#### Scenario: PageIndex evidence is exact recall / PageIndex 证据是精确召回
- **WHEN** PageIndex-derived evidence is included in a projection result
- **THEN** prompt assembly labels it as exact historical recall with scope, freshness, source id, ranking reason, and a stale-use warning when applicable
- **中文** 当 projection result 包含 PageIndex-derived evidence 时，prompt assembly 必须将其标记为 exact historical recall，并包含 scope、freshness、source id、ranking reason，以及适用时的 stale-use warning。

#### Scenario: ZVec evidence is semantic recall / ZVec 证据是语义召回
- **WHEN** future ZVec-derived evidence is included in a projection result
- **THEN** prompt assembly labels it as semantic recall, records similarity/ranking metadata when supplied, and treats it as lower authority than exact user/session/project evidence under the default budget strategy
- **中文** 当未来 projection result 包含 ZVec-derived evidence 时，prompt assembly 必须将其标记为 semantic recall，在提供时记录 similarity/ranking metadata，并在默认预算策略下将其权威性低于 exact user/session/project evidence。

### Requirement: Projection Exclusions Remain Visible To Assembly / Projection 排除对 Assembly 可见

The context engine SHALL preserve structured exclusion and degradation metadata so prompt assembly evidence can explain missing or dropped context.

Context engine 必须保留结构化 exclusion 与 degradation metadata，使 prompt assembly evidence 能解释 missing 或 dropped context。

#### Scenario: Excluded projection candidate is surfaced structurally / 被排除候选以结构形式暴露
- **WHEN** context projection excludes a candidate due to budget, redaction, policy, scope, staleness, or unavailable provider
- **THEN** prompt assembly can include bounded exclusion metadata in its trace without exposing excluded raw content
- **中文** 当 context projection 因 budget、redaction、policy、scope、staleness 或 provider unavailable 排除 candidate 时，prompt assembly 必须能在 trace 中包含有界 exclusion metadata，且不暴露 excluded raw content。
