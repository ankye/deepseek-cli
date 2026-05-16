# Acceptance Evidence Index

This index maps each first-framework acceptance gate to a command, test suite, trace, fixture, or explicit deferral.

| Gate | Command or Evidence | Status |
| --- | --- | --- |
| OpenSpec validation | `openspec validate --specs --strict` -> `latest/openspec-validation.txt` | required |
| OpenSpec provenance hygiene | `rg -n "Claude|claude|Hermes|hermes|参考" openspec/specs openspec/changes/archive/2026-05-08-bootstrap-future-ready-cli-framework` -> `latest/reference-hygiene.txt` | required |
| Workspace layout | directory listing -> `latest/workspace-layout.txt` | required |
| Package boundaries | `node scripts/check-boundaries.mjs` -> `latest/dependency-boundaries.txt` | required |
| Type and contract checks | `npm run typecheck`, `npm run test:contracts` -> `latest/typecheck.txt`, `latest/contracts.txt` | required |
| CLI build artifact | `npm run build:cli` -> `latest/build-cli.txt` | required |
| CLI acceptance evidence refresh | `deepseek diagnostics refresh --output json` regenerates allowlisted `latest/*.txt` evidence before verify | required |
| CLI task completion evaluation | `deepseek diagnostics evaluate --dry-run --output json` plans DeepSeek-owned task-completion comparison evidence | required |
| Real tool-family delivery capability | `npx tsx scripts/run-live-tool-coverage.ts` -> `latest/live-tool-coverage.json`, `latest/tool-family-delivery-capability-score.json`, `latest/deepseek-provider-response-cache.json` | required |
| DeepSeek response replay regression | `npx tsx scripts/run-live-tool-coverage.ts --replay` -> `latest/deepseek-provider-response-cache.json`, `latest/live-tool-coverage-replay.json` | replay-only, zero credit for live delivery |
| DeepSeek live provider smoke | `DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek` -> `latest/live-provider-smoke.txt` | required for live release rehearsal |
| DeepSeek live agent loop smoke | `DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 npm run smoke:live:agent-loop` -> `latest/live-agent-loop-smoke.txt` | required for live release rehearsal |
| DeepSeek live agent tool smoke | `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools` -> `latest/live-agent-tool-smoke.txt` | required for live release rehearsal |
| DeepSeek live CLI run smoke | `deepseek run --live --output jsonl` against README tool-read task -> `latest/live-cli-run-smoke.txt` | required for live release rehearsal |
| DeepSeek live doctor smoke | `deepseek doctor --live --output json` -> `latest/live-doctor-smoke.txt` | required for live release rehearsal |
| Overall delivery capability | `deepseek diagnostics evaluate --full --execute-task all --live --output json` -> `latest/overall-delivery-capability-score.json` | required |
| CLI mode and agent completion matrix | `deepseek diagnostics evaluate --dry-run --output json`, `src/apps/cli/test/cli.test.ts` -> mode matrix diagnostics | required |
| CLI release diagnostics gate | `deepseek diagnostics release --output json` checks build artifact, acceptance evidence, package surface, and publish dry-run evidence | required |
| CLI release publish dry-run | `npm publish --dry-run --workspace deepseek-agent-cli --access public` -> `latest/npm-publish-dry-run.txt` | required |
| CLI release verify decision | `deepseek diagnostics verify --output json` summarizes release blockers, warnings, next action, and publish dry-run readiness | required |
| Headless smoke | `npm run smoke:headless` -> `latest/smoke-headless.txt` | required |
| Runtime kernel smoke | `npx tsx src/apps/cli/src/index.ts run "kernel smoke" --output jsonl` -> `latest/runtime-kernel.txt` | required |
| Protocol and bus replay | `npm run test:golden` -> `latest/golden-replay.txt` | required |
| Scheduler/workflow/concurrency | `npm run test:integration` and package tests -> `latest/integration.txt`, `latest/test-summary.txt` | required |
| Capability ecosystem | package and integration tests -> `latest/integration.txt`, `latest/test-summary.txt` | required |
| Policy/sandbox/platform/workspace | package, integration, and matrix tests -> `latest/integration.txt`, `latest/matrix.txt`, `latest/versioning.txt` | required |
| Memory/cache/credential/usage/code intelligence | package and integration tests -> `latest/test-summary.txt` | required |
| Session/replay/regression | `npm run test:golden`, `npm run test:versioning` -> `latest/golden-replay.txt`, `latest/versioning.txt` | required |
| Mode-aware golden replay | `npm run test:golden` / `tests/golden/mode-aware-agent-loop-replay.test.ts` -> `latest/golden-replay.txt` | required |
| Mode adversarial governance fixtures | `npm run test:contracts` / `tests/contracts/adversarial-mode-fixtures.test.ts`, `tests/fixtures/adversarial-mode-fixtures.json` -> `latest/contracts.txt` | required |
| Mode terminal profile matrix | `npm run test:matrix` / `tests/matrix/cli-mode-terminal-matrix.test.ts` -> `latest/matrix.txt` | required |
| Scratchpad/checkpoint governance metadata | `npm run test:contracts` / `tests/contracts/adversarial-mode-fixtures.test.ts` -> `latest/contracts.txt` | required |
| Host adapters | `npm run test:e2e` -> `latest/smoke-host-adapters.txt` | required |
| Index provider CLI intent safety | `npm run test:e2e` / `tests/e2e/local-readiness-cli.test.ts` -> `latest/smoke-host-adapters.txt` | required |
| Index provider activation evidence gate | `npm run test:contracts` / `tests/contracts/index-provider-contracts.test.ts` -> `latest/contracts.txt` | required |
| Index provider text evidence rendering | `npm run test:e2e` / `src/apps/cli/test/cli.test.ts`, `tests/e2e/local-readiness-cli.test.ts` -> `latest/smoke-host-adapters.txt` | required |
| Future capability deferrals | OpenSpec landing map in design.md | deferred by design |
