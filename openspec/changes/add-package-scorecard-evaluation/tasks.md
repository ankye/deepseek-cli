## 1. Contracts And Data Model / 契约与数据模型

- [x] 1.1 Add package scorecard status, criterion result, package summary, catalog, hard-gate, and platform aggregate types under `@deepseek/platform-contracts`.
- [x] 1.2 Export the new package scorecard contracts from `src/packages/platform-contracts/src/index.ts`.
- [x] 1.3 Add unit tests or contract tests that verify scorecard DTO shape, redaction metadata, and backward-compatible evaluation summary serialization.

## 2. Rubric Catalog And Scoring Math / Rubric 目录与评分计算

- [x] 2.1 Add a first-version package scorecard catalog with shared criteria for all `src/packages/*` packages.
- [x] 2.2 Add role-specific rubric entries for `platform-contracts`, `model-gateway`, and `runtime`.
- [x] 2.3 Implement deterministic scoring helpers for weighted score, strict pass rate, assessment coverage, readiness status, and platform aggregate.
- [x] 2.4 Add scoring tests for `pass`, `partial`, `fail`, `not_assessed`, `not_applicable`, weights, and hard-gate override behavior.

## 3. Package Evidence Collection / 包证据收集

- [x] 3.1 Implement deterministic package discovery from workspace package manifests under `src/packages/*`.
- [x] 3.2 Collect shared evidence from package manifests, public exports, lint-framework boundary signals, typecheck/lint/test availability, and static secret/host API scans.
- [x] 3.3 Collect role-specific evidence for `platform-contracts`, `model-gateway`, and `runtime` using existing tests, package imports, and architecture lint rules.
- [x] 3.4 Emit `not_assessed` diagnostics when a criterion has no deterministic evidence in v1 instead of guessing.

## 4. Diagnostics Evaluation Integration / Diagnostics Evaluation 集成

- [x] 4.1 Extend `CliEvaluationComparisonSummary` with additive package scorecard fields.
- [x] 4.2 Integrate package scorecard collection into `diagnostics evaluate` without changing existing task-run outcome behavior.
- [x] 4.3 Add JSON and JSONL records for package scorecards, criterion results, hard gates, and platform aggregate.
- [x] 4.4 Render concise text output that shows package readiness counts, average score, coverage, and failing hard gates.

## 5. Release Advisory Integration / Release Advisory 集成

- [x] 5.1 Add optional release diagnostics advisory output for package scorecard evidence when available.
- [x] 5.2 Ensure missing package scorecard evidence does not fail or warn release diagnostics unless package scorecard advisory mode is explicitly requested.
- [x] 5.3 Preserve existing publish dry-run guidance, build artifact status, acceptance evidence status, and package surface status in release output.

## 6. Tests And Acceptance / 测试与验收

- [x] 6.1 Add CLI tests for `diagnostics evaluate --full --dry-run --output json` including package scorecard planning fields.
- [x] 6.2 Add CLI tests for executed or deterministic scorecard output including all discovered packages.
- [x] 6.3 Add tests that hard-gate failures force package readiness `fail` even when weighted score is high.
- [x] 6.4 Add tests that `not_assessed` lowers assessment coverage without being counted as a pass.
- [x] 6.5 Add release diagnostics tests proving package scorecards are advisory in v1.
- [x] 6.6 Run `openspec validate add-package-scorecard-evaluation --strict`.
- [x] 6.7 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.

## 7. Strict Objective Score Calibration / 严格客观分校准

- [x] 7.1 Change score math so `partial`, `fail`, and `not_assessed` receive zero credit by default.
- [x] 7.2 Add objective score and rubric coverage fields so headline package scores penalize undefined or missing role standards.
- [x] 7.3 Update diagnostics text and JSON tests to show objective score instead of optimistic quality-only score.

## 8. Live Tool Coverage Calibration / 真实工具覆盖校准

- [x] 8.1 Add live model/tool coverage criteria for `core-coding-tools` and `tool-intent-preflight`.
- [x] 8.2 Add an opt-in DeepSeek live tool coverage script that records per-tool model call, preflight, kernel execution, and feedback continuation evidence.
- [x] 8.3 Expand DeepSeek tool intent aliases so every core tool family can pass preflight from model-safe function names.
- [x] 8.4 Record live coverage evidence under `tests/acceptance/latest/live-tool-coverage.json` and verify tool packages reach at least 90% only after live coverage exists.
