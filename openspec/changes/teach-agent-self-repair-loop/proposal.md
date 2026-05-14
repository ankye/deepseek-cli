## Why

DeepSeek CLI already has the building blocks for model calls, tool execution, checkpoints, prompt assembly work, PageIndex recall, and evaluation, but it does not yet make the engineering self-repair loop a default product behavior. To compete with Codex and Claude Code on real task completion, the CLI must reliably diagnose failures, choose bounded repairs, rerun checks, and leave replayable evidence instead of depending on a lucky prompt.

DeepSeek CLI 已经具备模型调用、工具执行、checkpoint、prompt assembly 工作、PageIndex 回溯和评估等基础模块，但还没有把工程自修复闭环变成默认产品行为。要在真实任务完成能力上对标 Codex 与 Claude Code，CLI 必须稳定地诊断失败、选择有界修复、复跑检查并留下可回放证据，而不是依赖一次幸运的 prompt。

## What Changes

- Add a first-class `agent-self-repair-loop` capability covering diagnosis, repair planning, bounded repair attempts, verification, escalation, and replay evidence.
- Extend the agent loop so tool, model, provider, build, test, lint, and artifact-check failures can enter a structured self-repair phase before terminal failure when policy and budget allow it.
- Add prompt/runtime guidance that teaches the model to reason operationally: inspect evidence first, identify likely root cause, make the smallest targeted change, rerun the relevant check, then broaden verification when the local fix passes.
- Record repair attempts as redacted, replayable evidence with failure classification, chosen strategy, touched files/tools, verification commands, outcomes, and stop reasons.
- Extend CLI task-completion evaluation so DeepSeek, Codex, Claude, and future baselines can be compared on run success rate, repair success rate, correction rate, verification quality, code structure, and user-intervention count.
- Add deterministic regression scenarios for common coding-agent failure modes, including malformed tool calls, provider continuation mistakes, missing generated files, failing check commands, bad imports, unsafe broad edits, and repeated ineffective retries.
- Keep repair actions under existing policy, sandbox, checkpoint, and revert governance. No repair path may bypass approval, write safety, redaction, or architecture boundaries.

- 新增一等能力 `agent-self-repair-loop`，覆盖诊断、修复规划、有界修复尝试、验证、升级处理与可回放证据。
- 扩展 agent loop，使 tool、model、provider、build、test、lint 与 artifact-check failures 在 policy 与预算允许时，可以先进入结构化自修复阶段，而不是直接终态失败。
- 增加 prompt/runtime 指导，让模型按工程流程行动：先检查证据、识别可能根因、做最小目标修改、复跑相关检查，本地通过后再扩大验证范围。
- 将 repair attempts 记录为脱敏、可回放证据，包含失败分类、选择策略、涉及文件/工具、验证命令、结果与停止原因。
- 扩展 CLI task-completion evaluation，让 DeepSeek、Codex、Claude 与未来 baseline 可以比较运行成功率、修复成功率、纠错率、验证质量、代码结构与用户介入次数。
- 增加确定性回归场景，覆盖常见 coding-agent 失败模式，包括 malformed tool calls、provider continuation mistakes、缺失生成文件、check command 失败、错误 imports、过宽编辑与重复无效重试。
- 修复动作必须受现有 policy、sandbox、checkpoint 与 revert governance 管控。任何 repair path 都不得绕过审批、写入安全、脱敏或架构边界。

## Capabilities

### New Capabilities
- `agent-self-repair-loop`: Structured failure diagnosis, bounded repair planning, verification reruns, escalation decisions, and replayable repair evidence for CLI-first agent tasks.

### Modified Capabilities
- `agent-loop`: Runtime turns must support a governed self-repair phase before terminal failure when a repairable failure is detected.
- `cli-task-completion-evaluation`: Evaluation records must include repair-loop metrics and comparison dimensions for DeepSeek, Codex, Claude, and other baselines.
- `observability-privacy`: Observability records must capture repair-loop evidence safely, including diagnoses, repair attempts, verification outcomes, and stop reasons.
- `testing-regression`: Regression suites must cover deterministic failure-to-repair scenarios and prevent repair-loop behavior from regressing.

## Impact

- Affected runtime: `src/packages/runtime`, especially agent loop control flow, tool-result feedback, terminal failure semantics, and repair attempt orchestration.
- Affected contracts: `src/packages/platform-contracts` for repair-loop DTOs, failure classifications, repair evidence, verification summaries, and schema versioning.
- Affected prompt pipeline: `src/packages/prompt-assembly` once the prompt assembly package change is applied, through dedicated repair/diagnostic sections rather than ad hoc prompt mutation.
- Affected CLI/evaluation: `src/apps/cli` diagnostics and `src/apps/cli/src/diagnostics/evaluation.ts` for repair metrics, generated task evidence, and baseline reports.
- Affected observability: `src/packages/observability` and runtime event records for redacted local evidence and replay-safe diagnostic bundles.
- Affected tests: unit, contract, integration, golden replay, CLI evaluation, and versioning tests for failure classification, repair attempts, verification reruns, and evidence redaction.
