## 1. Contracts And Events

- [x] 1.1 Add `src/packages/platform-contracts/src/evidence-first.ts` with evidence task classification, evidence plan, evidence item, source coverage, claim grounding, evidence manifest, unsupported claim, and evidence summary DTOs.
- [x] 1.2 Export evidence-first contracts from `src/packages/platform-contracts/src/index.ts` without importing implementation, Node, provider, CLI, or testing packages.
- [x] 1.3 Extend runtime event kinds with evidence-first events such as `evidence.classified`, `evidence.plan.created`, `evidence.selected`, `evidence.claims.grounded`, `evidence.manifest.created`, and `evidence.unsupported-claim`.
- [x] 1.4 Add schema-version and contract tests for evidence-first DTOs, redaction metadata, stable ids, compatibility metadata, and unsupported-claim diagnostics.

## 2. Task Classification And Evidence Planning

- [x] 2.1 Implement deterministic task-intent classification for fact-sensitive repository, product, command, package, code, docs, release, evaluation, generated artifact, and speculative tasks.
- [x] 2.2 Implement evidence plan creation with required fact classes, candidate source groups, minimum source coverage, freshness policy, redaction policy, and stop conditions.
- [x] 2.3 Add unit tests proving users do not need to explicitly ask for evidence when the task is fact-sensitive.
- [x] 2.4 Add unit tests proving explicitly speculative or brainstorming tasks are classified separately and require assumption labeling instead of full evidence coverage.

## 3. Evidence Source Discovery

- [x] 3.1 Implement a local project evidence source provider for README, package metadata, command index, OpenSpec specs/changes, product docs, task catalog, tests, and selected source files.
- [x] 3.2 Extract strict command/package evidence from `src/apps/cli/package.json`, root README quick-start commands, command index docs, and CLI parser/manifest surfaces.
- [x] 3.3 Add evidence item creation with bounded previews, source paths, fact classes, fingerprints, freshness evidence, and redaction metadata.
- [x] 3.4 Add source coverage summaries grouped by source type and fact class.
- [x] 3.5 Add tests for stale, missing, duplicate, secret-like, out-of-scope, and over-budget evidence candidate exclusions.

## 4. Runtime And Prompt Assembly Integration

- [x] 4.1 Wire evidence classification and evidence plan events into `runAgentLoop` before model dispatch for fact-sensitive tasks.
- [x] 4.2 Project selected evidence into model requests as runtime-owned context while preserving the exact user prompt.
- [x] 4.3 Add prompt assembly sections for evidence-first operating rules, evidence plan, selected evidence, unsupported claim policy, exact task boundary, and artifact evidence manifest requirements.
- [x] 4.4 Add model feedback path for unsupported strict claims so the agent can revise once before failing closed under retry policy.
- [x] 4.5 Add runtime integration tests for evidence-first fact-sensitive run, speculative run, prompt-boundary preservation, and unsupported-claim retry/failure.

## 5. Claim Grounding And Unsupported Claim Detection

- [x] 5.1 Implement deterministic extraction for high-value strict claims: commands, package names, executable names, feature bullets, install instructions, release state, architecture claims, and evaluation conclusions.
- [x] 5.2 Implement claim certainty classification as `verified`, `inferred`, `assumption`, or `unsupported`.
- [x] 5.3 Implement unsupported-command detection for generated commands not backed by package metadata, README, command index, parser, or manifest evidence.
- [x] 5.4 Add tests for hallucinated commands such as `npx deepseek-cli init`, invented package aliases, unsupported features, and unverified release claims.

## 6. Generated Artifact Evidence Manifests

- [x] 6.1 Define the generated artifact `evidence.json` manifest shape with schema version, source coverage, evidence items, claim groundings, assumptions, unsupported claim count, and redaction metadata.
- [x] 6.2 Update webpage-generation task prompt to require repository evidence search and `generated-webpage/evidence.json`.
- [x] 6.3 Update isolated webpage evaluation workspace setup to provide or point to required evidence sources rather than leaving the model to invent facts.
- [x] 6.4 Update `scripts/check-webpage-generation.mjs` to require evidence manifest, source coverage, supported strict claims, and unsupported-command rejection.
- [x] 6.5 Update fake webpage agent tests to generate evidence-backed product copy and evidence manifest.

## 7. Evaluation Metrics And Reporting

- [x] 7.1 Extend CLI evaluation metrics with evidence plan presence, evidence item count, source coverage, claim grounding rate, unsupported claim count, assumption count, hallucinated command count, and manifest status.
- [x] 7.2 Update task run diagnostics so unsupported strict claims prevent `solved` outcomes unless the task is explicitly speculative.
- [x] 7.3 Add evidence grounding fields to text, JSON, and JSONL diagnostics output without leaking raw private content.
- [x] 7.4 Add competitive/evaluation report handling that separates verified evidence, inference, assumptions, and unsupported claims.

## 8. Regression And Replay

- [x] 8.1 Add contract tests for evidence manifests and unsupported claim diagnostics.
- [x] 8.2 Add runtime golden replay tests for evidence event ordering and prompt-boundary preservation.
- [x] 8.3 Add webpage checker tests for missing evidence manifest, malformed manifest, unsupported command, and valid evidence-backed page.
- [x] 8.4 Add CLI evaluation tests proving structurally valid but ungrounded webpages fail.
- [x] 8.5 Add versioning tests for evidence-first schemas and generated artifact manifests.

## 9. Rollout And Acceptance

- [x] 9.1 Gate evidence-first behavior behind config/request activation for initial implementation, then enable by default for fact-sensitive `deepseek run`.
- [x] 9.2 Enable evidence-first behavior for chat turns after scripted chat evidence tests pass.
- [x] 9.3 Update README and docs to describe evidence-first behavior as a product guarantee, not as user prompt advice.
- [x] 9.4 Run `openspec validate evidence-first-agent-workflow --strict`.
- [x] 9.5 Run relevant checks: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/check-boundaries.mjs`, and targeted webpage/evaluation tests.
- [x] 9.6 Refresh acceptance evidence if diagnostics or release-readiness output changes.
