# index-provider-boundary Specification

## Purpose

Defines the host-agnostic index provider boundary for deterministic PageIndex recall, deferred semantic providers such as ZVec, code-index provenance, freshness evidence, and provider configuration.

定义 host-agnostic index provider 边界，用于 deterministic PageIndex recall、ZVec 等 deferred semantic providers、code-index provenance、freshness evidence 与 provider configuration。
## Requirements
### Requirement: Index Providers Are Host Agnostic / Index Providers Host Agnostic

Index provider contracts SHALL define host-agnostic DTOs for index pages, recall requests, recall results, provider status, freshness evidence, and redaction metadata.

Index provider contracts 必须定义 host-agnostic DTOs，用于 index pages、recall requests、recall results、provider status、freshness evidence 与 redaction metadata。

#### Scenario: CLI and runtime share index DTOs / CLI 与 Runtime 共享 Index DTO
- **WHEN** CLI creates or recalls PageIndex evidence
- **THEN** the DTOs used for pages and recall results come from `@deepseek/platform-contracts` and do not import CLI, VSCode, Node filesystem, process, model SDK, or provider implementation APIs
- **中文** 当 CLI 创建或 recall PageIndex evidence 时，pages 与 recall results 使用的 DTO 必须来自 `@deepseek/platform-contracts`，且不得导入 CLI、VSCode、Node filesystem、process、model SDK 或 provider implementation APIs。

#### Scenario: Shared provider implementation avoids host rendering / Shared Provider 实现避免 Host Rendering
- **WHEN** deterministic PageIndex search runs through the shared provider implementation
- **THEN** it returns typed recall summaries and result records without producing terminal text, ANSI output, VSCode UI objects, or model messages
- **中文** 当 deterministic PageIndex search 通过 shared provider implementation 运行时，必须返回类型化 recall summaries 与 result records，不得产生 terminal text、ANSI output、VSCode UI objects 或 model messages。

### Requirement: PageIndex Is Deterministic Truth Source / PageIndex 是确定性 Truth Source

PageIndex SHALL remain the deterministic truth source for chat recall, and semantic providers SHALL point back to PageIndex provenance before their results can be projected or added as references.

PageIndex 必须保持 chat recall 的 deterministic truth source；semantic providers 的结果在可 projection 或加入 references 前，必须指回 PageIndex provenance。

#### Scenario: Semantic candidate references PageIndex / Semantic Candidate 引用 PageIndex
- **WHEN** a ZVec or code-index provider contributes a semantic recall candidate
- **THEN** the candidate includes PageIndex page id, session id, turn id, scope, freshness status, and bounded freshness evidence
- **中文** 当 ZVec 或 code-index provider 贡献 semantic recall candidate 时，该 candidate 必须包含 PageIndex page id、session id、turn id、scope、freshness status 与有界 freshness evidence。

#### Scenario: Deferred provider cannot hallucinate recall / Deferred Provider 不得虚构 Recall
- **WHEN** a semantic provider is configured but its status is `deferred`, `disabled`, or `unavailable`
- **THEN** recall falls back to deterministic PageIndex behavior and reports provider status without adding semantic confidence or unsupported candidates
- **中文** 当 semantic provider 已配置但状态为 `deferred`、`disabled` 或 `unavailable` 时，recall 必须回退到 deterministic PageIndex behavior，并报告 provider status，不得添加 semantic confidence 或 unsupported candidates。

### Requirement: Provider Configuration Is Explicit / Provider 配置显式

Index provider selection SHALL be represented by explicit configuration records rather than hard-coded CLI assumptions.

Index provider selection 必须由显式 configuration records 表示，而不是硬编码 CLI 假设。

#### Scenario: PageIndex-only mode is valid / PageIndex-only 模式有效
- **WHEN** no embedding or vector provider is configured
- **THEN** the platform reports PageIndex deterministic text recall as enabled and semantic providers as deferred or disabled
- **中文** 当未配置 embedding 或 vector provider 时，平台必须报告 PageIndex deterministic text recall 已启用，并将 semantic providers 报告为 deferred 或 disabled。

#### Scenario: Provider config is serializable / Provider Config 可序列化
- **WHEN** index provider configuration is stored in snapshots, diagnostics, or tests
- **THEN** it serializes as bounded JSON without functions, host handles, raw secrets, or SDK instances
- **中文** 当 index provider configuration 存入 snapshots、diagnostics 或 tests 时，必须序列化为有界 JSON，不包含 functions、host handles、raw secrets 或 SDK instances。

### Requirement: Provider Diagnostics Are Explicit / Provider 诊断显式

Index provider boundary SHALL expose a bounded diagnostics summary that lists configured PageIndex, ZVec, and code-index providers with status, scope, ranking modes, diagnostics, and redaction metadata.

Index provider boundary 必须暴露有界 diagnostics summary，列出已配置的 PageIndex、ZVec 与 code-index providers，并包含 status、scope、ranking modes、diagnostics 与 redaction metadata。

#### Scenario: PageIndex-only diagnostics are serializable / PageIndex-only 诊断可序列化
- **WHEN** no semantic or vector provider implementation is configured
- **THEN** the diagnostics summary reports PageIndex deterministic text recall as `enabled`, ZVec and code-index as `deferred`, and serializes without functions, SDK instances, host handles, or raw secrets
- **中文** 当没有配置 semantic 或 vector provider implementation 时，diagnostics summary 必须报告 PageIndex deterministic text recall 为 `enabled`，ZVec 与 code-index 为 `deferred`，并且序列化时不包含 functions、SDK instances、host handles 或 raw secrets。

#### Scenario: Deferred providers do not add unsupported capability / Deferred Provider 不增加未支持能力
- **WHEN** diagnostics reports a provider with status `deferred`, `disabled`, or `unavailable`
- **THEN** the summary includes a typed diagnostic and suggested action without claiming semantic confidence, vector ranking, embedding availability, or code semantic search support
- **中文** 当 diagnostics 报告某个 provider 的状态为 `deferred`、`disabled` 或 `unavailable` 时，summary 必须包含 typed diagnostic 与 suggested action，不得声称 semantic confidence、vector ranking、embedding availability 或 code semantic search support。

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

### Requirement: Provider Intent Is CLI-Manageable / Provider Intent 可由 CLI 管理

Index provider boundary SHALL allow CLI host adapters to persist known provider intent while preserving shared manifest normalization as the only authority for effective provider status.

Index provider boundary 必须允许 CLI host adapters 持久化已知 provider intent，同时保持 shared manifest normalization 作为 effective provider status 的唯一权威。

#### Scenario: CLI set stores requested intent only / CLI Set 只存储 Requested Intent
- **WHEN** a user requests `zvec` or `code-index` status through the CLI
- **THEN** the stored manifest records requested provider intent and implementation evidence metadata, while the effective status is recomputed by the shared resolver
- **中文** 当用户通过 CLI 请求 `zvec` 或 `code-index` status 时，存储的 manifest 只记录 requested provider intent 与 implementation evidence metadata，effective status 必须由 shared resolver 重新计算。

#### Scenario: Unknown providers are rejected before persistence / 未知 Provider 持久化前被拒绝
- **WHEN** a CLI user provides an unknown provider id or unsupported status
- **THEN** the CLI returns a typed local failure and does not write provider config
- **中文** 当 CLI 用户提供 unknown provider id 或 unsupported status 时，CLI 必须返回 typed local failure，且不得写入 provider config。
