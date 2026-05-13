## MODIFIED Requirements

### Requirement: CLI Release Readiness Evidence / CLI 发布就绪证据

The CLI SHALL provide release-readiness evidence before publishing or host promotion, including both individual latest verification artifacts and the generated acceptance evidence index.

CLI 必须在发布或 host promotion 前提供 release-readiness evidence，且必须同时包含单独的 latest verification artifacts 与生成的 acceptance evidence index。

#### Scenario: Package surface is checked / Package Surface 被检查

- **WHEN** release readiness runs for the CLI npm package
- **THEN** evidence includes package name, version, bin entry, build output path, expected tarball files, publish access, and a status for generated bundles being excluded from source commits
- **中文** 当 release readiness 针对 CLI npm package 运行时，evidence 必须包含 package name、version、bin entry、build output path、expected tarball files、publish access，以及 generated bundles 不进入源码提交面的状态。

#### Scenario: Acceptance evidence is linked / 验收证据被链接

- **WHEN** release readiness is rendered
- **THEN** output links or lists the generated acceptance index, OpenSpec validation, typecheck, lint, unit/contract/integration/golden/matrix/e2e tests, CLI build, headless smoke, boundary checks, and reference hygiene evidence
- **中文** 当 release readiness 被渲染时，输出必须链接或列出 generated acceptance index、OpenSpec validation、typecheck、lint、unit/contract/integration/golden/matrix/e2e tests、CLI build、headless smoke、boundary checks 和 reference hygiene evidence。
