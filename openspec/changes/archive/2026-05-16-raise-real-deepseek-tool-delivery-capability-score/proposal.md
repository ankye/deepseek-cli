## Why

The 64-family tool catalog is implemented, but the strict real-delivery capability score still reflects the truth: current DeepSeek live evidence proves only 18 of 64 families, and no family has enough complete live task, safety, and provider-native evidence to pass the current parity matrix. The target is to raise the real `toolFamilyParityMatrix.deliveryCapabilityScore` to at least `0.9` without changing scoring rules or treating fake/replay evidence as product delivery proof.

64-family 工具目录已经实现，但严格真实交付分仍然反映现实：当前 DeepSeek live 证据只证明了 64 个 family 中的 18 个，而且还没有 family 具备足够完整的 live task、safety 与 provider-native 证据来通过当前 parity matrix。目标是在不修改评分规则、不把 fake/replay 证据当作产品交付证明的前提下，把真实 `toolFamilyParityMatrix.deliveryCapabilityScore` 提升到至少 `0.9`。

## Current Result

The implemented tool-family change now records `deliveryCapabilityScore = 1`, `deliveryCapabilityPassedFamilyCount = 64`, `fakeCoveredFamilyCount = 0`, and `replayedCoveredFamilyCount = 0` in `tests/acceptance/latest/tool-family-delivery-capability-score.json`. Package scorecards now expose package-level `deliveryCapabilityScore` fields and the package aggregate is `1`, with 29 of 29 packages passing the `0.9` delivery target. DeepSeek live task-completion evaluation now runs all 9 catalog tasks with `--execute-task all --live`, and all 9 are `solved`. The overall delivery capability score uses the explicit unfinished-target penalty requested for interaction readiness, package readiness, and task-completion readiness: each unfinished target deducts `0.1`. Current evidence has 0 unfinished targets across 122 total targets, so the current overall score is `1 = max(0, 1 - 0 * 0.1)` and passes. The live family coverage evidence records 128 audited DeepSeek HTTP requests, all completed with HTTP 200. Live provider, live agent loop, live agent tool loop, live CLI `run --live`, and live `doctor --live` smoke evidence now also prove workspace `.env` credentials reach the model gateway without leaking raw tokens.

当前工具 family 实现已在 `tests/acceptance/latest/tool-family-delivery-capability-score.json` 记录 `deliveryCapabilityScore = 1`、`deliveryCapabilityPassedFamilyCount = 64`、`fakeCoveredFamilyCount = 0` 与 `replayedCoveredFamilyCount = 0`。Package scorecards 现在暴露 package 级 `deliveryCapabilityScore` 字段，package 聚合分为 `1`，29 个 package 全部通过 `0.9` 交付门槛。DeepSeek live task-completion evaluation 现在通过 `--execute-task all --live` 执行全部 9 个 catalog tasks，9 个全部为 `solved`。整体交付能力分使用为交互就绪、package 就绪与 task-completion 就绪明确指定的未完成项扣分：每个 unfinished target 扣 `0.1`。当前证据在 122 个 total targets 中有 0 个 unfinished targets，所以当前整体分是 `1 = max(0, 1 - 0 * 0.1)`，并通过。真实 family coverage 证据记录了 128 次可审计 DeepSeek HTTP 请求，全部以 HTTP 200 完成。live provider、live agent loop、live agent tool loop、live CLI `run --live` 与 live `doctor --live` smoke 证据也已证明 workspace `.env` 凭证能到达 model gateway，且不会泄漏 raw token。

## What Changes

- Expand opt-in DeepSeek live family coverage from the current 20-tool/18-family subset to at least 58 complete family passes out of 64.
- 将显式开启的 DeepSeek live family coverage 从当前 20 个 tool / 18 个 family 子集扩展到至少 64 个 family 中 58 个完整通过。
- Preserve the strict scoring rules: `fake`, `replayed`, `planned`, `absent`, `unavailable`, `partial`, and `not_assessed` remain zero-credit for real delivery.
- 保留严格评分规则：`fake`、`replayed`、`planned`、`absent`、`unavailable`、`partial` 与 `not_assessed` 对真实交付仍然零分。
- Add real live coverage scenarios that prove model selection, preflight, policy, runtime execution, feedback continuation, representative task outcome, and safety outcome for each covered family.
- 增加真实 live coverage 场景，逐 family 证明 model selection、preflight、policy、runtime execution、feedback continuation、representative task outcome 与 safety outcome。
- Add real provider/native evidence for enough provider or connector families to reach the `>=0.9` delivery capability threshold without waiving provider-native requirements.
- 为足够多的 provider 或 connector families 增加真实 provider/native 证据，使交付能力分数达到 `>=0.9`，且不豁免 provider-native 要求。
- Keep fake-first replay evidence available as local regression evidence, but separate it from real DeepSeek delivery scoring and reporting.
- 保留 fake-first replay evidence 作为本地回归证据，但将其与真实 DeepSeek 交付评分和报告分离。
- Report the overall delivery capability score separately from the tool-family, mode, package, and evaluation-task delivery scores, and block `1.0` until every delivery target, including package scorecards, mode matrix entries, and task-completion runs, is complete.
- 将整体交付能力分与工具 family、mode、package 与 evaluation-task 交付分分开报告；在包括 package scorecard、mode matrix entry 与 task-completion run 在内的所有交付目标完成前，整体分不得为 `1.0`。
- Save DeepSeek streaming response chunks into a replay-only cache for regression runs, and ensure replay output never refreshes live delivery score evidence.
- 将 DeepSeek streaming response chunks 保存为仅供 replay 的缓存，用于回归运行，并确保 replay output 永远不刷新真实 live 交付分证据。

## Capabilities

### Modified Capabilities

- `tool-family-scorecards`: Requires the existing strict matrix to stay unchanged while real live evidence is added until delivery capability score reaches `>=0.9`.
- `tool-family-scorecards`：要求保持现有严格矩阵不变，通过增加真实 live 证据使 delivery capability score 达到 `>=0.9`。
- `cli-task-completion-evaluation`: Must render real DeepSeek family coverage separately from fake/replay coverage and expose the current delivery capability score, denominator, and blocking layers.
- `cli-task-completion-evaluation`：必须将真实 DeepSeek family coverage 与 fake/replay coverage 分开渲染，并暴露当前 delivery capability score、分母与阻塞层。
- `testing-regression`: Must keep deterministic fake/replay coverage, but tests must assert it does not inflate the real delivery capability score.
- `testing-regression`：必须保留确定性 fake/replay coverage，但测试必须断言它不会抬高真实交付能力分数。

## Impact

- Affected packages: `src/apps/cli`, `src/packages/core-coding-tools`, `src/packages/runtime`, `src/packages/model-gateway`, `src/packages/mcp-gateway`, `src/packages/testing-regression`, and connector/provider owner packages for browser, web, MCP, image, and design families.
- 影响包：`src/apps/cli`、`src/packages/core-coding-tools`、`src/packages/runtime`、`src/packages/model-gateway`、`src/packages/mcp-gateway`、`src/packages/testing-regression`，以及 browser、web、MCP、image、design families 的 connector/provider owner packages。
- Affected evidence: `tests/acceptance/latest/live-tool-coverage.json`, new or expanded real family coverage evidence, diagnostics evaluate JSON/JSONL/text output, and acceptance evidence index.
- 影响证据：`tests/acceptance/latest/live-tool-coverage.json`、新增或扩展的 real family coverage evidence、diagnostics evaluate JSON/JSONL/text output 与 acceptance evidence index。
- Live execution remains opt-in and must require explicit credentials/environment flags.
- Live execution 仍然是显式开启，并且必须要求明确的凭证/环境开关。
