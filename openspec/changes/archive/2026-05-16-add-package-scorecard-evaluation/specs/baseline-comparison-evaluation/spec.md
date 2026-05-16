## ADDED Requirements

### Requirement: Evaluation Summaries Include Package Scorecard Metrics / Evaluation Summary 包含包级评分指标
Evaluation summaries SHALL include package scorecard aggregates as product operating metrics when package scorecard evaluation is requested or available.

当 package scorecard evaluation 被请求或已有可用结果时，evaluation summaries 必须将 package scorecard aggregates 作为 product operating metrics 输出。

#### Scenario: Dry run can describe package scorecard plan / Dry Run 描述包评分计划
- **WHEN** `deepseek diagnostics evaluate --full --dry-run --output json` runs with package scorecard support enabled
- **THEN** the evaluation summary includes package scorecard catalog version, selected package count, planned shared criteria, planned role-specific criteria, and explicit `not_assessed` placeholders without executing external baselines
- **中文** 当启用 package scorecard support 后运行 `deepseek diagnostics evaluate --full --dry-run --output json` 时，evaluation summary 必须包含 package scorecard catalog version、selected package count、planned shared criteria、planned role-specific criteria 与明确的 `not_assessed` placeholders，且不得执行 external baselines。

#### Scenario: Executed evaluation records package scorecards / 已执行 Evaluation 记录包级评分
- **WHEN** an evaluation run collects package scorecard evidence
- **THEN** the task or comparison summary includes per-package scorecard records, package aggregate metrics, and diagnostics for packages whose criteria are failed, partial, or not assessed
- **中文** 当 evaluation run 收集 package scorecard evidence 时，task 或 comparison summary 必须包含 per-package scorecard records、package aggregate metrics，以及 criteria 为 failed、partial 或 not assessed 的包 diagnostics。

#### Scenario: Package scorecards do not replace task outcomes / 包级评分不替代任务结果
- **WHEN** evaluation output includes both task runs and package scorecards
- **THEN** task outcome metrics such as solved count, success rate, command success rate, and verification credit remain present and separately interpretable
- **中文** 当 evaluation output 同时包含 task runs 与 package scorecards 时，solved count、success rate、command success rate 与 verification credit 等 task outcome metrics 必须继续存在，并且可独立解读。
