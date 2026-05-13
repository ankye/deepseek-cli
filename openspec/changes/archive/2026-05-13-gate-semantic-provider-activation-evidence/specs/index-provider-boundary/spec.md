## MODIFIED Requirements

### Requirement: Provider Manifest Is Normalized / Provider Manifest 被归一化

Index provider boundary SHALL accept a bounded provider manifest that expresses provider intent and SHALL normalize it into effective diagnostics without trusting unsupported semantic capabilities, status-only implementation claims, or missing activation evidence.

Index provider boundary 必须接受有界 provider manifest 来表达 provider intent，并必须将其归一化为 effective diagnostics，不得信任未支持的 semantic capabilities、只有 status 的 implementation claims，或缺失的 activation evidence。

#### Scenario: Missing manifest keeps PageIndex-only mode / 缺失 Manifest 保持 PageIndex-only 模式
- **WHEN** no index provider manifest is supplied
- **THEN** the resolver emits the default PageIndex-only diagnostics with PageIndex `enabled`, ZVec and code-index `deferred`, and manifest source metadata set to default
- **中文** 当没有提供 index provider manifest 时，resolver 必须输出默认 PageIndex-only diagnostics：PageIndex 为 `enabled`，ZVec 与 code-index 为 `deferred`，并将 manifest source metadata 标记为 default。

#### Scenario: Unsupported semantic enablement is downgraded / 未支持 Semantic Enablement 被降级
- **WHEN** a manifest requests ZVec or code-index status `enabled` without implementation evidence
- **THEN** the resolver reports the provider effective status as `deferred`, records requested status in metadata, and emits a typed validation diagnostic
- **中文** 当 manifest 请求 ZVec 或 code-index 状态为 `enabled` 但没有 implementation evidence 时，resolver 必须将 provider effective status 报告为 `deferred`，在 metadata 中记录 requested status，并发出 typed validation diagnostic。

#### Scenario: Status-only semantic enablement is downgraded / 只有状态的 Semantic Enablement 被降级
- **WHEN** a manifest requests ZVec or code-index status `enabled` and declares implementation status `available` without all required activation evidence marked `present`
- **THEN** the resolver reports the provider effective status as `deferred`, records requested status and missing evidence kinds, and emits a typed activation-evidence diagnostic
- **中文** 当 manifest 请求 ZVec 或 code-index 为 `enabled` 且声明 implementation status 为 `available`，但没有所有 required activation evidence 标记为 `present` 时，resolver 必须将 provider effective status 报告为 `deferred`，记录 requested status 与 missing evidence kinds，并发出 typed activation-evidence diagnostic。

#### Scenario: Complete semantic activation evidence can enable provider / 完整 Semantic Activation Evidence 可启用 Provider
- **WHEN** a manifest requests a semantic provider as `enabled`, declares implementation status `available`, and supplies all provider-specific activation evidence as `present`
- **THEN** the resolver may report the provider effective status as `enabled` while preserving PageIndex as the deterministic fallback and provenance source
- **中文** 当 manifest 请求 semantic provider 为 `enabled`，声明 implementation status 为 `available`，并提供该 provider 所需的全部 activation evidence 且状态均为 `present` 时，resolver 可以将 provider effective status 报告为 `enabled`，同时保留 PageIndex 作为 deterministic fallback 与 provenance source。

#### Scenario: Manifest remains serializable and secret-free / Manifest 保持可序列化且无 Secret
- **WHEN** manifest input or resolved diagnostics are serialized for snapshots, diagnostics, or tests
- **THEN** they contain only JSON values, source metadata, provider ids, statuses, scopes, rankings, activation evidence summaries, diagnostics, and redaction metadata without raw credentials, SDK instances, functions, or host handles
- **中文** 当 manifest input 或 resolved diagnostics 被序列化到 snapshots、diagnostics 或 tests 时，它们只能包含 JSON values、source metadata、provider ids、statuses、scopes、rankings、activation evidence summaries、diagnostics 与 redaction metadata，不得包含 raw credentials、SDK instances、functions 或 host handles。
