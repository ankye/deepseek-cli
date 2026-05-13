## ADDED Requirements

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
