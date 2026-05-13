## ADDED Requirements

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
