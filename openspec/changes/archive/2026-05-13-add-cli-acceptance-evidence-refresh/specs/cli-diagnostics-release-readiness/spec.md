## ADDED Requirements

### Requirement: CLI Diagnostics Refresh Regenerates Acceptance Evidence / CLI Diagnostics Refresh 重新生成验收证据

CLI diagnostics SHALL expose a controlled `diagnostics refresh` command that regenerates local acceptance evidence files through built-in allowlisted validation plans.

CLI diagnostics 必须暴露受控的 `diagnostics refresh` 命令，通过内置 allowlisted validation plans 重新生成本地 acceptance evidence files。

#### Scenario: Default refresh writes release-critical evidence / 默认 Refresh 写入发布关键证据

- **WHEN** `deepseek diagnostics refresh` runs from the repository root
- **THEN** it runs only the default allowlisted release-critical plan, writes command output to `tests/acceptance/latest/*.txt`, includes `release-verify.txt`, and emits a summary with refreshed paths, exit codes, status, and next action
- **中文** 当 `deepseek diagnostics refresh` 从 repository root 运行时，它必须只运行默认 allowlisted release-critical plan，将命令输出写入 `tests/acceptance/latest/*.txt`，包含 `release-verify.txt`，并输出包含 refreshed paths、exit codes、status 与 next action 的 summary。

#### Scenario: Full refresh extends the allowlist / Full Refresh 扩展 Allowlist

- **WHEN** `deepseek diagnostics refresh --full` runs
- **THEN** it includes the default refresh plan plus heavier deterministic suites such as contracts, integration, golden, versioning, matrix, and e2e, while still rejecting user-supplied command strings
- **中文** 当 `deepseek diagnostics refresh --full` 运行时，它必须包含默认 refresh plan，并额外包含 contracts、integration、golden、versioning、matrix 与 e2e 等更重但确定性的 suites，同时仍然拒绝用户自定义 command strings。

#### Scenario: Refresh does not execute unsafe commands / Refresh 不执行不安全命令

- **WHEN** `diagnostics refresh` receives extra positional arguments or command-like input
- **THEN** the CLI reports typed diagnostics and does not execute publish, network, model, provider, live-test, or arbitrary shell commands
- **中文** 当 `diagnostics refresh` 收到额外 positional arguments 或类似 command 的输入时，CLI 必须报告 typed diagnostics，且不得执行 publish、network、model、provider、live-test 或任意 shell commands。

### Requirement: CLI Diagnostics Refresh Rendering Is Evidence Safe / CLI Diagnostics Refresh 渲染保持证据安全

CLI diagnostics refresh text, JSON, and JSONL output SHALL derive from the same refresh summary records and SHALL not expose raw secrets or terminal controls.

CLI diagnostics refresh 的 text、JSON 与 JSONL output 必须来自同一套 refresh summary records，且不得暴露 raw secrets 或 terminal controls。

#### Scenario: Refresh JSONL is scriptable / Refresh JSONL 可脚本化

- **WHEN** `deepseek diagnostics refresh --output jsonl` runs
- **THEN** each line is a valid JSON object with stable `kind`, schema version, step id, output path, exit code, redaction metadata, and no ANSI/cursor state/raw secrets
- **中文** 当 `deepseek diagnostics refresh --output jsonl` 运行时，每一行都必须是有效 JSON object，包含稳定 `kind`、schema version、step id、output path、exit code、redaction metadata，且不包含 ANSI/cursor state/raw secrets。
