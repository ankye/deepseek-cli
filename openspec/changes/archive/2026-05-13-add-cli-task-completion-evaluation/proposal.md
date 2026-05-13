## Why

The CLI-first product route needs an objective way to compare real task-completion ability against Claude Code, Codex, and our own DeepSeek CLI instead of relying on public leaderboard scores or subjective trial impressions.

CLI-first 产品路线需要一个客观方法，把 Claude Code、Codex 与我们自己的 DeepSeek CLI 放到同一任务完成能力评估里比较，而不是只依赖公开榜单或主观体感。

## What Changes

- Add a product-level task-completion evaluation capability for the CLI.
- Define a repeatable comparison protocol: same repository snapshot, same task prompt, same time/resource budget, same allowed tools, same scoring rubric, and same evidence bundle.
- Track both outcome quality and product mechanics: solved/partial/failed, tests passed, patch size, safety violations, retries, user interventions, elapsed time, token/cost estimate, context recall quality, and revert/recovery behavior.
- Treat public benchmarks such as SWE-bench and Terminal-Bench as advisory inputs only; release claims require DeepSeek-owned replayable tasks and acceptance evidence.
- Require CLI release-readiness claims to cite the latest internal task-completion comparison results when comparing against Claude Code or Codex.

- 新增 CLI 产品级 task-completion evaluation capability。
- 定义可重复的对比协议：相同 repository snapshot、相同 task prompt、相同 time/resource budget、相同 allowed tools、相同 scoring rubric 与相同 evidence bundle。
- 同时记录结果质量与产品机制：solved/partial/failed、tests passed、patch size、safety violations、retries、user interventions、elapsed time、token/cost estimate、context recall quality 与 revert/recovery behavior。
- SWE-bench、Terminal-Bench 等公开 benchmark 只作为参考输入；release claims 必须依赖 DeepSeek-owned 可回放任务与 acceptance evidence。
- 当 CLI release-readiness claims 对比 Claude Code 或 Codex 时，必须引用最近一次内部 task-completion comparison results。

## Capabilities

### New Capabilities

- `cli-task-completion-evaluation`: Defines the internal benchmark protocol, task catalog, scoring records, evidence artifacts, and comparison reporting for CLI agent task completion.

### Modified Capabilities

- `cli-first-product-route`: CLI completion and competitive claims must be backed by repeatable task-completion evaluation evidence.

## Impact

- Affected planning artifacts: product roadmap, CLI-first product route, and acceptance documentation.
- Affected future code: evaluation task fixtures, benchmark runner, result DTOs, evidence writer, comparison reporter, and optional adapters for external CLI baselines.
- Affected operations: release readiness must distinguish public benchmark references from DeepSeek-owned product evidence.

- 影响规划产物：product roadmap、CLI-first 产品路线与验收文档。
- 影响未来代码：evaluation task fixtures、benchmark runner、result DTOs、evidence writer、comparison reporter，以及可选 external CLI baseline adapters。
- 影响操作流程：release readiness 必须区分公开 benchmark references 与 DeepSeek-owned product evidence。
