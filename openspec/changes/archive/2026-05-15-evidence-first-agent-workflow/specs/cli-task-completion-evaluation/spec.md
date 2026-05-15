## ADDED Requirements

### Requirement: CLI Evaluation Scores Evidence Grounding / CLI 评估评分证据接地

CLI task-completion evaluation SHALL score evidence grounding quality for tasks that produce project facts, product copy, generated artifacts, reports, command recommendations, or competitive conclusions.

CLI task-completion evaluation 必须为产出项目事实、产品文案、生成产物、报告、命令建议或竞争结论的任务评分 evidence grounding quality。

#### Scenario: Task run records evidence metrics / 任务运行记录证据指标
- **WHEN** an evaluation task completes with factual project output
- **THEN** the task run record includes evidence plan presence, evidence item count, source coverage, claim grounding rate, unsupported claim count, assumption count, hallucinated command count, and evidence manifest status
- **中文** 当 evaluation task 完成并产生事实性项目输出时，task run record 必须包含 evidence plan presence、evidence item count、source coverage、claim grounding rate、unsupported claim count、assumption count、hallucinated command count 与 evidence manifest status。

#### Scenario: Unsupported claims reduce outcome / 未支持声明降低结果评分
- **WHEN** a generated artifact or report contains unsupported package, command, feature, release, architecture, or evaluation claims
- **THEN** evaluation records diagnostics and MUST NOT mark the run fully solved unless the unsupported claims are removed or explicitly labeled as assumptions under an allowed speculative task
- **中文** 当生成产物或报告包含 unsupported package、command、feature、release、architecture 或 evaluation claims 时，evaluation 必须记录 diagnostics，且除非 unsupported claims 被移除或在允许的 speculative task 中明确标为 assumptions，否则不得将运行标为 fully solved。

### Requirement: Webpage Evaluation Requires Evidence Manifest / 网页评估要求证据清单

CLI webpage-generation evaluation SHALL require generated product webpages to include an evidence manifest and pass unsupported-claim checks.

CLI webpage-generation evaluation 必须要求生成的产品网页包含 evidence manifest，并通过 unsupported-claim checks。

#### Scenario: Product webpage without manifest fails / 缺少清单的产品网页失败
- **WHEN** the webpage artifact checker evaluates a generated product webpage
- **THEN** it fails if `evidence.json` or equivalent manifest is missing, malformed, lacks source coverage, or reports unsupported strict claims
- **中文** 当 webpage artifact checker 评估生成产品网页时，如果缺少 `evidence.json` 或等价 manifest、manifest 格式错误、缺少 source coverage 或报告 unsupported strict claims，必须失败。

#### Scenario: Hallucinated command fails webpage check / 幻觉命令导致网页检查失败
- **WHEN** generated webpage content includes an install or run command not supported by evidence manifest sources
- **THEN** the checker reports an unsupported-command diagnostic and the task run is not solved
- **中文** 当生成网页内容包含 evidence manifest sources 不支持的安装或运行命令时，checker 必须报告 unsupported-command diagnostic，且 task run 不得为 solved。
