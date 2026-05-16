## ADDED Requirements

### Requirement: Publish Dry-Run Evidence Gates Release Readiness / Publish Dry-Run Evidence 门禁发布就绪

CLI diagnostics release readiness SHALL require current `npm publish --dry-run` evidence before reporting the CLI package as publish-dry-run ready.

CLI diagnostics release readiness 必须要求当前 `npm publish --dry-run` evidence 存在后，才能报告 CLI package publish-dry-run ready。

#### Scenario: Successful dry-run evidence passes release readiness / 成功 Dry-Run Evidence 通过发布就绪

- **WHEN** `diagnostics verify` reads publish dry-run evidence for the current `deepseek-agent-cli@version`
- **AND** the evidence contains npm tarball details without npm error output
- **THEN** release readiness includes `release.publish-dry-run` with status `pass`
- **AND** `publishDryRunReady` can be `true` only if all other release gates also pass
- **中文** 当 `diagnostics verify` 读取到当前 `deepseek-agent-cli@version` 的 publish dry-run evidence，且 evidence 包含 npm tarball details 且不包含 npm error output 时，release readiness 必须包含状态为 `pass` 的 `release.publish-dry-run`；只有其他 release gate 也通过时，`publishDryRunReady` 才能为 `true`。

#### Scenario: Published version collision blocks readiness / 已发布版本冲突阻断就绪

- **WHEN** publish dry-run evidence reports that the package version was previously published
- **THEN** release readiness status is `fail`
- **AND** `diagnostics verify` reports `status = blocked`
- **AND** `publishDryRunReady = false`
- **AND** the next action tells the user to bump the CLI package version and rerun dry-run evidence
- **中文** 当 publish dry-run evidence 报告 package version 已发布时，release readiness status 必须为 `fail`；`diagnostics verify` 必须报告 `status = blocked`，`publishDryRunReady = false`，并将下一步指向 bump CLI package version 与重新运行 dry-run evidence。

#### Scenario: Missing or stale dry-run evidence blocks readiness / 缺失或过期 Dry-Run Evidence 阻断就绪

- **WHEN** publish dry-run evidence is missing or does not match the current package version
- **THEN** release readiness includes `release.publish-dry-run` with status `fail`
- **AND** diagnostics lists the evidence path that must be refreshed
- **中文** 当 publish dry-run evidence 缺失或不匹配当前 package version 时，release readiness 必须包含状态为 `fail` 的 `release.publish-dry-run`，并列出需要刷新的 evidence path。

#### Scenario: Live release evidence gates publish readiness / Live 发布证据门禁 Publish Ready

- **WHEN** `diagnostics verify` evaluates release readiness before publishing
- **THEN** it requires DeepSeek live provider smoke, live agent-loop smoke, live agent-tool smoke, live CLI run smoke, live doctor smoke, live tool coverage, provider response cache, and current-schema overall delivery capability evidence
- **AND** `publishDryRunReady` remains `false` when any live evidence is missing, replay-only, skipped, stale, or does not include current delivery dimensions
- **中文** 当 `diagnostics verify` 在发布前评估 release readiness 时，必须要求 DeepSeek live provider smoke、live agent-loop smoke、live agent-tool smoke、live CLI run smoke、live doctor smoke、live tool coverage、provider response cache 与当前 schema 的 overall delivery capability evidence；任一 live evidence 缺失、仅 replay、被 skip、过期或不包含当前 delivery dimensions 时，`publishDryRunReady` 必须保持 `false`。
