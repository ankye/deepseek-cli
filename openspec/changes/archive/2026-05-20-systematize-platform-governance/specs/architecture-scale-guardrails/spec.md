## ADDED Requirements

### Requirement: Workspace Alias Integrity / Workspace Alias 完整性

Architecture guardrails SHALL validate that every `@deepseek/*` TypeScript path alias resolves to an existing workspace package, plugin package, or explicit retired/merged governance record.

架构护栏必须校验每个 `@deepseek/*` TypeScript path alias 都解析到现有 workspace package、plugin package，或显式 retired/merged 治理记录。

#### Scenario: Missing package alias is reported / 缺失包 Alias 被报告

- **WHEN** `tsconfig.base.json` declares a path alias whose target package directory does not exist
- **THEN** architecture lint reports the alias, target path, expected package name, and whether a retired/merged governance record exists
- **中文** 当 `tsconfig.base.json` 声明的 path alias 指向不存在的 package 目录时，架构 lint 必须报告该 alias、target path、预期 package name，以及是否存在 retired/merged 治理记录。

#### Scenario: Retired alias is time-bounded / 已退役 Alias 有时间边界

- **WHEN** a missing alias is intentionally retained during migration
- **THEN** the governance record includes the replacement package, allowed consumers, removal deadline, and release-risk severity
- **中文** 当缺失 alias 在迁移期间被有意保留时，治理记录必须包含替代 package、允许消费方、移除期限和发布风险严重度。

### Requirement: Placeholder Boundary Declarations / 占位边界声明

Architecture guardrails SHALL require placeholder implementations to be exported from their owner package with explicit governance metadata rather than implying standalone product packages exist.

架构护栏必须要求占位实现从其 owner package 导出并带有显式治理元数据，而不是暗示存在独立产品 package。

#### Scenario: Placeholder has owner and blocked claims / 占位有 Owner 与阻止声明

- **WHEN** a placeholder class implements a platform contract such as remote connectivity, distribution update, extension management, or evolution
- **THEN** architecture diagnostics identify the owner package, allowed deterministic use cases, blocked product claims, and replacement trigger
- **中文** 当占位 class 实现 remote connectivity、distribution update、extension management 或 evolution 等平台契约时，架构 diagnostics 必须识别 owner package、允许的确定性用途、被阻止的产品声明和替换触发条件。

### Requirement: Planning Code Drift Checks / 规划与代码漂移检查

Architecture guardrails SHALL detect drift between package maps, roadmap status labels, OpenSpec capability states, and source/package manifests for risk-bearing capabilities.

架构护栏必须检测 package map、roadmap 状态标签、OpenSpec capability state 与 source/package manifest 在有风险能力上的漂移。

#### Scenario: Roadmap overstates implementation / 路线图夸大实现状态

- **WHEN** roadmap or package-map text marks a risk-bearing capability as implemented while source evidence only shows placeholder, deferred, or partial behavior
- **THEN** diagnostics report a planning/code drift finding with the conflicting files and the expected governance state
- **中文** 当 roadmap 或 package-map 文案将有风险能力标记为 implemented，但源码证据仅显示 placeholder、deferred 或 partial 行为时，diagnostics 必须报告 planning/code drift，包含冲突文件和预期治理状态。

#### Scenario: Implemented behavior lacks public export evidence / 实现缺少公共导出证据

- **WHEN** a package claims implemented capability status
- **THEN** architecture guardrails verify that the package exposes the public API through package imports and does not rely on cross-package private source imports
- **中文** 当 package 声称能力已实现时，架构护栏必须验证该 package 通过 package import 暴露公共 API，且不依赖跨 package 私有源码 import。

### Requirement: Kernel Boundary Lint / 内核边界 Lint

Architecture guardrails SHALL reject subsystem-owned implementation imports into runtime kernel code when a public owner-package contract exists.

当存在 public owner-package contract 时，架构护栏必须拒绝子系统所有的实现导入进入 runtime kernel code。

#### Scenario: Runtime imports owner package through public API / Runtime 通过公共 API 导入责任包

- **WHEN** runtime needs prompt assembly, context projection, memory/cache, plugin, MCP, code intelligence, policy, or model gateway behavior
- **THEN** lint allows package public imports and rejects private `src/` imports, app imports, testing fake imports, provider SDK imports, or direct host APIs
- **中文** 当 runtime 需要 prompt assembly、context projection、memory/cache、plugin、MCP、code intelligence、policy 或 model gateway 行为时，lint 必须允许 package public imports，并拒绝 private `src/` imports、app imports、testing fake imports、provider SDK imports 或直接 host APIs。

### Requirement: Central File Size Guardrails / 中心文件规模护栏

Architecture guardrails SHALL define size and ownership thresholds for runtime, app entrypoint, package export, and lint framework central files.

架构护栏必须为 runtime、app entrypoint、package export 与 lint framework 中心文件定义规模和 ownership 阈值。

#### Scenario: File exceeds threshold / 文件超过阈值

- **WHEN** a central file exceeds the configured line-count, export-count, or ownership-domain threshold
- **THEN** lint or diagnostics reports the file, detected ownership domains, and suggested extraction packages
- **中文** 当中心文件超过配置的 line-count、export-count 或 ownership-domain 阈值时，lint 或 diagnostics 必须报告该文件、检测到的 ownership domains 和建议拆分 package。
