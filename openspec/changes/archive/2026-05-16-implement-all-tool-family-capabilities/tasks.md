## 1. Foundation And Guardrails

- [x] 1.1 Add shared contracts for family implementation readiness, family projection filters, connector profile evidence, pipeline records, artifact refs, and family task evidence.
- [x] 1.2 Extend registry validation so every model-visible executable family capability requires timeout, security, output-bound, risk, host requirement, and family metadata.
- [x] 1.3 Add family-aware projection filters for family id, domain id, risk class, host requirement, connector trust, provider support, policy, and agent scope.
- [x] 1.4 Add diagnostics parity output that separates implementation, static contract, replayed/live execution, task outcome, safety, and provider-native support.
- [x] 1.5 Add architecture lint or runtime validation that rejects executor-to-executor private chaining.

## 2. Workspace I/O Families

- [x] 2.1 Harden `file.read` with family task evidence and output-bound regression snapshots.
- [x] 2.2 Harden `file.list` with family task evidence and cross-platform path matrix snapshots.
- [x] 2.3 Implement `workspace.glob` as a concrete core tool with glob semantics, path policy, bounded output, and tests.
- [x] 2.4 Implement `asset.view-local` as a concrete local asset preview tool with binary safety, metadata bounds, and tests.

## 3. Search And Code Intelligence Families

- [x] 3.1 Harden `search.text` with family task evidence and search provider fallback snapshots.
- [x] 3.2 Implement `search.symbol` through `code-intelligence` with a model-visible wrapper and deterministic symbol fixtures.
- [x] 3.3 Implement `code.diagnostics-lsp` through code diagnostics projection with bounded diagnostics and tests.
- [x] 3.4 Implement `notebook.read` with `.ipynb` parsing, malformed notebook handling, truncation metadata, and tests.

## 4. Mutation And Patching Families

- [x] 4.1 Harden `file.write` with family task evidence and transaction replay snapshots.
- [x] 4.2 Harden `file.edit` with family task evidence and ambiguous edit rejection snapshots.
- [x] 4.3 Implement `patch.apply` with multi-hunk patch semantics, precondition validation, affected-file accounting, checkpoints, and rollback tests.
- [x] 4.4 Implement `revert.undo` with checkpoint preview, confirm/apply paths, stale checkpoint rejection, and tests.

## 5. Shell, Process, Git, And Build Families

- [x] 5.1 Harden `shell.run` with family task evidence, shell policy fixtures, and background process coverage.
- [x] 5.2 Harden `process.output` with family task evidence, timeout coverage, and bounded output tests.
- [x] 5.3 Harden `process.kill` with family task evidence, idempotency, and missing task diagnostics.
- [x] 5.4 Implement `repl.execute` with isolated snippet execution, timeout, sandbox metadata, and tests.
- [x] 5.5 Harden `git.status-diff` with family task evidence for status and diff attribution.
- [x] 5.6 Implement `git.history-branch` with log, branch list, current branch, safe checkout preview, and fake git fixtures.
- [x] 5.7 Harden `build.test-lint-typecheck` with family task evidence for test, lint, and typecheck intents.
- [x] 5.8 Implement `package.manager` with package script/list/outdated/install dry-run support, governed execution, and npm/pnpm/yarn fake fixtures.

## 6. Planning, Control, Pipeline, And Agents

- [x] 6.1 Harden `plan.todo` with family task evidence and model feedback snapshots.
- [x] 6.2 Implement `mode.plan-auto-review` as a model-visible mode-control capability with mode-state tests.
- [x] 6.3 Implement `user.input` as a runtime user-input request capability with headless fail-closed and interactive fake-host tests.
- [x] 6.4 Implement `approval.permission` as an approval request capability with allow/deny/cancel audit tests.
- [x] 6.5 Implement `pipeline.sequence` with governed step execution, replay metadata, and read-patch-test fixture.
- [x] 6.6 Implement `pipeline.parallel` with independent scopes, resource locks, conflict behavior, and overlapping-write rejection tests.
- [x] 6.7 Implement `pipeline.artifact-routing` with typed artifact references, bounded artifacts, and replay tests.
- [x] 6.8 Implement `pipeline.stream` with bounded stream routing, truncation metadata, backpressure, cancellation, and tests.
- [x] 6.9 Harden `agent.spawn` with family scope evidence and delegated work-order tests.
- [x] 6.10 Harden `agent.message-continue` with family task evidence and continuation attribution.
- [x] 6.11 Implement `agent.wait-result` with worker wait, timeout, cancellation, and fake worker completion tests.
- [x] 6.12 Harden `agent.stop-close` with idempotency, cancellation evidence, and family task fixtures.

## 7. Web, Browser, MCP, Extensions, Media, And Design

- [x] 7.1 Harden `web.search` with family task evidence and deterministic provider snapshots.
- [x] 7.2 Harden `web.fetch` with family task evidence, redirect policy, and bounded HTML output.
- [x] 7.3 Implement `web.extract` with title/text/link extraction, HTML fixtures, and redaction tests.
- [x] 7.4 Implement `web.data-lookup` with provider-neutral lookup contracts, fake data provider fixtures, and no-network default tests.
- [x] 7.5 Implement `browser.navigate` through a fake-first browser connector with optional live connector support.
- [x] 7.6 Implement `browser.interact` with click/type/select operations, DOM state transition tests, and safety bounds.
- [x] 7.7 Implement `browser.inspect` with bounded DOM, console, and network summary output.
- [x] 7.8 Implement `browser.screenshot` with fake screenshot artifacts and optional real browser smoke.
- [x] 7.9 Implement `mcp.server-lifecycle` capability with fake server connect/list/disconnect tests.
- [x] 7.10 Implement `mcp.tool-call` capability with governed invocation, auth/redaction evidence, and fake tool tests.
- [x] 7.11 Implement `mcp.resource-read` capability with cache/replay metadata and fake resource tests.
- [x] 7.12 Implement `mcp.prompt` capability with prompt listing/rendering and fake prompt projection tests.
- [x] 7.13 Harden `skill.list-activate` with family task evidence for list and activation.
- [x] 7.14 Harden `hook.list-run` by adding governed hook run capability evidence in addition to hook listing.
- [x] 7.15 Implement `plugin.install-verify` with fake plugin install, integrity verification, lockfile diff, and tests.
- [x] 7.16 Implement `command.palette-slash` with command palette and slash command projection evidence.
- [x] 7.17 Implement `image.generate` with fake-first image provider, artifact refs, and optional live provider profile.
- [x] 7.18 Implement `image.edit` with fake-first image edit provider, input bounds, output artifacts, and tests.
- [x] 7.19 Implement `image.search-stock` with fake-first stock search provider and bounded result tests.
- [x] 7.20 Implement `image.inspect` with local image metadata inspection, binary safety, and tests.
- [x] 7.21 Implement `design.document-state` through fake-first design connector state reads.
- [x] 7.22 Implement `design.node-query` through fake-first design connector node queries.
- [x] 7.23 Implement `design.batch-edit` through transactional fake canvas edits with rollback evidence.
- [x] 7.24 Implement `design.export-snapshot` with fake export artifacts and optional real design connector support.

## 8. Memory, Context, Session, Remote, Scheduling, And Observability

- [x] 8.1 Implement `memory.read-write` with scoped memory read/write operations, provenance, redaction, and tests.
- [x] 8.2 Implement `context.project-index` with index refresh/query capability, deterministic project fixtures, and stale-index diagnostics.
- [x] 8.3 Implement `session.resume-fork` as a model-visible capability with session resume/fork evidence.
- [x] 8.4 Implement `compact.summary` with bounded summary generation, budget metadata, and replay tests.
- [x] 8.5 Implement `remote.runtime` with fake remote runtime profile connect/query/disconnect support.
- [x] 8.6 Implement `worktree.environment` with fake git worktree create/list/cleanup and write-scope safety tests.
- [x] 8.7 Implement `schedule.sleep-cron` with fake-clock sleep/schedule/cancel operations and deterministic tests.
- [x] 8.8 Implement `observability.trace-budget` with redacted trace, usage, budget, and diagnostic bundle query evidence.

## 9. Family Evaluation And Acceptance Evidence

- [x] 9.1 Add representative task fixtures for all 64 families and map every fixture to required/available/used/unsupported family evidence.
- [x] 9.2 Extend live/replayed family coverage generation so fake-first providers produce replay evidence and opt-in live providers produce live evidence.
- [x] 9.3 Update package scorecards and tool family scorecards so every family layer scores missing, partial, failed, planned, absent, unavailable, and unassessed as zero.
- [x] 9.4 Update diagnostics evaluate JSON, JSONL, and text output with the 64-family parity matrix and provider-native support breakdown.
- [x] 9.5 Refresh acceptance snapshots for family parity, fake connector replay, task fixtures, and optional live coverage.

## 10. Verification

- [x] 10.1 Run `openspec validate implement-all-tool-family-capabilities --strict`.
- [x] 10.2 Run `npm run typecheck`.
- [x] 10.3 Run `npm run lint`.
- [x] 10.4 Run `npm test`.
- [x] 10.5 Run `node scripts/check-boundaries.mjs`.
- [x] 10.6 Run release-relevant checks when implementation is complete: `npm run build:cli`, `npm run smoke:headless`, `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, `npm run test:versioning`, `npm run test:matrix`, and `npm run test:e2e`.
