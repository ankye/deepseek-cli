## ADDED Requirements

### Requirement: CLI Completion Has A Repeatable Evidence Refresh Path / CLI 完成具备可重复证据刷新路径

The CLI-first product route SHALL require a repeatable local evidence refresh path before declaring CLI release readiness complete.

CLI-first 产品路线必须要求具备可重复的本地 evidence refresh 路径，然后才能声明 CLI release readiness 完成。

#### Scenario: Release-ready claim references refresh and verify / Release-Ready 声明引用 Refresh 与 Verify

- **WHEN** CLI docs, roadmap, or proposals claim the CLI is release-ready
- **THEN** they reference both `deepseek diagnostics refresh` for regenerating acceptance evidence and `deepseek diagnostics verify` for checking whether that evidence is publish-dry-run ready
- **中文** 当 CLI docs、roadmap 或 proposals 声称 CLI release-ready 时，必须同时引用 `deepseek diagnostics refresh` 用于重新生成 acceptance evidence，以及 `deepseek diagnostics verify` 用于检查这些 evidence 是否 publish-dry-run ready。
