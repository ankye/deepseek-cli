## Why

CLI-first work now has run/chat, local readiness, privacy/observability, and approval UX, but the daily-use product still lacks a single diagnostics and release-readiness loop that users and maintainers can run before trusting or publishing the CLI.

CLI-first 现在已经具备 run/chat、本地可用性、privacy/observability 和 approval UX，但日常产品还缺少一个用户与维护者都能运行的 diagnostics 与 release-readiness 闭环，用来在信任或发布 CLI 前确认状态。

## What Changes

- Add a CLI diagnostics and support-bundle surface that renders text/JSON/JSONL evidence from redacted readiness, observability, platform, package, and reference-pit data. / 增加 CLI diagnostics 与 support-bundle 产品面，从脱敏 readiness、observability、platform、package 和 reference-pit 数据渲染 text/JSON/JSONL evidence。
- Extend doctor and verify-install readiness to report release-readiness checks, package/tarball surface expectations, acceptance evidence pointers, and ignored forbidden paths. / 扩展 doctor 与 verify-install readiness，报告 release-readiness checks、package/tarball surface expectations、acceptance evidence pointers 和被忽略的禁入路径。
- Add support-bundle redaction and privacy-decision parity for local bundle and denied external export flows. / 增加 support-bundle redaction 与 privacy-decision 一致性，覆盖 local bundle 和 denied external export flows。
- Add deterministic tests for CLI diagnostics output, package surface evidence, redaction, reference pit fixture coverage, and release readiness smoke. / 增加 deterministic tests，覆盖 CLI diagnostics output、package surface evidence、redaction、reference pit fixture coverage 和 release readiness smoke。
- Update product docs so CLI completion proceeds from permission approval UX into diagnostics/release readiness before extension management. / 更新产品文档，使 CLI completion 从 permission approval UX 进入 diagnostics/release readiness，再推进 extension management。

## Capabilities

### New Capabilities

- `cli-diagnostics-release-readiness`: CLI-facing diagnostics bundle, doctor/release readiness summaries, support-bundle privacy decisions, package surface verification, and acceptance evidence references. / 面向 CLI 的 diagnostics bundle、doctor/release readiness summaries、support-bundle privacy decisions、package surface verification 和 acceptance evidence references。

### Modified Capabilities

- `local-readiness`: doctor and verify-install gain release-readiness evidence and support-bundle awareness. / doctor 与 verify-install 增加 release-readiness evidence 和 support-bundle awareness。
- `observability-privacy`: diagnostic bundles must be consumable by CLI diagnostics without leaking raw support material and must cite redaction pit evidence. / diagnostic bundles 必须可被 CLI diagnostics 消费，且不得泄漏 raw support material，并引用 redaction pit evidence。
- `distribution-update-management`: release metadata and package surface checks must support CLI release-readiness gates before publishing. / release metadata 与 package surface checks 必须支持发布前的 CLI release-readiness gates。
- `testing-regression`: deterministic regression coverage must include CLI diagnostics/release-readiness smoke, package surface evidence, and support-bundle redaction fixtures. / deterministic regression coverage 必须包含 CLI diagnostics/release-readiness smoke、package surface evidence 和 support-bundle redaction fixtures。

## Impact

- Affects `src/apps/cli` command parsing, diagnostics adapter, readiness rendering, help text, and CLI tests. / 影响 `src/apps/cli` 的 command parsing、diagnostics adapter、readiness rendering、help text 和 CLI tests。
- Affects `@deepseek/platform-contracts` readiness/diagnostics DTOs only as implementation-free contracts when needed. / 必要时只以无实现契约方式影响 `@deepseek/platform-contracts` 的 readiness/diagnostics DTOs。
- Affects `@deepseek/command-system` local readiness checks and `@deepseek/observability` diagnostic bundle behavior. / 影响 `@deepseek/command-system` local readiness checks 和 `@deepseek/observability` diagnostic bundle behavior。
- Adds tests under CLI, contracts/e2e/golden or matrix locations following existing ownership. / 按现有归属在 CLI、contracts/e2e/golden 或 matrix 位置增加测试。
- Does not implement extension management, update UI, signed release channels, remote upload, or marketplace behavior in this pack. / 本包不实现 extension management、update UI、signed release channels、remote upload 或 marketplace behavior。
