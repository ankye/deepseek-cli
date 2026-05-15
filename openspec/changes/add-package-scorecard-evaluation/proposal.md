## Why

DeepSeek CLI already has task-level evaluation, release evidence, architecture lint, and baseline comparison metrics, but package maturity is still inferred from broad checks like `npm test` or `npm run lint`. We need a repeatable package-level scorecard so framework readiness can answer which package is strong, weak, unassessed, or blocked, and why.

DeepSeek CLI 已经具备任务级 evaluation、release evidence、architecture lint 与 baseline comparison metrics，但包成熟度仍主要从 `npm test` 或 `npm run lint` 这类大范围检查间接推断。我们需要可重复的包级 scorecard，用来回答 framework readiness 中哪个包强、哪个包弱、哪个包未评估、哪个包被硬门禁阻塞，以及原因是什么。

## What Changes

- Add a package scorecard capability that evaluates every workspace package through structured criteria, weighted scores, pass rates, assessment coverage, and hard gates.
- Introduce a rubric catalog for package roles, starting with shared criteria for all packages and role-specific sample criteria for `platform-contracts`, `model-gateway`, and `runtime`.
- Extend CLI diagnostics evaluation output with package scorecard summaries, per-package criterion results, package readiness status, and platform-level aggregate readiness.
- Treat `fail`, `partial`, `not_assessed`, and `not_applicable` distinctly so missing evidence does not masquerade as success.
- Keep hard-gate failures, such as secret leakage, forbidden imports, contract impurity, and package boundary violations, separate from weighted scores.
- Preserve existing task-completion evaluation behavior; this change adds a package maturity view rather than replacing task outcome metrics.

- 新增 package scorecard capability，用结构化 criteria、weighted scores、pass rates、assessment coverage 与 hard gates 评估每个 workspace package。
- 引入 package role rubric catalog，第一版包含所有包共享的基础 criteria，并为 `platform-contracts`、`model-gateway` 与 `runtime` 提供 role-specific 样板 criteria。
- 扩展 CLI diagnostics evaluation 输出，加入 package scorecard summaries、per-package criterion results、package readiness status 与 platform-level aggregate readiness。
- 区分 `fail`、`partial`、`not_assessed` 与 `not_applicable`，避免缺失证据被误算为成功。
- 将 secret leakage、forbidden imports、contract impurity、package boundary violations 等 hard-gate failures 与 weighted score 分开处理。
- 保持现有 task-completion evaluation 行为；本变更新增 package maturity 视角，不替代 task outcome metrics。

## Capabilities

### New Capabilities

- `package-scorecard-evaluation`: Defines package-level scorecard contracts, rubric catalog behavior, per-package criterion scoring, hard gates, package readiness summaries, and platform aggregate readiness.

- `package-scorecard-evaluation`：定义包级 scorecard contracts、rubric catalog 行为、per-package criterion scoring、hard gates、package readiness summaries 与 platform aggregate readiness。

### Modified Capabilities

- `baseline-comparison-evaluation`: Evaluation summaries will include package scorecard aggregates as product operating metrics when package scorecard evaluation is requested or available.
- `cli-diagnostics-release-readiness`: Release diagnostics will be able to cite package scorecard evidence as an advisory readiness signal without making it a publish blocker in v1.

- `baseline-comparison-evaluation`：当请求或已有 package scorecard evaluation 时，evaluation summaries 将把 package scorecard aggregates 作为 product operating metrics 输出。
- `cli-diagnostics-release-readiness`：release diagnostics 可以引用 package scorecard evidence 作为 advisory readiness signal；v1 不把它作为 publish blocker。

## Impact

- Affected contracts: `src/packages/platform-contracts/src/evaluation.ts` or a new package-scorecard contract module exported from `@deepseek/platform-contracts`.
- Affected CLI diagnostics: `src/apps/cli/src/diagnostics/evaluation.ts`, `evaluation-metrics.ts`, and JSON/JSONL/text rendering.
- Affected data: new scorecard/rubric catalog under `tests/evaluation/` or a diagnostics-owned fixture location.
- Affected checks: existing lint/typecheck/test/boundary outputs become evidence inputs; v1 may start with deterministic static evidence and explicit `not_assessed` statuses where automated proof is not yet available.
- No breaking changes are expected; existing `diagnostics evaluate` outputs remain backward-compatible and gain additive fields.

- 影响 contracts：`src/packages/platform-contracts/src/evaluation.ts`，或从 `@deepseek/platform-contracts` 导出的新 package-scorecard contract module。
- 影响 CLI diagnostics：`src/apps/cli/src/diagnostics/evaluation.ts`、`evaluation-metrics.ts` 与 JSON/JSONL/text rendering。
- 影响数据：在 `tests/evaluation/` 或 diagnostics-owned fixture 位置新增 scorecard/rubric catalog。
- 影响 checks：现有 lint/typecheck/test/boundary 输出成为 evidence inputs；v1 可以先使用 deterministic static evidence，并在自动证据尚不可得时明确输出 `not_assessed`。
- 预计无 breaking changes；现有 `diagnostics evaluate` 输出保持向后兼容，只新增 additive fields。
