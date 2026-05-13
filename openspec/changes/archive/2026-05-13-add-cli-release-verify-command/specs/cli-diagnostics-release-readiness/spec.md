## ADDED Requirements

### Requirement: CLI Diagnostics Verify Summarizes Release Gates / CLI Diagnostics Verify 汇总发布门禁

CLI diagnostics SHALL expose a read-only `diagnostics verify` command that derives a decision-ready release verification summary from the same structured evidence used by `diagnostics release`.

CLI diagnostics 必须暴露只读 `diagnostics verify` 命令，并从 `diagnostics release` 使用的同一套结构化证据中派生可决策的发布验证 summary。

#### Scenario: Verify reports blocking release checks / Verify 报告阻塞发布检查

- **WHEN** `deepseek diagnostics verify` runs and any release readiness check has status `fail`
- **THEN** the command reports verification status `blocked`, lists the blocking check ids and messages, includes the next suggested action, and does not run publish, network, model, provider, or full test commands
- **中文** 当 `deepseek diagnostics verify` 运行且任意 release readiness check 状态为 `fail` 时，命令必须报告 verification status 为 `blocked`，列出 blocking check ids 与 messages，包含下一条 suggested action，并且不得运行 publish、network、model、provider 或完整测试命令。

#### Scenario: Verify reports warning release checks / Verify 报告警告发布检查

- **WHEN** `deepseek diagnostics verify` runs and release readiness has warnings but no failures
- **THEN** the command reports verification status `warn`, lists warning check ids, missing acceptance evidence paths when present, and the command plan needed before publishing
- **中文** 当 `deepseek diagnostics verify` 运行且 release readiness 有 warning 但没有 failure 时，命令必须报告 verification status 为 `warn`，列出 warning check ids、存在时的 missing acceptance evidence paths，以及发布前所需 command plan。

#### Scenario: Verify reports publish-dry-run readiness / Verify 报告 Publish Dry-Run 就绪

- **WHEN** `deepseek diagnostics verify` runs and release readiness status is `pass`
- **THEN** the command reports verification status `ready`, includes the publish dry-run command as the next action, and preserves the underlying release evidence in JSON and JSONL output
- **中文** 当 `deepseek diagnostics verify` 运行且 release readiness status 为 `pass` 时，命令必须报告 verification status 为 `ready`，将 publish dry-run command 作为 next action，并在 JSON 与 JSONL output 中保留底层 release evidence。

### Requirement: CLI Diagnostics Verify Rendering Is Parity Safe / CLI Diagnostics Verify 渲染保持一致安全

CLI diagnostics verify text, JSON, and JSONL output SHALL derive from the same verification summary and release evidence records without terminal controls or raw secrets.

CLI diagnostics verify 的 text、JSON 与 JSONL output 必须来自同一 verification summary 和 release evidence records，且不得包含 terminal controls 或 raw secrets。

#### Scenario: Verify JSONL is scriptable / Verify JSONL 可脚本化

- **WHEN** `deepseek diagnostics verify --output jsonl` runs
- **THEN** every emitted line is a valid JSON object with stable `kind`, schema version, status, redaction metadata, and no ANSI, cursor state, raw secrets, SDK instances, or host UI objects
- **中文** 当 `deepseek diagnostics verify --output jsonl` 运行时，每一行都必须是有效 JSON object，包含稳定 `kind`、schema version、status、redaction metadata，且不包含 ANSI、cursor state、raw secrets、SDK instances 或 host UI objects。
