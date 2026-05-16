## 1. Baseline And Guardrails

- [x] 1.1 Capture the current strict baseline from `deepseek diagnostics evaluate --full --dry-run --output json`: delivery capability score, passed families, live-covered families, task-covered families, safety-covered families, and provider-native families. / 捕获当前严格基线：delivery capability score、passed families、live-covered families、task-covered families、safety-covered families 与 provider-native families。
- [x] 1.2 Add tests proving fake/replay evidence does not increase the real delivery capability score or pass count. / 增加测试，证明 fake/replay evidence 不会提高真实交付能力分数或 pass count。
- [x] 1.3 Add diagnostics output that clearly separates real DeepSeek live evidence from fake/replay regression evidence. / 增加 diagnostics 输出，清楚区分真实 DeepSeek live evidence 与 fake/replay regression evidence。

## 2. Live Family Coverage Evidence

- [x] 2.1 Extend the live coverage evidence schema so each family records model selection, preflight, policy, execution, feedback continuation, task outcome, safety outcome, and provider-native status. / 扩展 live coverage evidence schema，使每个 family 记录 model selection、preflight、policy、execution、feedback continuation、task outcome、safety outcome 与 provider-native status。
- [x] 2.2 Expand `scripts/run-live-tool-coverage.ts` or add a successor runner that targets families, not only the current 20 core tools. / 扩展 `scripts/run-live-tool-coverage.ts` 或新增后继 runner，使其面向 family，而不只覆盖当前 20 个 core tools。
- [x] 2.3 Write real family coverage evidence under `tests/acceptance/latest/` with redaction, model metadata, prompt digests, and bounded previews. / 在 `tests/acceptance/latest/` 写入真实 family coverage evidence，包含脱敏、model metadata、prompt digests 与有界 previews。

## 3. Family Batch Execution

- [x] 3.1 Cover local built-in workspace, search, mutation, shell, git/build, planning, agent, memory, context, session, remote, scheduling, and observability families with complete live DeepSeek paths. / 用完整 live DeepSeek 链路覆盖本地内置 workspace、search、mutation、shell、git/build、planning、agent、memory、context、session、remote、scheduling 与 observability families。
- [x] 3.2 Cover web/public-data families with real provider evidence or keep them explicitly failing with provider-native blockers. / 用真实 provider evidence 覆盖 web/public-data families，或以 provider-native blocker 明确保持失败。
- [x] 3.3 Cover MCP/browser/design connector families with real connector evidence or keep them explicitly failing with connector/provider blockers. / 用真实 connector evidence 覆盖 MCP/browser/design connector families，或以 connector/provider blocker 明确保持失败。
- [x] 3.4 Cover image/media families with real provider evidence or keep them explicitly failing with provider-native blockers. / 用真实 provider evidence 覆盖 image/media families，或以 provider-native blocker 明确保持失败。

## 4. Scoring Acceptance

- [x] 4.1 Ensure at least 58 of 64 families pass the existing strict scorecard without changing score math. / 在不修改 score math 的前提下，确保至少 64 个 family 中的 58 个通过现有严格 scorecard。
- [x] 4.2 Ensure `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9` in the real DeepSeek coverage report. / 确保真实 DeepSeek coverage report 中 `toolFamilyParityMatrix.deliveryCapabilityScore >= 0.9`。
- [x] 4.3 Record remaining non-passing families with exact blocking layers and next actions. / 记录剩余未通过 families 的准确阻塞层与下一步动作。
- [x] 4.4 Separate the overall delivery capability score from the tool-family score, and keep the overall gate blocked while mode matrix targets are incomplete. / 将整体交付能力分与工具 family 分拆开，并在 mode matrix 目标未完成时保持整体 gate blocked。
- [x] 4.5 Persist DeepSeek provider responses as replay-only regression fixtures and verify `--replay` without counting replay as live delivery evidence. / 将 DeepSeek provider responses 持久化为仅 replay 的回归 fixture，并验证 `--replay`，但不把 replay 计为真实 live 交付证据。
- [x] 4.6 Complete the eight remaining mode blockers so the mode matrix has zero unfinished targets. / 完成剩余 8 个 mode blocker，使 mode matrix 的 unfinished targets 为 0。
- [x] 4.7 Expose package-level delivery capability scores and include package blockers in the overall unfinished-target penalty. / 暴露 package 级交付能力分，并将 package blockers 纳入整体 unfinished-target 扣分。
- [x] 4.8 Include evaluation task runs in the overall unfinished-target penalty and complete all 9 live DeepSeek task runs. / 将 evaluation task run 纳入整体 unfinished-target 扣分，并完成全部 9 个 live DeepSeek task run。

## 5. Verification

- [x] 5.1 Run `openspec validate raise-real-deepseek-tool-delivery-capability-score --strict`. / 运行 OpenSpec strict validation。
- [x] 5.2 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`. / 运行 typecheck、lint、test 与 boundary checks。
- [x] 5.3 Run the opt-in live DeepSeek family coverage command and save redacted evidence. / 运行显式开启的 live DeepSeek family coverage 命令并保存脱敏证据。
- [x] 5.4 Run `deepseek diagnostics evaluate --full --execute-task all --live --output json` or the final equivalent command and save the delivery capability score evidence. / 运行最终评估命令并保存 delivery capability score 证据。
- [x] 5.5 Run live provider, live agent loop, live agent tool loop, live CLI `run --live`, and live `doctor --live` smoke checks with workspace `.env` credentials, then save redacted evidence. / 使用 workspace `.env` 凭证运行 live provider、live agent loop、live agent tool loop、live CLI `run --live` 与 live `doctor --live` smoke 检查，并保存脱敏证据。
