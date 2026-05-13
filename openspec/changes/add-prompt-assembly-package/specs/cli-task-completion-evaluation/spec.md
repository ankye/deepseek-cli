## ADDED Requirements

### Requirement: CLI Evaluation Records Prompt Assembly Evidence / CLI 评估记录 Prompt Assembly 证据

CLI task-completion evaluation SHALL record prompt assembly evidence for DeepSeek CLI runs so task outcomes can be correlated with prompt structure, context inclusion, tool projection, and provider readiness.

CLI task-completion evaluation 必须为 DeepSeek CLI runs 记录 prompt assembly evidence，使 task outcomes 可以与 prompt structure、context inclusion、tool projection 与 provider readiness 关联。

#### Scenario: DeepSeek run includes assembly metrics / DeepSeek Run 包含 Assembly 指标
- **WHEN** an evaluation executes a DeepSeek CLI task through the runtime event stream
- **THEN** the task record includes prompt assembly fingerprint, section counts, excluded section counts, budget status, visible tool count, tool projection policy, and redacted diagnostics when `prompt.assembled` evidence is available
- **中文** 当 evaluation 通过 runtime event stream 执行 DeepSeek CLI task 时，如果存在 `prompt.assembled` evidence，task record 必须包含 prompt assembly fingerprint、section counts、excluded section counts、budget status、visible tool count、tool projection policy 与 redacted diagnostics。

#### Scenario: Missing assembly evidence is diagnostic / 缺少 Assembly 证据是诊断项
- **WHEN** a DeepSeek CLI evaluation task reaches model dispatch or task completion without prompt assembly evidence
- **THEN** the evaluation records a typed diagnostic instead of silently treating prompt assembly as unknown
- **中文** 当 DeepSeek CLI evaluation task 到达 model dispatch 或 task completion 但没有 prompt assembly evidence 时，evaluation 必须记录 typed diagnostic，而不是静默将 prompt assembly 视为 unknown。

### Requirement: CLI Evaluation Uses Assembly Evidence For Gap Analysis / CLI 评估用 Assembly 证据分析差距

CLI evaluation SHALL use prompt assembly evidence to identify product gaps separately from model capability gaps.

CLI evaluation 必须使用 prompt assembly evidence 区分产品机制差距与模型能力差距。

#### Scenario: Webpage generation failure distinguishes product gap / 网页生成失败区分产品差距
- **WHEN** DeepSeek CLI fails the webpage generation task
- **THEN** the evaluation can report whether the run lacked write-capable tool visibility, lacked output contract sections, dropped relevant context, failed provider readiness, or failed after a complete prompt/tool plan was assembled
- **中文** 当 DeepSeek CLI 未通过 webpage generation task 时，evaluation 必须能报告该 run 是缺少 write-capable tool visibility、缺少 output contract sections、丢弃相关 context、provider readiness 失败，还是在完整 prompt/tool plan 已组装后仍失败。

#### Scenario: Comparison reports assembly readiness / 对比报告 Assembly Readiness
- **WHEN** a comparison summary includes DeepSeek CLI, Claude, Codex, or future baselines
- **THEN** DeepSeek-owned records include prompt assembly readiness metrics separately from external baseline outcome metrics, because external CLIs may not expose equivalent assembly traces
- **中文** 当 comparison summary 包含 DeepSeek CLI、Claude、Codex 或未来 baselines 时，DeepSeek 自有 records 必须将 prompt assembly readiness metrics 与 external baseline outcome metrics 分开记录，因为 external CLIs 可能不暴露等价 assembly traces。
