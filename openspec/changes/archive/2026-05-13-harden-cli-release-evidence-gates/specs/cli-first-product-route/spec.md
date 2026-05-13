## ADDED Requirements

### Requirement: CLI Completion Requires Executable Release Evidence / CLI 完成需要可执行发布证据

The CLI-first product route SHALL treat release evidence gates as part of CLI completion before promoting workflows to other host surfaces.

CLI-first 产品路线必须将 release evidence gates 视为 CLI 完成条件的一部分，然后才能把 workflow 推广到其他 host surfaces。

#### Scenario: CLI release gate blocks host promotion / CLI 发布门禁阻止 Host 推广

- **WHEN** a workflow is proposed for VSCode, server, SDK, browser/native, team, or enterprise surfaces
- **THEN** the proposal references passing CLI release diagnostics evidence, including build artifact evidence, acceptance evidence file status, package surface safety, and publish dry-run command guidance
- **中文** 当 workflow 被提议推广到 VSCode、server、SDK、browser/native、team 或 enterprise surfaces 时，proposal 必须引用通过的 CLI release diagnostics evidence，包括 build artifact evidence、acceptance evidence file status、package surface safety 与 publish dry-run command guidance。

#### Scenario: CLI done status includes release diagnostics / CLI 完成状态包含发布诊断

- **WHEN** the roadmap marks the CLI daily-use surface as complete or release-ready
- **THEN** `diagnostics release` evidence is present in acceptance artifacts and reports no failing release package, build artifact, or package-surface checks
- **中文** 当 roadmap 将 CLI daily-use surface 标记为 complete 或 release-ready 时，acceptance artifacts 中必须存在 `diagnostics release` evidence，且 release package、build artifact 或 package-surface checks 不得失败。
