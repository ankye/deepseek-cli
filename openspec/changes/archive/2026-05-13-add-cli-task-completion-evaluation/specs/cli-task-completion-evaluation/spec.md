## ADDED Requirements

### Requirement: CLI Evaluation Defines Repeatable Task Completion Protocol / CLI 评估定义可重复任务完成协议

The system SHALL define a repeatable CLI task-completion evaluation protocol that runs each baseline against the same task prompt, repository snapshot, allowed capabilities, resource limits, checks, and scoring rubric.

系统必须定义可重复的 CLI task-completion evaluation protocol，让每个 baseline 在相同 task prompt、repository snapshot、allowed capabilities、resource limits、checks 与 scoring rubric 下运行。

#### Scenario: Same task constraints across baselines / Baseline 使用相同任务约束

- **WHEN** an evaluation task is selected for DeepSeek CLI, Claude Code, Codex, or another baseline
- **THEN** the evaluation record includes the same task id, fixture id, prompt digest, workspace snapshot id, allowed capability profile, time budget, check commands, and scoring rubric id for every baseline run
- **中文** 当一个 evaluation task 被用于 DeepSeek CLI、Claude Code、Codex 或其他 baseline 时，evaluation record 必须为每个 baseline run 记录相同 task id、fixture id、prompt digest、workspace snapshot id、allowed capability profile、time budget、check commands 与 scoring rubric id。

### Requirement: CLI Evaluation Scores Outcomes And Product Mechanics / CLI 评估同时评分结果与产品机制

The system SHALL score task completion outcomes and product operating quality using structured records rather than a single unqualified win/loss value.

系统必须用结构化 records 同时评分 task completion outcomes 与 product operating quality，而不是只给一个未限定的胜负值。

#### Scenario: Run summary records completion and diagnostics / Run Summary 记录完成度与诊断

- **WHEN** a baseline finishes an evaluation task
- **THEN** the run summary records outcome as `solved`, `partial`, `failed`, or `invalid`, plus check results, patch metadata, elapsed time, retries, user interventions, safety violations, context recall evidence, recovery/revert usage, cost estimate when available, diagnostics, and redaction metadata
- **中文** 当一个 baseline 完成 evaluation task 后，run summary 必须记录 `solved`、`partial`、`failed` 或 `invalid`，并包含 check results、patch metadata、elapsed time、retries、user interventions、safety violations、context recall evidence、recovery/revert usage、可用时的 cost estimate、diagnostics 与 redaction metadata。

### Requirement: CLI Evaluation Separates Public Benchmarks From Product Evidence / CLI 评估区分公开榜单与产品证据

The system SHALL treat public benchmark references as advisory context and SHALL require DeepSeek-owned evaluation evidence for CLI competitive or release-readiness claims.

系统必须把 public benchmark references 作为参考上下文，并要求 CLI 竞争力或 release-readiness 声明具备 DeepSeek-owned evaluation evidence。

#### Scenario: Competitive report cites owned evidence / 竞争力报告引用自有证据

- **WHEN** a report compares DeepSeek CLI against Claude Code, Codex, or another named competitor
- **THEN** the report includes DeepSeek-owned task run evidence ids, report timestamp, task catalog version, baseline versions or unavailable status, and any public benchmark references in a separate advisory section
- **中文** 当报告将 DeepSeek CLI 与 Claude Code、Codex 或其他具名竞品对比时，报告必须包含 DeepSeek-owned task run evidence ids、report timestamp、task catalog version、baseline versions 或 unavailable status，并把 public benchmark references 放在独立 advisory section。

### Requirement: CLI Evaluation External Baselines Are Opt-In / CLI 评估外部 Baseline 默认 Opt-In

The system SHALL not invoke external proprietary CLIs or live providers unless a maintainer explicitly configures the executable, credentials, allowed scope, and evaluation mode.

系统不得调用外部专有 CLI 或 live providers，除非维护者显式配置 executable、credentials、allowed scope 与 evaluation mode。

#### Scenario: Unconfigured external baseline is deferred / 未配置外部 Baseline 被延后

- **WHEN** an evaluation includes Claude Code, Codex, or another external baseline without a configured adapter
- **THEN** the runner records that baseline as `deferred` or `unavailable`, emits typed diagnostics, and continues deterministic DeepSeek CLI evaluation without executing the external command
- **中文** 当 evaluation 包含 Claude Code、Codex 或其他 external baseline 但没有 configured adapter 时，runner 必须把该 baseline 记录为 `deferred` 或 `unavailable`，发出 typed diagnostics，并在不执行外部命令的情况下继续 deterministic DeepSeek CLI evaluation。

### Requirement: CLI Evaluation Evidence Is Redacted And Replayable / CLI 评估证据脱敏且可回放

The system SHALL write evaluation summaries and per-task records as redacted, machine-readable evidence that can be replayed or compared over time.

系统必须把 evaluation summaries 与 per-task records 写成脱敏、机器可读、可回放并可跨时间对比的 evidence。

#### Scenario: Evaluation writes local evidence artifacts / Evaluation 写入本地证据产物

- **WHEN** an evaluation run completes
- **THEN** it writes a JSON summary, JSONL task records, bounded sanitized output snippets, patch metadata, and check outputs under stable local evidence paths, without ANSI cursor state, raw secrets, or unbounded transcripts
- **中文** 当 evaluation run 完成时，它必须在稳定本地 evidence paths 下写入 JSON summary、JSONL task records、bounded sanitized output snippets、patch metadata 与 check outputs，且不得包含 ANSI cursor state、raw secrets 或 unbounded transcripts。
