## ADDED Requirements

### Requirement: CLI Evaluation Can Probe Explicit External Baselines / CLI 评估可探测显式外部 Baseline

CLI evaluation SHALL allow a maintainer to explicitly configure an external baseline command for probe-only evaluation planning while keeping the default unconfigured path deferred.

CLI evaluation 必须允许维护者显式配置 external baseline command，用于仅探测的 evaluation planning，同时默认未配置路径保持 deferred。

#### Scenario: Codex baseline remains deferred without explicit allow / 未显式允许时 Codex 保持 Deferred

- **WHEN** `deepseek diagnostics evaluate --baseline codex` runs without `--allow-external-baseline` or without `--baseline-command`
- **THEN** the runner records the Codex baseline as `deferred`, emits typed diagnostics, and does not execute any external command
- **中文** 当 `deepseek diagnostics evaluate --baseline codex` 运行但没有 `--allow-external-baseline` 或没有 `--baseline-command` 时，runner 必须把 Codex baseline 记录为 `deferred`，发出 typed diagnostics，且不执行任何外部命令。

#### Scenario: Codex baseline probe is configured explicitly / Codex Baseline Probe 被显式配置

- **WHEN** `deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command <cmd>` runs
- **THEN** the runner probes `<cmd>` through argv process execution with `shell: false`, records configured baseline metadata, bounded probe output, exit code, diagnostics, and planned task-run records without sending task prompts or mutating the workspace
- **中文** 当 `deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command <cmd>` 运行时，runner 必须通过 argv process execution 与 `shell: false` 探测 `<cmd>`，记录 configured baseline metadata、有界 probe output、exit code、diagnostics 与 planned task-run records，且不得发送 task prompts 或修改 workspace。

#### Scenario: Failed external probe is evidence, not a crash / 外部 Probe 失败记录为证据而不是崩溃

- **WHEN** a configured external baseline probe exits nonzero or cannot spawn
- **THEN** the runner records the baseline as `unavailable`, emits typed diagnostics with redacted metadata, and continues rendering the evaluation summary
- **中文** 当已配置 external baseline probe 非零退出或无法启动时，runner 必须把 baseline 记录为 `unavailable`，发出带脱敏 metadata 的 typed diagnostics，并继续渲染 evaluation summary。
