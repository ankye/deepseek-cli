## ADDED Requirements

### Requirement: Release Diagnostics Verify Local Evidence Gates / Release 诊断验证本地证据门禁

CLI release diagnostics SHALL report structured local evidence for acceptance files, build artifacts, and npm package surface safety before declaring the CLI release gate ready.

CLI release diagnostics 必须报告 acceptance files、build artifacts 与 npm package surface safety 的结构化本地证据，然后才能声明 CLI release gate ready。

#### Scenario: Missing build artifact fails release readiness / 缺失构建产物导致发布就绪失败

- **WHEN** `diagnostics release` runs and the configured CLI build output path is missing
- **THEN** release readiness status is `fail`, the failed check cites the missing build output path, and suggested actions include running the CLI build command
- **中文** 当 `diagnostics release` 运行且配置的 CLI build output path 缺失时，release readiness status 必须为 `fail`，失败 check 必须引用缺失 build output path，并建议运行 CLI build command。

#### Scenario: Missing acceptance evidence warns release readiness / 缺失验收证据导致发布就绪警告

- **WHEN** `diagnostics release` runs and one or more declared acceptance evidence files are missing
- **THEN** release readiness status is at least `warn`, JSON/JSONL output lists missing evidence paths, and text output renders the same evidence gate summary
- **中文** 当 `diagnostics release` 运行且一个或多个声明的 acceptance evidence 文件缺失时，release readiness status 至少为 `warn`，JSON/JSONL output 必须列出 missing evidence paths，text output 必须渲染同一 evidence gate summary。

#### Scenario: Unsafe package surface fails release readiness / 不安全包内容导致发布就绪失败

- **WHEN** CLI package metadata would include files outside README, dist output, and package metadata
- **THEN** release readiness status is `fail` and diagnostics report the unexpected package paths without exposing local secrets or ignored reference material
- **中文** 当 CLI package metadata 会包含 README、dist output 与 package metadata 之外的文件时，release readiness status 必须为 `fail`，diagnostics 必须报告 unexpected package paths，且不暴露本地 secrets 或 ignored reference material。

### Requirement: Release Evidence Rendering Remains Parity Safe / Release 证据渲染保持一致安全

CLI diagnostics release text, JSON, and JSONL output SHALL derive from the same structured release evidence records.

CLI diagnostics release 的 text、JSON 与 JSONL 输出必须来自同一套 structured release evidence records。

#### Scenario: Text and JSONL share release gates / Text 与 JSONL 共享发布门禁

- **WHEN** `diagnostics release` renders local evidence gate checks
- **THEN** text output and JSONL output include the same build artifact status, acceptance evidence status, and package surface status without terminal control sequences
- **中文** 当 `diagnostics release` 渲染本地 evidence gate checks 时，text output 与 JSONL output 必须包含同一 build artifact status、acceptance evidence status 与 package surface status，且不得包含 terminal control sequences。
