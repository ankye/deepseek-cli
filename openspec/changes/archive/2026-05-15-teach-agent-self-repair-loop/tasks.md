## 1. Contracts And Schema

- [x] 1.1 Add `src/packages/platform-contracts/src/self-repair.ts` with repair failure source/status types, repairability, safety class, affected scope, attempt ids, verification summaries, stop reasons, and redaction metadata.
- [x] 1.2 Export self-repair contracts from `src/packages/platform-contracts/src/index.ts` without importing implementation, Node, provider, CLI, or testing packages.
- [x] 1.3 Extend runtime event kind contracts to include `agent.repair.started`, `agent.repair.classified`, `agent.repair.plan.created`, `agent.repair.attempt.started`, `agent.repair.attempt.completed`, `agent.repair.verification.started`, `agent.repair.verification.completed`, and `agent.repair.stopped`.
- [x] 1.4 Extend `AgentLoopLimits`, `AgentLoopRequest`, and `AgentLoopSummary` with optional self-repair configuration and outcome summaries while preserving backward compatibility.
- [x] 1.5 Add contract and schema-version tests for self-repair DTO serialization, stable ids, compatibility metadata, and redaction metadata.

## 2. Runtime Decision Modules

- [x] 2.1 Add runtime self-repair module structure under `src/packages/runtime/src/self-repair/` for classifier, policy, planner, verifier, recorder, and shared helpers.
- [x] 2.2 Implement deterministic failure classification for provider, tool, workspace, build/test, task-output, and agent-strategy failures.
- [x] 2.3 Implement repair policy gates for repairability, safety class, tool projection, attempt budget, model/tool/time budget, repeated no-op detection, checkpoint requirement, and escalation conditions.
- [x] 2.4 Implement repair plan DTO creation that cites evidence fingerprints, target scope, expected verification, action type, and stop criteria.
- [x] 2.5 Implement repair event recorder helpers that emit bounded, redacted, replayable runtime events with stable attempt ids.

## 3. Agent Loop Integration

- [x] 3.1 Wire self-repair classification into runtime failure points without changing terminal behavior when self-repair is disabled.
- [x] 3.2 Add a guarded repair phase before terminal failure for repairable tool, provider, verification, and artifact failures.
- [x] 3.3 Route repair-mode tool calls through the existing capability projection, tool-intent preflight, policy engine, runtime kernel, hooks, and tool-result feedback path.
- [x] 3.4 Require checkpoint evidence before write-capable repair actions and stop safely when checkpoint or stale-watermark policy fails.
- [x] 3.5 Include repair outcome summaries in `agent.loop.completed` and `agent.loop.failed` terminal data.

## 4. Prompt Assembly And Model Guidance

- [x] 4.1 Add repair-oriented prompt assembly sections for operating rules, failure evidence, prior attempts, verification ladder, allowed actions, and exact task boundary.
- [x] 4.2 Ensure repair context is supplied as runtime-owned sections while the user prompt remains exact and unmodified.
- [x] 4.3 Add deterministic prompt assembly tests for repair section ordering, exclusion reasons, fingerprints, and budget behavior.
- [x] 4.4 Add model-output shape validation for repair hypotheses so model diagnosis remains a bounded hypothesis and not an execution decision.

## 5. Verification Planner

- [x] 5.1 Implement verification ladder selection for syntax/artifact checks, targeted tests, package-level lint/typecheck, integration/golden/e2e checks, and optional live checks.
- [x] 5.2 Add command execution summaries with bounded stdout/stderr previews, digests, exit code, elapsed time, and redaction metadata.
- [x] 5.3 Map verification results to complete, retry, revert, escalate, or fail decisions.
- [x] 5.4 Add fixtures for webpage artifact repair, JavaScript syntax failure, missing generated file, typecheck failure, lint failure, and architecture-boundary failure.

## 6. Observability And Diagnostics

- [x] 6.1 Normalize repair events into observability records with schema version, trace correlation, privacy class, compatibility metadata, and redaction summaries.
- [x] 6.2 Extend diagnostic bundles to include failure classification, repair policy decisions, attempt summaries, verification summaries, stop reasons, and replay fingerprints.
- [x] 6.3 Add redaction tests proving repair evidence does not persist raw API keys, auth headers, env secrets, unbounded stdout/stderr, private file contents beyond policy, or raw provider reasoning.
- [x] 6.4 Keep external export denied by default for self-repair diagnostic evidence and record export-denial evidence safely.

## 7. Evaluation And Competitive Comparison

- [x] 7.1 Extend CLI evaluation task records with first-pass success, repair activation count, repair success count, correction rate, failed/corrected verification counts, repeated ineffective attempt count, and stop reason.
- [x] 7.2 Mark Codex, Claude, or other baseline repair metrics as unavailable or inferred when structured repair evidence is not available.
- [x] 7.3 Add repair-aware scoring dimensions for verification quality, code/artifact structure, user intervention count, elapsed time, and evidence ids.
- [x] 7.4 Add failing-first webpage and coding tasks to `tests/evaluation/task-catalog.json` or companion fixtures with deterministic check commands.
- [x] 7.5 Render repair metrics in text, JSON, and JSONL diagnostics output without ANSI leakage or secret exposure.

## 8. Regression And Replay

- [x] 8.1 Add unit tests for classifier, policy, planner, verifier, and recorder modules.
- [x] 8.2 Add runtime integration tests for repairable tool failure, non-repairable policy denial, stale checkpoint stop, repair success, repair failure, and repeated no-op stop.
- [x] 8.3 Add golden replay tests for repair event ordering and decision drift detection.
- [x] 8.4 Add CLI/evaluation tests for repair-aware metrics and baseline unavailable/inferred handling.
- [x] 8.5 Add versioning tests for self-repair event and evidence schemas.

## 9. Rollout And Acceptance

- [x] 9.1 Gate self-repair behind explicit request/config activation until deterministic tests and evaluation evidence are stable.
- [x] 9.2 Enable self-repair by default for bounded CLI task execution after policy, checkpoint, verification, and redaction gates pass.
- [x] 9.3 Update CLI README and diagnostics help text with concise self-repair behavior and evidence output descriptions.
- [x] 9.4 Run `openspec validate teach-agent-self-repair-loop --strict`.
- [x] 9.5 Run relevant checks: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/check-boundaries.mjs`, and targeted evaluation tests.
- [x] 9.6 Refresh acceptance evidence if release-readiness gates are affected.
