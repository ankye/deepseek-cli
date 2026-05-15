## ADDED Requirements

### Requirement: CLI Evaluation Records Self-Repair Metrics / CLI 评估记录自修复指标

CLI task-completion evaluation SHALL record self-repair metrics for DeepSeek CLI and comparable baseline runs when evidence is available.

CLI task-completion evaluation 必须在有证据时为 DeepSeek CLI 与可比较 baseline runs 记录 self-repair metrics。

#### Scenario: DeepSeek run records repair metrics / DeepSeek 运行记录修复指标
- **WHEN** a DeepSeek CLI evaluation task completes with repair-loop evidence
- **THEN** the task run record includes first-pass success, repair activation count, repair success count, failed verification count, corrected verification count, repeated ineffective attempt count, stop reason, and redaction metadata
- **中文** 当 DeepSeek CLI evaluation task 带 repair-loop evidence 完成时，task run record 必须包含 first-pass success、repair activation count、repair success count、failed verification count、corrected verification count、repeated ineffective attempt count、stop reason 与 redaction metadata。

#### Scenario: Baseline without repair evidence is explicit / 缺少修复证据的 Baseline 明确标记
- **WHEN** Codex, Claude, or another baseline does not expose structured repair evidence
- **THEN** the evaluation record marks repair metrics as unavailable or inferred, separates them from instrumented DeepSeek metrics, and avoids claiming exact parity
- **中文** 当 Codex、Claude 或其他 baseline 不暴露结构化 repair evidence 时，evaluation record 必须将 repair metrics 标记为 unavailable 或 inferred，与已插桩的 DeepSeek metrics 分离，并避免声称精确等价。

### Requirement: CLI Evaluation Scores Repair-Aware Task Quality / CLI 评估评分修复感知任务质量

CLI task-completion evaluation SHALL score task quality using final outcome plus repair-aware operating quality dimensions rather than only generated artifact existence.

CLI task-completion evaluation 必须使用最终结果加 repair-aware operating quality dimensions 评分，而不是只看生成产物是否存在。

#### Scenario: Report compares success and repair quality / 报告同时比较成功与修复质量
- **WHEN** a competitive report compares DeepSeek CLI with Codex, Claude, or another baseline
- **THEN** the report includes run success rate, first-pass success rate, repair success rate when available, verification quality, code or artifact structure score, user intervention count, elapsed time, and task evidence ids
- **中文** 当 competitive report 比较 DeepSeek CLI 与 Codex、Claude 或其他 baseline 时，报告必须包含 run success rate、first-pass success rate、可用时的 repair success rate、verification quality、代码或产物结构评分、user intervention count、elapsed time 与 task evidence ids。

#### Scenario: Unverified repair is not scored as full success / 未验证修复不得满分
- **WHEN** a run modifies files after a failed check but does not rerun the relevant verification or artifact checker
- **THEN** the evaluation records verification quality as incomplete and MUST NOT score the run as fully solved solely from file changes
- **中文** 当一次运行在 failed check 后修改文件但没有复跑相关 verification 或 artifact checker 时，evaluation 必须将 verification quality 记录为 incomplete，且不得仅凭文件变化将该运行评分为 fully solved。

### Requirement: CLI Evaluation Includes Failure-To-Repair Scenarios / CLI 评估包含失败到修复场景

CLI task-completion evaluation SHALL include scenarios that intentionally trigger repairable failures and measure whether the agent diagnoses, fixes, verifies, or stops correctly.

CLI task-completion evaluation 必须包含有意触发可修复失败的场景，并衡量 agent 是否正确诊断、修复、验证或停止。

#### Scenario: Webpage generation repair scenario is evaluated / 网页生成修复场景被评估
- **WHEN** a webpage generation task omits a required file, breaks JavaScript syntax, or violates local-artifact rules during the first attempt
- **THEN** the evaluation checks whether the agent detects the failed artifact check, repairs the webpage, reruns the checker, and records repair evidence
- **中文** 当网页生成任务在首次尝试中缺失必要文件、破坏 JavaScript syntax 或违反 local-artifact rules 时，evaluation 必须检查 agent 是否检测 failed artifact check、修复网页、复跑 checker 并记录 repair evidence。

#### Scenario: Coding task repair scenario is evaluated / 编码任务修复场景被评估
- **WHEN** a coding task introduces a typecheck, lint, test, import, or architecture-boundary failure
- **THEN** the evaluation checks whether the agent classifies the failure, applies the smallest targeted repair, reruns the relevant command, and avoids unrelated refactors
- **中文** 当编码任务引入 typecheck、lint、test、import 或 architecture-boundary failure 时，evaluation 必须检查 agent 是否分类失败、应用最小目标修复、复跑相关命令并避免无关重构。
