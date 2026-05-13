## ADDED Requirements

### Requirement: CLI Completion Has A Local Verify Entry Point / CLI 完成具备本地 Verify 入口

The CLI-first product route SHALL treat a passing `diagnostics verify` summary as the local pre-publish evidence entry point before marking CLI workflows release-ready or promoting them to other hosts.

CLI-first 产品路线必须将通过的 `diagnostics verify` summary 视为本地发布前证据入口，然后才能把 CLI workflows 标记为 release-ready 或推广到其他 hosts。

#### Scenario: CLI release-ready status references verify / CLI Release-Ready 状态引用 Verify

- **WHEN** roadmap, docs, or proposals claim a CLI workflow is release-ready or ready for host promotion
- **THEN** they reference `deepseek diagnostics verify` evidence or an equivalent recorded acceptance artifact that includes build artifact status, package surface status, acceptance evidence status, and publish dry-run guidance
- **中文** 当 roadmap、docs 或 proposals 声称某个 CLI workflow 已 release-ready 或可进行 host promotion 时，必须引用 `deepseek diagnostics verify` evidence，或等价的 recorded acceptance artifact，其中包含 build artifact status、package surface status、acceptance evidence status 与 publish dry-run guidance。
