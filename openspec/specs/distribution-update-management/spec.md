# distribution-update-management Specification

## Purpose
Define distribution update management requirements for update metadata, channels, dry-run evidence, rollback, and future signed catalog promotion.

定义 distribution update management 对 update metadata、channels、dry-run evidence、rollback 与未来 signed catalog promotion 的要求。

## Requirements
### Requirement: Distribution and Update Boundary

The platform SHALL define distribution and update management for CLI releases, VSCode extension releases, plugin catalogs, bundled capability bundles, compatibility notices, migrations, and rollback metadata.

平台必须定义 distribution and update management，覆盖 CLI releases、VSCode extension releases、plugin catalogs、bundled capability bundles、compatibility notices、migrations 和 rollback metadata。

#### Scenario: Runtime receives compatibility notice

- **WHEN** a release, bundle, contract, or plugin catalog declares a compatibility notice
- **THEN** the evolution engine can evaluate migrations, deprecations, feature gates, and rollback options before enabling affected behavior

### Requirement: Update Checks Are Host Adapters

Update checks, notifications, and user prompts SHALL be implemented through host adapters and shared protocol events, while compatibility decisions remain in platform services.

update checks、notifications 和 user prompts 必须通过 host adapters 与共享 protocol events 实现，而 compatibility decisions 保留在 platform services 中。

#### Scenario: Headless update notice is structured

- **WHEN** a headless run detects an update or compatibility notice
- **THEN** it emits structured protocol events without requiring terminal UI interaction

### Requirement: Signed Bundle Governance

The distribution system SHALL support signed release and plugin bundle metadata, allowlists, blocklists, provenance, and audit records.

distribution system 必须支持 signed release 和 plugin bundle metadata、allowlists、blocklists、provenance 和 audit records。

#### Scenario: Blocked bundle is not enabled

- **WHEN** a release bundle, plugin bundle, or catalog entry is blocked by policy
- **THEN** the platform refuses enablement and records a structured audit event

### Requirement: Distribution Roadmap Sequencing / 分发与更新路线图排序

Distribution and update management SHALL align release channels, auto-update UI, plugin distribution, signed artifacts, rollback, and enterprise deployment with roadmap launch gates.

distribution and update management 必须让 release channels、auto-update UI、plugin distribution、signed artifacts、rollback 和 enterprise deployment 与 roadmap launch gates 对齐。

#### Scenario: Release channel requires roadmap gate / 发布通道需要路线图门禁

- **WHEN** a feature moves to alpha, beta, stable, or enterprise-managed release
- **THEN** distribution metadata references roadmap node readiness, rollback plan, compatibility status, and update policy
- **中文** 当功能进入 alpha、beta、stable 或 enterprise-managed release 时，distribution metadata 必须引用路线图节点就绪状态、回滚方案、兼容性状态和更新策略。

### Requirement: CLI Package Release Readiness / CLI 包发布就绪

Distribution and update management SHALL support deterministic CLI package release-readiness evidence before npm publishing.

distribution and update management 必须支持 npm publishing 前的 deterministic CLI package release-readiness evidence。

#### Scenario: Release readiness declares package surface / 发布就绪声明包表面

- **WHEN** CLI release readiness is evaluated
- **THEN** distribution evidence declares package name, version, channel or access class, bin entry, build artifact path, expected package files, excluded local/generated paths, and rollback or dry-run guidance
- **中文** 当 CLI release readiness 被评估时，distribution evidence 必须声明 package name、version、channel 或 access class、bin entry、build artifact path、expected package files、excluded local/generated paths，以及 rollback 或 dry-run guidance。

#### Scenario: Publish waits for evidence / 发布等待证据

- **WHEN** CLI publishing is considered for alpha, beta, stable, or enterprise channels
- **THEN** release metadata references OpenSpec validation, CLI build, smoke, boundary, redaction, and package surface evidence before publishing
- **中文** 当 CLI publishing 被考虑进入 alpha、beta、stable 或 enterprise channels 时，release metadata 必须在发布前引用 OpenSpec validation、CLI build、smoke、boundary、redaction 和 package surface evidence。
