# complete-tool-family-implementation Specification

## Purpose
Define requirements for implementing tool-family capabilities as executable, governed, tested tools rather than catalog-only placeholders.

定义 tool-family capabilities 的实现要求，确保它们是可执行、受治理且有测试的工具，而不是仅目录占位。

## Requirements
### Requirement: All First-Version Families Have Concrete Capabilities / 全部第一版 Family 拥有真实 Capability
The system SHALL implement every first-version catalog family as at least one concrete executable capability with a stable capability id, manifest, executor, model-visible projection, tool family metadata, governed runtime path, bounded output, and tests.

系统必须把每个第一版 catalog family 实现为至少一个真实可执行 capability，并具备稳定 capability id、manifest、executor、model-visible projection、tool family metadata、受治理 runtime path、有界输出与测试。

#### Scenario: No planned family remains in the shipped baseline / 发布基线中不再保留 Planned Family
- **WHEN** diagnostics evaluates the first-version 64-family catalog after this change
- **THEN** every family reports `implementationState: implemented` and has at least one executable model-visible tool entry
- **中文** 当 diagnostics 在本变更后评估第一版 64-family catalog 时，每个 family 必须报告 `implementationState: implemented`，并且至少有一个可执行、model-visible 的 tool entry。

### Requirement: No Placeholder Or Catalog-Only Tools / 禁止占位或仅目录工具
The system SHALL NOT count catalog-only entries, fake labels without executors, docs-only commands, planned records, or disabled connectors as implemented tool entries.

系统不得把 catalog-only 条目、没有 executor 的 fake label、docs-only command、planned record 或 disabled connector 计为已实现 tool entry。

#### Scenario: Planned patch does not pass / Planned Patch 不通过
- **WHEN** `patch.apply` lacks a working executor or cannot apply a multi-hunk patch in a deterministic test
- **THEN** the family remains non-passing and contributes zero score
- **中文** 当 `patch.apply` 缺少可工作的 executor，或无法在确定性测试中应用 multi-hunk patch 时，该 family 必须保持不通过并贡献零分。

### Requirement: Fake-First Is Executable Evidence / Fake-First 是可执行证据
Families that depend on external providers SHALL provide deterministic fake-first adapters that execute through the same manifest, policy, preflight, runtime, evidence, and scorecard path as real adapters.

依赖外部 provider 的 families 必须提供 deterministic fake-first adapters，并且与真实 adapters 走同一套 manifest、policy、preflight、runtime、evidence 与 scorecard 路径。

#### Scenario: Image generation has local deterministic evidence / 图片生成拥有本地确定性证据
- **WHEN** default tests exercise `image.generate`
- **THEN** the fake image provider returns a bounded artifact reference and score evidence without requiring live credentials
- **中文** 当默认测试执行 `image.generate` 时，fake image provider 必须返回有界 artifact reference 与评分证据，且不要求 live credentials。

### Requirement: Family Score Separates Evidence Layers / Family 分层评分
Every implemented family SHALL report implementation, static contract, replayed or live execution, task outcome, and safety evidence as separate scorecard layers.

每个已实现 family 必须把 implementation、static contract、replayed 或 live execution、task outcome 与 safety evidence 作为独立 scorecard layers 报告。

#### Scenario: Executor without task evidence is not fully complete / 只有 Executor 不算完全完成
- **WHEN** a family has a registered executor but lacks representative task evidence
- **THEN** implementation and static layers may pass, but task outcome remains zero
- **中文** 当某个 family 已注册 executor 但缺少代表性任务证据时，implementation 与 static layers 可以通过，但 task outcome 必须保持零分。

### Requirement: Family Ownership Is Enforced / Family 归属必须受约束
Each family implementation SHALL live in or project from its owner package and SHALL NOT violate package boundaries or import app-specific hosts into platform contracts.

每个 family implementation 必须位于或投影自所属 owner package，不得违反 package boundaries，也不得把 app-specific host 导入 platform contracts。

#### Scenario: Design tools do not live in core coding tools / Design 工具不放进 Core Coding Tools
- **WHEN** `design.batch-edit` is implemented
- **THEN** it is exposed through a design connector or MCP profile and projected with catalog metadata instead of being owned by `core-coding-tools`
- **中文** 当 `design.batch-edit` 被实现时，它必须通过 design connector 或 MCP profile 暴露并携带 catalog metadata，而不是由 `core-coding-tools` 拥有。

