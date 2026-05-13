## MODIFIED Requirements

### Requirement: CLI Evaluation Defines Repeatable Task Completion Protocol / CLI 评估定义可重复任务完成协议

The system SHALL define a repeatable CLI task-completion evaluation protocol that runs each baseline against the same task prompt, repository snapshot, allowed capabilities, resource limits, checks, scoring rubric, instrumentation event schema, and baseline comparison metrics.

系统必须定义可重复的 CLI task-completion evaluation protocol，让每个 baseline 在相同 task prompt、repository snapshot、allowed capabilities、resource limits、checks、scoring rubric、instrumentation event schema 与 baseline comparison metrics 下运行。

#### Scenario: Same task constraints across baselines / Baseline 使用相同任务约束

- **WHEN** an evaluation task is selected for DeepSeek CLI, Claude Code, Codex, or another baseline
- **THEN** the evaluation record includes the same task id, fixture id, prompt digest, workspace snapshot id, allowed capability profile, time budget, check commands, scoring rubric id, instrumentation event schema, and metric schema for every baseline run
- **中文** 当一个 evaluation task 被用于 DeepSeek CLI、Claude Code、Codex 或其他 baseline 时，evaluation record 必须为每个 baseline run 记录相同 task id、fixture id、prompt digest、workspace snapshot id、allowed capability profile、time budget、check commands、scoring rubric id、instrumentation event schema 与 metric schema。

### Requirement: CLI Evaluation Scores Outcomes And Product Mechanics / CLI 评估同时评分结果与产品机制

The system SHALL score task completion outcomes and product operating quality using structured records rather than a single unqualified win/loss value.

系统必须用结构化 records 同时评分 task completion outcomes 与 product operating quality，而不是只给一个未限定的胜负值。

#### Scenario: Run summary records completion and diagnostics / Run Summary 记录完成度与诊断

- **WHEN** a baseline finishes an evaluation task
- **THEN** the run summary records outcome as `solved`, `partial`, `failed`, or `invalid`, plus instrumentation events, check results, patch metadata, elapsed time, retries, user interventions, safety violations, first-run success, command success rate, check pass rate, correction count, command failure count, generated artifact structure metrics, context recall evidence, recovery/revert usage, cost estimate when available, diagnostics, and redaction metadata
- **中文** 当一个 baseline 完成 evaluation task 后，run summary 必须记录 `solved`、`partial`、`failed` 或 `invalid`，并包含 instrumentation events、check results、patch metadata、elapsed time、retries、user interventions、safety violations、首轮成功、命令成功率、check pass rate、纠错次数、命令失败次数、生成产物结构指标、context recall evidence、recovery/revert usage、可用时的 cost estimate、diagnostics 与 redaction metadata。

### Requirement: CLI Evaluation External Baselines Are Opt-In / CLI 评估外部 Baseline 默认 Opt-In

The system SHALL not invoke external proprietary CLIs or live providers unless a maintainer explicitly configures the executable, credentials, allowed scope, evaluation mode, and task execution request.

系统不得调用外部专有 CLI 或 live providers，除非维护者显式配置 executable、credentials、allowed scope、evaluation mode 与 task execution request。

#### Scenario: Unconfigured external baseline is deferred / 未配置外部 Baseline 被延后

- **WHEN** an evaluation includes Claude Code, Codex, or another external baseline without a configured adapter
- **THEN** the runner records that baseline as `deferred` or `unavailable`, emits typed diagnostics, and continues deterministic DeepSeek CLI evaluation without executing the external command
- **中文** 当 evaluation 包含 Claude Code、Codex 或其他 external baseline 但没有 configured adapter 时，runner 必须把该 baseline 记录为 `deferred` 或 `unavailable`，发出 typed diagnostics，并在不执行外部命令的情况下继续 deterministic DeepSeek CLI evaluation。

#### Scenario: Configured external baseline is not enough for task execution / 仅配置 External Baseline 不足以执行任务

- **WHEN** an external baseline command is configured without `--execute-task`
- **THEN** the runner may probe the baseline, but it records selected task runs as `planned` and does not send task prompts
- **中文** 当 external baseline command 已配置但没有 `--execute-task` 时，runner 可以 probe baseline，但必须把 selected task runs 记录为 `planned`，且不得发送 task prompt。

### Requirement: CLI Evaluation Includes Webpage Generation Task / CLI 评估包含网页生成任务

CLI task-completion evaluation SHALL include a deterministic webpage-generation task with local artifact validation and SHALL allow that task to be executed in isolated comparison workspaces.

CLI task-completion evaluation 必须包含带本地产物校验的 deterministic webpage-generation task，并必须允许该任务在隔离 comparison workspaces 中执行。

#### Scenario: Webpage generation task is planned in full mode / 网页生成任务在 Full 模式规划

- **WHEN** `deepseek diagnostics evaluate --full --dry-run --output json` runs
- **THEN** the task catalog includes a webpage-generation task with prompt summary, fixture id, snapshot id, capability profile, time budget, check command, scoring rubric id, and `mode: "full"`
- **中文** 当 `deepseek diagnostics evaluate --full --dry-run --output json` 运行时，task catalog 必须包含 webpage-generation task，并带有 prompt summary、fixture id、snapshot id、capability profile、time budget、check command、scoring rubric id 与 `mode: "full"`。

#### Scenario: Webpage artifact checker validates generated output / 网页产物检查器校验生成输出

- **WHEN** the webpage artifact checker runs against a generated webpage directory
- **THEN** it verifies a local HTML entry, viewport metadata, stylesheet or inline style, JavaScript interaction hook, accessible label or heading, and absence of remote CDN/script dependencies
- **中文** 当 webpage artifact checker 对生成网页目录运行时，它必须验证 local HTML entry、viewport metadata、stylesheet 或 inline style、JavaScript interaction hook、accessible label 或 heading，以及不存在 remote CDN/script dependencies。

#### Scenario: Webpage comparison executes in isolation / 网页对比在隔离环境执行

- **WHEN** `deepseek diagnostics evaluate --full --execute-task eval.webpage.generation --compare-baseline deepseek-cli --compare-baseline codex --compare-baseline claude-code` runs with required external opt-ins
- **THEN** each executable baseline receives the same webpage-generation prompt in its own isolated workspace and the checker evaluates that workspace's generated webpage directory
- **中文** 当带必要 external opt-ins 运行 `deepseek diagnostics evaluate --full --execute-task eval.webpage.generation --compare-baseline deepseek-cli --compare-baseline codex --compare-baseline claude-code` 时，每个可执行 baseline 必须在自己的隔离 workspace 中收到同一网页生成 prompt，checker 必须校验该 workspace 的 generated webpage directory。
