## ADDED Requirements

### Requirement: Evidence Candidate Projection / 证据候选投影

The context engine SHALL project evidence candidates with provenance, fact classes, freshness, dependency fingerprints, redaction metadata, and replay metadata.

context engine 必须投影带 provenance、fact classes、freshness、dependency fingerprints、redaction metadata 与 replay metadata 的 evidence candidates。

#### Scenario: Repository evidence candidate is selected / 仓库证据候选被选中
- **WHEN** a fact-sensitive task needs project evidence from README, package metadata, command index, OpenSpec, docs, tests, source files, or task catalog
- **THEN** context projection may select bounded evidence nodes that include source identity, preview, fingerprint, fact class, freshness evidence, and redaction metadata
- **中文** 当 fact-sensitive task 需要来自 README、package metadata、command index、OpenSpec、docs、tests、source files 或 task catalog 的项目证据时，context projection 可以选择包含 source identity、preview、fingerprint、fact class、freshness evidence 与 redaction metadata 的有界 evidence nodes。

#### Scenario: Evidence candidate exclusion is explainable / 证据候选排除可解释
- **WHEN** an evidence candidate is stale, secret-like, out of scope, duplicate, unavailable, or over budget
- **THEN** context projection excludes it with a structured reason and without exposing raw unsafe content
- **中文** 当 evidence candidate 过期、疑似 secret、超出 scope、重复、不可用或超预算时，context projection 必须用 structured reason 排除它，且不暴露 unsafe 原文。

### Requirement: Evidence Source Coverage / 证据来源覆盖

The context engine SHALL support source coverage summaries for evidence plans and generated evidence manifests.

context engine 必须支持用于 evidence plans 与 generated evidence manifests 的 source coverage summaries。

#### Scenario: Source coverage summarizes fact classes / 来源覆盖汇总事实类别
- **WHEN** evidence projection completes for a fact-sensitive task
- **THEN** the projection result includes counts and fingerprints by source group and fact class, plus missing required fact classes when any
- **中文** 当 fact-sensitive task 的 evidence projection 完成时，projection result 必须包含按 source group 与 fact class 汇总的 counts 和 fingerprints，以及任何缺失的 required fact classes。

#### Scenario: Coverage gap is visible before output / 输出前可见覆盖缺口
- **WHEN** required evidence source coverage is incomplete
- **THEN** runtime can detect the gap before final output and either request more evidence, mark assumptions, or block unsupported factual claims
- **中文** 当 required evidence source coverage 不完整时，runtime 必须能在最终输出前检测缺口，并请求更多 evidence、标注 assumptions 或阻止 unsupported factual claims。
