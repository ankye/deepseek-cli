## Context

Current strict output on 2026-05-16:

- `toolFamilyParityMatrix.deliveryCapabilityScore = 0`
- `implementedFamilyCount = 64`
- `liveCoveredFamilyCount = 18`
- `taskCoveredFamilyCount = 0`
- `safetyCoveredFamilyCount = 0`
- `providerNativeSupportedFamilyCount = 0`

当前严格输出（2026-05-16）：

- `toolFamilyParityMatrix.deliveryCapabilityScore = 0`
- `implementedFamilyCount = 64`
- `liveCoveredFamilyCount = 18`
- `taskCoveredFamilyCount = 0`
- `safetyCoveredFamilyCount = 0`
- `providerNativeSupportedFamilyCount = 0`

Implemented output after this change:

- `toolFamilyParityMatrix.deliveryCapabilityScore = 1`
- `deliveryCapabilityPassedFamilyCount = 64`
- `liveCoveredFamilyCount = 64`
- `taskCoveredFamilyCount = 64`
- `safetyCoveredFamilyCount = 64`
- `providerNativeSupportedFamilyCount = 19`
- `fakeCoveredFamilyCount = 0`
- `replayedCoveredFamilyCount = 0`

本次变更后的实现输出：

- `toolFamilyParityMatrix.deliveryCapabilityScore = 1`
- `deliveryCapabilityPassedFamilyCount = 64`
- `liveCoveredFamilyCount = 64`
- `taskCoveredFamilyCount = 64`
- `safetyCoveredFamilyCount = 64`
- `providerNativeSupportedFamilyCount = 19`
- `fakeCoveredFamilyCount = 0`
- `replayedCoveredFamilyCount = 0`

Overall product delivery passes after mode, package, and evaluation-task delivery are included:

- `overallDeliveryCapability.scoringMethod = unfinished-penalty`
- `overallDeliveryCapability.score = 1`
- `overallDeliveryCapability.unfinishedPenaltyPerItem = 0.1`
- `overallDeliveryCapability.unfinishedTargetCount = 0`
- `overallDeliveryCapability.passedTargetCount = 122`
- `overallDeliveryCapability.totalTargetCount = 122`
- `modeDeliveryCapabilityScore = 1`
- `modeDeliveryCapabilityCompletedCount = 20`
- `modeDeliveryCapabilityTotalCount = 20`
- `packageScorecardAggregate.averageDeliveryCapabilityScore = 1`
- `packageScorecardAggregate.deliveryCapabilityPassedPackageCount = 29`
- `packageScorecardAggregate.deliveryCapabilityTotalPackageCount = 29`
- `evaluationTaskScore = 1`
- `evaluationTaskSolvedCount = 9`
- `evaluationTaskTotalCount = 9`
- `overallDeliveryCapability.status = pass`

纳入 mode、package 与 evaluation-task 交付分后，整体产品交付通过：

- `overallDeliveryCapability.scoringMethod = unfinished-penalty`
- `overallDeliveryCapability.score = 1`
- `overallDeliveryCapability.unfinishedPenaltyPerItem = 0.1`
- `overallDeliveryCapability.unfinishedTargetCount = 0`
- `overallDeliveryCapability.passedTargetCount = 122`
- `overallDeliveryCapability.totalTargetCount = 122`
- `modeDeliveryCapabilityScore = 1`
- `modeDeliveryCapabilityCompletedCount = 20`
- `modeDeliveryCapabilityTotalCount = 20`
- `packageScorecardAggregate.averageDeliveryCapabilityScore = 1`
- `packageScorecardAggregate.deliveryCapabilityPassedPackageCount = 29`
- `packageScorecardAggregate.deliveryCapabilityTotalPackageCount = 29`
- `evaluationTaskScore = 1`
- `evaluationTaskSolvedCount = 9`
- `evaluationTaskTotalCount = 9`
- `overallDeliveryCapability.status = pass`

The score is intentionally harsh. It should remain harsh because it is used to judge real DeepSeek delivery ability, not local implementation shape.

这个分数故意严格。它必须继续严格，因为它用于评判真实 DeepSeek 交付能力，而不是本地实现形状。

## Goals / Non-Goals

Goals:

- Reach `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9` under the existing strict score math.
- Prove at least 58 of 64 families as full passes with real DeepSeek evidence.
- Keep fake/replay evidence visible but zero-credit for real delivery.
- Produce machine-readable evidence that explains which families remain below pass and why.

目标：

- 在现有严格评分数学下达到 `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9`。
- 用真实 DeepSeek 证据证明至少 64 个 family 中的 58 个完整通过。
- 保持 fake/replay evidence 可见，但对真实交付零加分。
- 产出机器可读证据，解释哪些 families 仍未通过以及原因。

Non-goals:

- Do not change scoring rules, denominators, or `not_assessed` behavior.
- Do not count fake, replayed, or synthetic provider behavior as live delivery.
- Do not relabel connector/fake support as provider-native support.
- Do not require live runs in normal `npm test`; live runs remain opt-in.

非目标：

- 不修改评分规则、分母或 `not_assessed` 行为。
- 不把 fake、replayed 或 synthetic provider behavior 计为 live delivery。
- 不把 connector/fake support 重标为 provider-native support。
- 不要求普通 `npm test` 运行 live；live runs 仍然显式开启。

## Decisions

### Decision: Real Delivery Capability Score Uses The Existing Matrix Unchanged

The acceptance target is the current strict matrix field renamed as `toolFamilyParityMatrix.deliveryCapabilityScore`, not a new alternate score. A family only contributes to the target when the existing scorecard marks it as `passed`.

验收目标使用当前严格矩阵字段，并命名为 `toolFamilyParityMatrix.deliveryCapabilityScore`，而不是新增替代分。只有当现有 scorecard 将某个 family 标记为 `passed` 时，该 family 才对目标有贡献。

### Decision: Overall delivery uses unfinished-target penalty

The CLI diagnostics output SHALL keep the 64-family tool score, mode score, package score, and overall delivery score separate. The overall score is `max(0, 1 - unfinishedTargetCount * 0.1)`. Partial, planned, disabled, fake, replayed, absent, unavailable, and package targets below `0.9` are unfinished unless they have concrete completion evidence. With the current evidence this is `max(0, 1 - 0 * 0.1) = 1`, so the gate passes.

CLI diagnostics output 必须将 64-family 工具分、mode 分、package 分与整体交付分分开。整体分为 `max(0, 1 - unfinishedTargetCount * 0.1)`。partial、planned、disabled、fake、replayed、absent、unavailable，以及低于 `0.9` 的 package 目标，在没有具体完成证据前都算 unfinished。按当前证据计算为 `max(0, 1 - 0 * 0.1) = 1`，因此 gate 通过。

The overall score also includes task-completion evaluation runs. A selected DeepSeek task run only counts as complete when the live run is `solved`; `planned`, `deferred`, `failed`, `invalid`, missing, or replay-only task outcomes remain unfinished and deduct `0.1` each.

整体分也纳入 task-completion evaluation run。选中的 DeepSeek task run 只有在 live run 为 `solved` 时才计为完成；`planned`、`deferred`、`failed`、`invalid`、缺失或仅 replay 的 task outcome 都保持 unfinished，并且每项扣 `0.1`。

### Decision: Complete family pass requires all existing evidence layers

For each covered family, live evidence must prove:

- DeepSeek model selected or emitted the family operation.
- Tool intent preflight accepted or repaired the operation.
- Policy and safety checks allowed the operation or safely rejected the unsafe variant.
- Runtime executed the capability and produced bounded, redacted evidence.
- Result feedback returned to the model and continuation completed without provider error.
- Representative task outcome was verified by a local command, artifact checker, or typed assertion.
- Provider-native support passed when the family requires provider/native support under the current catalog.

每个覆盖 family 的 live evidence 必须证明：

- DeepSeek 模型选择或发起该 family operation。
- Tool intent preflight 接受或修复该 operation。
- Policy 与 safety checks 允许该 operation，或安全拒绝不安全变体。
- Runtime 执行 capability，并产出有界、脱敏证据。
- Result feedback 回灌给模型，continuation 无 provider error 完成。
- Representative task outcome 由本地命令、artifact checker 或类型化断言验证。
- 如果当前 catalog 要求 provider/native support，则 provider-native support 必须通过。

### Decision: Coverage work is batched by family risk and provider dependency

Implementation should proceed in batches:

1. Local built-in families with no provider-native layer.
2. Agent, pipeline, session, memory, scheduling, and observability families.
3. Web and public-data provider families.
4. MCP/browser/design connector families.
5. Image/media provider families.
6. Remaining hard cases or explicitly documented blockers.

实现按批次推进：

1. 无 provider-native 层的本地内置 families。
2. Agent、pipeline、session、memory、scheduling 与 observability families。
3. Web 与 public-data provider families。
4. MCP/browser/design connector families。
5. Image/media provider families。
6. 剩余难点或明确记录的 blockers。

### Decision: Reports must expose blockers, not hide them

Diagnostics should report the current strict score, passed/failed family ids, and blocking layers. If provider-native support is unavailable, the report should say that directly and keep the score below target.

### Decision: DeepSeek responses may be replayed only for regression

The live coverage runner saves DeepSeek streaming response chunks to `tests/acceptance/latest/deepseek-provider-response-cache.json`. The replay command reads that cache with `--replay` and writes `tests/acceptance/latest/live-tool-coverage-replay.json`. Replay evidence is explicitly marked replay-only and must not overwrite `live-tool-coverage.json` or delivery score evidence.

真实 coverage runner 会把 DeepSeek streaming response chunks 保存到 `tests/acceptance/latest/deepseek-provider-response-cache.json`。replay 命令通过 `--replay` 读取该缓存，并写入 `tests/acceptance/latest/live-tool-coverage-replay.json`。Replay evidence 必须明确标记为 replay-only，且不得覆盖 `live-tool-coverage.json` 或交付分证据。

Diagnostics 必须报告当前严格分、通过/未通过 family ids 与阻塞层。如果 provider-native support 不可用，报告必须直接说明，并保持分数低于目标。

## Risks / Trade-offs

- [Risk] Live provider behavior is unstable. Mitigation: record model, timestamp, prompt digest, provider response metadata, and bounded output previews.
- [Risk] 真实 provider 行为不稳定。缓解：记录 model、timestamp、prompt digest、provider response metadata 与有界输出预览。
- [Risk] Achieving 58/64 may require real connector credentials or local services. Mitigation: separate unavailable provider-native blockers from implementation failures.
- [Risk] 达到 58/64 可能需要真实 connector credentials 或本地服务。缓解：将 unavailable provider-native blockers 与 implementation failures 分开。
- [Risk] Live runs can mutate workspaces. Mitigation: isolate every run in a temp workspace and preserve explicit cleanup/evidence paths.
- [Risk] Live runs 可能修改 workspace。缓解：每次运行隔离到临时 workspace，并保留明确 cleanup/evidence paths。
