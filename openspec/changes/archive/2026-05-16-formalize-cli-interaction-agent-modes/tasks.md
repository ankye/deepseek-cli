## 1. Contracts And Schemas / 契约与 Schema

- [x] 1.1 Add `src/packages/platform-contracts/src/interaction-mode.ts` with interaction mode names, transition DTOs, mode status, degradation reasons, command visibility metadata, and redaction/compatibility metadata.
- [x] 1.2 Add `src/packages/platform-contracts/src/agent-mode.ts` with agent mode names, phase plan DTOs, loop budget DTOs, work order DTOs, worker lifecycle/result DTOs, verifier verdict DTOs, and provider reasoning effort mapping DTOs.
- [x] 1.3 Export new interaction/agent mode contracts from `src/packages/platform-contracts/src/index.ts` without importing implementation, Node, provider, CLI, or testing packages.
- [x] 1.4 Extend runtime event kind contracts with mode transition, phase plan, phase skipped, worker launched, worker continued, worker stopped, worker result, verifier verdict, reasoning effort mapped, and loop budget consumed events.
- [x] 1.5 Extend session metadata contracts with persisted interaction mode, agent mode, phase summary, delegation lineage, and provider reasoning effort fields.
- [x] 1.6 Extend model contracts to normalize DeepSeek-compatible effort values including provider values such as `high` and `max`, while preserving current low/medium/high compatibility.
- [x] 1.7 Add schema/versioning tests for interaction mode DTOs, agent mode DTOs, work orders, worker results, verifier verdicts, loop budgets, and reasoning effort normalization.

## 2. Agent Management / Agent 管理

- [x] 2.1 Extend `AgentDefinition` and `AgentInstance` with supported agent modes, product role, lifecycle state, mode binding, delegation metadata, and compatibility metadata.
- [x] 2.2 Update `InMemoryAgentManager` validation to reject unsupported mode selection, invalid scope declarations, and incomplete delegation metadata.
- [x] 2.3 Add lifecycle APIs or result DTO helpers for spawn, continue, stop, resume, complete, fail, and dispose without coupling agent-management to runtime implementation.
- [x] 2.4 Implement mode-aware scope projection helpers for planner/research, implementer, verifier, coordinator, worker, repair, and synthesis modes.
- [x] 2.5 Add contract tests for agent mode validation, unsupported mode rejection, delegated lineage, continuation linkage, and verifier scope projection.

## 3. Runtime Orchestration / Runtime 编排

- [x] 3.1 Add runtime modules under `src/packages/runtime/src/modes/` for phase planning, mode state, loop budgets, delegation policy, verifier policy, and reasoning effort mapping.
- [x] 3.2 Wire mode status and phase-plan emission into `runAgentLoop` without changing default single-agent behavior when orchestration is disabled.
- [x] 3.3 Emit evidence, verification, repair, delegation, synthesis, and skip summaries in terminal events.
- [x] 3.4 Separate model reasoning effort policy from external evidence/verification/repair/delegation loop budgets in runtime request handling and event summaries.
- [x] 3.5 Add high-risk and simple-task phase classifiers that can record required phases or typed skip reasons.
- [x] 3.6 Route worker launch through agent-management, session lineage, policy, tool projection, and runtime events before child loop creation.
- [x] 3.7 Return worker completion through typed worker-result events instead of raw child transcript text.
- [x] 3.8 Add runtime tests for simple single-agent skip, fact-sensitive evidence phase, non-trivial verification requirement, loop budget recording, and provider reasoning effort separation.

## 4. Prompt Assembly / Prompt 组装

- [x] 4.1 Add prompt assembly sections for interaction mode, agent mode, phase plan, loop budget, work order, verifier expectations, and reasoning effort policy.
- [x] 4.2 Ensure worker work orders are self-contained and include original user goal, purpose, evidence ids, typed targets, allowed tools, done criteria, verification expectations, parent lineage, and redaction metadata.
- [x] 4.3 Add prompt assembly validation that rejects lazy delegation phrases such as relying on prior findings without structured context.
- [x] 4.4 Preserve exact user prompt boundaries while injecting runtime-owned mode/work-order sections.
- [x] 4.5 Add deterministic prompt assembly tests for mode section ordering, budget summaries, work-order completeness, lazy-delegation rejection, and provider effort mapping.

## 5. Agent Spawn, Continue, Stop / Agent 启动、继续、停止

- [x] 5.1 Extend `AgentSpawnRequest` and `AgentSpawnResult` with structured work order id, agent mode, parent/child lineage, tool/context scopes, result provenance, usage summary, and verifier status.
- [x] 5.2 Update `core.agent.spawn` to require or synthesize structured work orders and to return bounded structured result evidence.
- [x] 5.3 Add `agent.continue` and `agent.stop` contract/tool surfaces or equivalent governed runtime controls with typed lifecycle events.
- [x] 5.4 Add continue-vs-spawn decision records with context-overlap evidence and reason codes.
- [x] 5.5 Add stop-and-continue behavior for wrong-direction workers while preserving lineage and prior stopped state.
- [x] 5.6 Add tests for spawn with read-only scope, implementer write scope, verifier fresh context, continue after failure, stop after user requirement change, and lazy delegation rejection.

## 6. CLI Host And Local Controls / CLI Host 与本地控制

- [x] 6.1 Extend CLI parse/types with scriptable mode and agent status commands without making CLI host own orchestration logic.
- [x] 6.2 Add chat local controls `/mode`, `/agent`, `/workers`, `/verify`, and `/plan` as local command/action results that never go to the model.
- [x] 6.3 Render concise text markers for evidence, plan, worker, verify, repair, and synthesis phases while keeping JSONL structurally complete.
- [x] 6.4 Extend `/model` output to show provider reasoning/thinking support, requested effort, provider-mapped effort, and disabled reason separately from evidence/verification counts.
- [x] 6.5 Add mode-aware command visibility metadata for local, remote/bridge, headless, approval, result-list, and degraded profiles.
- [x] 6.6 Add CLI tests proving unknown `/mode`/`/agent` controls stay local, unsupported transitions preserve prior mode, JSONL emits mode events, and no ANSI leaks into structured output.

## 7. Session Resume/Fork / 会话恢复与分叉

- [x] 7.1 Persist interaction mode, agent mode, phase summary, loop budgets, delegation lineage, worker lifecycle, verifier verdict, and reasoning effort metadata through session events.
- [x] 7.2 Restore mode state from session metadata during resume without reading or mutating process environment variables.
- [x] 7.3 Add degradation events when a resumed mode is unsupported by the current host or terminal profile.
- [x] 7.4 Extend fork-lite output with mode fork point, phase summary, active worker inheritance policy, and delegation lineage.
- [x] 7.5 Add resume/fork tests for mode restoration, unsupported mode degradation, active worker detachment, and replayable loop budget metadata.

## 8. Verification And Repair Integration / 验证与修复集成

- [x] 8.1 Integrate verifier mode with existing self-repair and evidence-first changes so verification failures can enter governed repair when safe.
- [x] 8.2 Require verifier verdict evidence for non-trivial task success or record typed skip reasons.
- [x] 8.3 Add verifier result reconciliation so parent/coordinator reports pass, fail, or partial without overstating worker claims.
- [x] 8.4 Add repair-aware mode events that connect failure classification, repair attempts, verification reruns, and final terminal status.
- [x] 8.5 Add tests for missing verification partial result, verifier fail then repair, verifier partial reporting, and parent reconciliation correctness.

## 9. Diagnostics And Evaluation / 诊断与评估

- [x] 9.1 Extend diagnostics output with interaction mode matrix, agent mode matrix, implemented surfaces, disabled/planned modes, missing acceptance evidence, and next tasks.
- [x] 9.2 Extend task-completion evaluation records with phase usage, loop budgets, worker fan-out, over-delegation flags, verifier quality, repair quality, reasoning effort, provider-mapped effort, and unavailable/inferred baseline metrics.
- [x] 9.3 Update competitive report handling so Codex/Claude baseline metrics are separated when instrumentation is unavailable.
- [x] 9.4 Add scoring rules that prevent high reasoning effort from counting as evidence or verification proof.
- [x] 9.5 Add diagnostics/evaluation tests for mode matrix, provider effort mapping, over-delegation penalty, independent verification credit, and baseline unavailable handling.

## 10. Regression, Golden, And Acceptance / 回归、Golden 与验收

- [x] 10.1 Add golden traces for mode transition ordering, fact-sensitive evidence before model dispatch, implementation before verification, verifier before final success, and worker result events.
- [x] 10.2 Add adversarial fixtures for mode mismatch, lazy delegation, over-delegation, missing verification, unsafe scratchpad, worker raw-output-as-user-prompt, and unsupported reasoning effort.
- [x] 10.3 Extend terminal matrix tests for CI, redirected JSONL, no-color, Windows PowerShell-like, macOS Terminal-like, and Linux Terminal-like profiles.
- [x] 10.4 Add contract tests proving scratchpad/checkpoint governance records fingerprints, scopes, and lineage without raw secrets or unbounded content.
- [x] 10.5 Update acceptance evidence index once mode/agent orchestration checks land.
- [x] 10.6 Run `openspec validate formalize-cli-interaction-agent-modes --strict`.
- [x] 10.7 Run relevant verification commands: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/check-boundaries.mjs`, and targeted golden/e2e suites after implementation begins.

## 11. Documentation And Rollout / 文档与发布

- [x] 11.1 Update CLI README with concise mode, agent, verifier, reasoning effort, and loop budget concepts once implemented.
- [x] 11.2 Update product route/completion matrix to show complete, partial, planned, disabled, and unsupported states for each interaction and agent mode.
- [x] 11.3 Document that reasoning effort is a model/provider parameter, while evidence/verification/repair/delegation loop budgets are product orchestration parameters.
- [x] 11.4 Gate coordinator/verifier defaults behind explicit config until deterministic tests and evaluation evidence prove lower correction cost than single-agent mode.
- [x] 11.5 Define rollout criteria for enabling mode-aware orchestration by default for non-trivial CLI tasks.
