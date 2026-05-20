## ADDED Requirements

### Requirement: Ghost Alias Detection / Ghost Alias 检测

Architecture guardrails SHALL detect `@deepseek/*` path aliases that do not resolve to existing workspace packages, plugin packages, or explicit retired/merged governance records.

架构护栏必须检测无法解析到现有 workspace packages、plugin packages 或显式 retired/merged governance records 的 `@deepseek/*` path aliases。

#### Scenario: Missing package alias is reported / 缺失 Package Alias 被报告

- **WHEN** `tsconfig.base.json` declares an alias whose target package directory does not exist
- **THEN** lint reports the alias, target path, expected owner, severity, and whether a retired/merged record exists
- **中文** 当 `tsconfig.base.json` 声明的 alias 目标 package 目录不存在时，lint 必须报告 alias、target path、expected owner、severity 与是否存在 retired/merged record。

### Requirement: Placeholder Ownership Guardrail / Placeholder Ownership 护栏

Architecture guardrails SHALL report placeholder implementations that lack owner, allowed consumers, blocked product claims, and replacement triggers.

架构护栏必须报告缺少 owner、allowed consumers、blocked product claims 与 replacement triggers 的 placeholder implementations。

#### Scenario: Placeholder lacks promotion gate / Placeholder 缺少推广门禁

- **WHEN** a placeholder implementation is exported or used in runtime assembly
- **THEN** diagnostics require owner metadata, allowed consumer list, blocked claim list, replacement trigger, and acceptance evidence gate
- **中文** 当 placeholder implementation 被导出或用于 runtime assembly 时，diagnostics 必须要求 owner metadata、allowed consumer list、blocked claim list、replacement trigger 与 acceptance evidence gate。

### Requirement: Roadmap And Package Drift Detection / Roadmap 与 Package 漂移检测

Architecture guardrails SHALL compare roadmap labels, package-map ownership, workspace manifests, and source evidence for risk-bearing capabilities.

架构护栏必须对比有风险能力的 roadmap labels、package-map ownership、workspace manifests 与 source evidence。

#### Scenario: Roadmap overstates implementation / Roadmap 夸大实现状态

- **WHEN** roadmap marks a capability as implemented but source evidence shows placeholder, deferred, missing package, or missing evidence status
- **THEN** readiness reports a drift finding and blocks product-ready claims depending on the overstated status
- **中文** 当 roadmap 将能力标记为 implemented，但源码证据显示 placeholder、deferred、missing package 或 missing evidence 状态时，readiness 必须报告 drift finding，并阻止依赖该夸大状态的产品就绪声明。
