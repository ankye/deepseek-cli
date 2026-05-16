## ADDED Requirements

### Requirement: Evaluate Multi-Round Operating Quality / 评估多轮运行质量

CLI task-completion evaluation SHALL score task outcome and operating quality across evidence, planning, delegation, verification, repair, synthesis, and user intervention.

CLI task-completion evaluation 必须跨 evidence、planning、delegation、verification、repair、synthesis 与 user intervention 评估 task outcome 与 operating quality。

#### Scenario: Report separates final success and process quality / 报告区分最终成功与过程质量
- **WHEN** an evaluation report compares DeepSeek CLI, Codex, Claude, or other baselines
- **THEN** it reports run success, first-pass success, evidence coverage, verification quality, repair success, code/artifact structure, user intervention count, elapsed time, and unsupported claim count as separate metrics
- **中文** 当 evaluation report 对比 DeepSeek CLI、Codex、Claude 或其他 baseline 时，必须分别报告 run success、first-pass success、evidence coverage、verification quality、repair success、code/artifact structure、user intervention count、elapsed time 与 unsupported claim count。

#### Scenario: Baseline missing instrumentation is explicit / Baseline 缺少插桩显式化
- **WHEN** a baseline does not expose structured evidence, repair, or verification loop events
- **THEN** the report marks those metrics as unavailable or inferred and does not compare them as exact instrumented values
- **中文** 当 baseline 不暴露 structured evidence、repair 或 verification loop events 时，报告必须将这些指标标记为 unavailable 或 inferred，且不得作为精确插桩值比较。

### Requirement: Reasoning Effort Is A Separate Evaluation Dimension / 推理强度是独立评估维度

Evaluation SHALL record model reasoning effort separately from external loop counts and task success.

Evaluation 必须将模型 reasoning effort 与外部 loop counts 及 task success 分开记录。

#### Scenario: High effort does not score as proof / 高推理强度不计为证明
- **WHEN** a run uses high or max reasoning effort but lacks evidence or verification events required by the scenario
- **THEN** the score does not award evidence or verification credit based on reasoning effort alone
- **中文** 当 run 使用 high 或 max reasoning effort，但缺少场景要求的 evidence 或 verification events 时，评分不得仅凭 reasoning effort 给予 evidence 或 verification 分。

#### Scenario: Effort cost can be analyzed / 推理强度成本可分析
- **WHEN** evaluation aggregates runs
- **THEN** it can compare requested reasoning effort, provider-mapped effort, reasoning token usage when available, external loop rounds, elapsed time, and success rate
- **中文** 当 evaluation 聚合 runs 时，必须能比较 requested reasoning effort、provider-mapped effort、可用时的 reasoning token usage、external loop rounds、elapsed time 与 success rate。

### Requirement: Delegation Quality Metrics / 委派质量指标

Evaluation SHALL score whether delegation improved task completion rather than only counting worker usage.

Evaluation 必须评估 delegation 是否改善 task completion，而不是只统计 worker usage。

#### Scenario: Over-delegation is penalized / 过度委派扣分
- **WHEN** a task delegates trivial file reads, simple commands, or unnecessary serial work that the main loop could handle directly
- **THEN** evaluation records over-delegation and penalizes operating quality
- **中文** 当任务委派琐碎 file reads、简单 commands 或主循环可直接处理的不必要串行工作时，evaluation 必须记录 over-delegation 并降低 operating quality。

#### Scenario: Independent verification gets credit / 独立验证加分
- **WHEN** a non-trivial task uses a verifier that cites reproducible evidence and the parent reconciles the verdict correctly
- **THEN** evaluation credits verification quality and reconciliation quality
- **中文** 当非琐碎任务使用 verifier，且 verifier 引用可复现 evidence，parent 正确 reconcile verdict 时，evaluation 必须给 verification quality 与 reconciliation quality 加分。
