## Why

We need owned evidence that compares the current DeepSeek CLI against Codex and Claude on the same tasks, rather than relying on public benchmark claims or one-off subjective impressions.

我们需要用自有证据在同一任务下对比当前 DeepSeek CLI、Codex 与 Claude，而不是依赖公开榜单或一次性的主观体感。

## What Changes

- Extend CLI task-completion evaluation from single-baseline planning to multi-baseline comparison across `deepseek-cli`, `codex`, and `claude-code`.
- Add opt-in isolated task execution for the webpage-generation task as the first executable comparison lane.
- Record first-run success, command success rate, check pass rate, correction/recovery signals, elapsed time, output previews, generated file structure, and code-structure quality metrics from instrumentation events and executable checks.
- Emit instrumentation events for run, workspace, prompt, command, checker, artifact scan, and evidence-writing milestones so comparison statistics are machine-derived instead of manually judged.
- Keep external baselines disabled by default unless maintainers explicitly allow and configure them.
- Do not make competitive product claims from public benchmarks alone; use local replayable evidence as the source of truth.

- 将 CLI task-completion evaluation 从单 baseline 规划扩展为 `deepseek-cli`、`codex` 与 `claude-code` 的多 baseline 对比。
- 为 webpage-generation task 增加 opt-in 的隔离执行通道，作为第一条可执行对比线。
- 从 instrumentation events 与可执行 checks 中记录首轮成功率、命令成功率、check 通过率、纠错/恢复信号、耗时、输出预览、生成文件结构与代码结构质量指标。
- 输出 run、workspace、prompt、command、checker、artifact scan 与 evidence-writing 等里程碑事件，让对比统计来自机器证据，而不是人工肉眼判断。
- external baseline 默认关闭，只有维护者显式允许并配置后才执行。
- 不基于公开榜单直接做竞争力结论；以本地可回放证据作为事实来源。

## Capabilities

### New Capabilities
- `baseline-comparison-evaluation`: Baseline comparison execution, metrics, and gap findings for DeepSeek CLI, Codex, Claude, and future adapters.

### Modified Capabilities
- `cli-task-completion-evaluation`: Add multi-baseline comparison, isolated execution, and richer product-quality metrics to the existing evaluation protocol.

## Impact

- Affected contracts: `src/packages/platform-contracts/src/evaluation.ts`.
- Affected CLI implementation: diagnostics evaluate parsing, evaluation collection, and rendering under `src/apps/cli/src`.
- Affected tests: CLI contract tests for parsing, planning, external opt-in, isolated execution, and metric aggregation.
- Affected OpenSpec: evaluation specs remain bilingual and project-specific.
