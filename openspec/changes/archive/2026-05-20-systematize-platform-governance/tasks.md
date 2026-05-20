## 1. Stable Runtime Kernel Governance

- [x] 1.1 Define the runtime kernel boundary first: turn lifecycle, execution envelopes, policy handoff, scheduler handoff, event emission, and model/tool continuation loop.
- [x] 1.2 Add governance records for runtime kernel ownership, forbidden dependencies, owner-package extraction targets, and allowed compatibility shims.
- [x] 1.3 Add kernel-boundary lint for private subsystem imports, app imports, provider SDK imports, test fake imports, and direct host APIs inside runtime kernel code.
- [x] 1.4 Add central-file pressure diagnostics for runtime files, app entrypoints, package `index.ts` files, and lint framework central files.
- [x] 1.5 Define the evidence required before plugin execution, multi-agent writes, remote runtime, host promotion, or enterprise distribution can depend on kernel behavior.

## 2. Governance Model

- [x] 2.1 Add platform governance DTOs/types for maturity state, severity, evidence references, owner package, promotion gate, and suggested action.
- [x] 2.2 Add deterministic governance record builders for placeholder implementations, deferred providers, rollout-gated modes, host-promotion gates, and stale aliases.
- [x] 2.3 Add redaction and stable-id helpers so governance findings are replay-safe and suitable for JSON/JSONL output.

## 3. Architecture Guardrails

- [x] 3.1 Extend lint-framework conventions to enumerate workspace packages, plugin packages, allowed retired/merged aliases, and placeholder-owned contracts.
- [x] 3.2 Add a lint rule that detects `@deepseek/*` path aliases whose target package directories are missing and have no governance record.
- [x] 3.3 Add diagnostics for placeholder implementations that lack owner, allowed-consumer, blocked-claim, and replacement-trigger metadata.
- [x] 3.4 Add a drift check comparing package-map/roadmap maturity labels against source/package manifest evidence for risk-bearing capabilities.

## 4. Kernel And Extensibility Governance

- [x] 4.1 Add UAPI compatibility classification for platform-contract DTOs, ids, event kinds, envelopes, manifests, service interfaces, and errors.
- [x] 4.2 Add VFS/page-cache style context governance records for file, memory, PageIndex, code intelligence, tool evidence, and future semantic recall.
- [x] 4.3 Add runtime-message-bus pipe/backpressure governance records for context, tool-result, plugin, MCP, agent, and runtime streams.
- [x] 4.4 Add namespace/quota governance records for coordinator, worker, verifier, repair, and implementer agent modes.
- [x] 4.5 Add mandatory policy-gate governance records for risky file, shell, MCP, plugin, credential, remote, sandbox, and workspace mutation operations.
- [x] 4.6 Add governed-module records for plugins, extensions, MCP bridges, skills, and hooks.

## 5. CLI Diagnostics And Readiness

- [x] 5.1 Add governance scanning to the CLI diagnostics/readiness pipeline without changing runtime execution behavior.
- [x] 5.2 Render governance findings in text, JSON, and JSONL with severity grouping, maturity state, affected package/capability, evidence ids, and next action.
- [x] 5.3 Fail readiness with release-blocking diagnostics when product-ready claims conflict with placeholder, deferred, or missing evidence states.
- [x] 5.4 Ensure remote/update placeholders, semantic index deferral, VSCode skeleton status, and multi-agent rollout gates appear in diagnostics.
- [x] 5.5 Add `/proc`-style diagnostics sections for kernel boundary health, UAPI compatibility, context prefix/cache health, bus backpressure, agent scopes, policy gates, and module status.

## 6. Testing And Evidence Matrix

- [x] 6.1 Add package-level evidence matrix generation or validation across lint, contract, integration, golden, matrix, e2e, live smoke, and acceptance evidence.
- [x] 6.2 Add deterministic fixtures for ghost aliases, placeholder product claims, deferred semantic providers, rollout-gated agent modes, and host-promotion gates.
- [x] 6.3 Add fixtures for runtime kernel boundary violations, UAPI breaking changes, policy bypass attempts, unscoped agent writes, module private-object access, central-file growth, and context prefix instability.
- [x] 6.4 Add golden or integration coverage proving governance output is stable, redacted, and replay-safe.
- [x] 6.5 Update acceptance evidence under `tests/acceptance/` for governance readiness output.
- [x] 6.6 Codify the test-first implementation gate so non-doc implementation requires focused coverage before source changes, or explicit exception evidence.

## 7. Documentation And Roadmap Alignment

- [x] 7.1 Update `docs/product/product-roadmap.md` to use canonical governance maturity labels for risk-bearing capabilities.
- [x] 7.2 Update `docs/architecture/package-map.md` to describe placeholder ownership, missing package alias policy, deferred provider gates, and Linux-style kernel/extensibility governance.
- [x] 7.3 Update `docs/architecture/system-overview.md` or a dedicated architecture doc to define the stable runtime kernel, UAPI boundary, context VFS/page cache, pipe/backpressure, LSM policy gate, module governance, and diagnostics introspection model.
- [x] 7.4 Update OpenSpec or docs references so contract coverage is not described as product readiness without acceptance evidence.

## 8. Governance Program Closure

- [x] 8.1 Define required child governance tracks and owners, with stable runtime kernel governance listed first.
- [x] 8.2 Link `introduce-context-pipeline-prefix-cache` as the context/cache child governance track.
- [x] 8.3 Create or link follow-up child changes: `harden-runtime-kernel-boundary`, `govern-platform-contracts-uapi`, `define-bounded-runtime-pipes`, `enforce-policy-sandbox-gates`, `govern-agent-namespace-quotas`, `govern-plugin-module-boundaries`, `expose-kernel-diagnostics-readiness`, `establish-governance-evidence-matrix`, and `enforce-architecture-guardrails-drift`.
- [x] 8.4 Record closure evidence for each child track, or explicit deferral rationale with owner, risk, follow-up change, and release-gate impact.
  - [x] `introduce-context-pipeline-prefix-cache`: closure evidence recorded through context pipeline/cache architecture docs, acceptance cache evidence, prefix/cache diagnostics surface, `docs/architecture/context-pipeline-cache.md`, and archived implementation evidence.
  - [x] `harden-runtime-kernel-boundary`: closure evidence recorded through runtime kernel boundary docs, lint guardrails, release readiness diagnostics, focused lint/e2e tests, `npm run lint`, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `govern-platform-contracts-uapi`: closure evidence recorded through UAPI inventory, compatibility labels, fail-closed migration assessment, lint guardrails, release readiness diagnostics, acceptance evidence, `npm run test:contracts`, `npm run test:golden`, `npm run lint`, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `define-bounded-runtime-pipes`: closure evidence recorded through runtime pipe stream inventory, bus/protocol metadata, pressure diagnostics, release readiness diagnostics, focused bus/protocol tests, golden replay, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `enforce-policy-sandbox-gates`: closure evidence recorded through risky operation taxonomy, normalized policy decision records, runtime fail-closed policy handoff, release readiness diagnostics, focused policy/runtime/CLI tests, golden replay, `npm run lint`, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `govern-agent-namespace-quotas`: closure evidence recorded through agent namespace/quota/lineage DTOs, runtime subagent scope handoff, policy-approved namespace expansion, release readiness diagnostics, focused agent-management/spawn/CLI tests, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `govern-plugin-module-boundaries`: closure evidence recorded through governed module DTOs, public contract paths, private API rejection fixtures, policy-sandbox handoff records, disable/unload lifecycle evidence, release readiness diagnostics, focused plugin/policy/CLI tests, `npm run lint`, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `expose-kernel-diagnostics-readiness`: closure evidence recorded through `/proc/deepseek/*` governance diagnostics DTOs, text/JSON/JSONL CLI output, severity/package/capability filters, product-ready release blockers, placeholder/deferred/host-promotion findings for remote/update/extension/evolution/semantic-index/VSCode/multi-agent gates, architecture docs, acceptance index updates, focused CLI/contract/golden tests, `npm run typecheck`, and strict OpenSpec validation.
  - [x] `establish-governance-evidence-matrix`: closure evidence recorded through governance evidence matrix DTOs, package/capability risk tiers, contract/integration/golden/matrix/e2e/live-smoke/acceptance/readiness evidence categories, deterministic missing-evidence fixtures, release readiness consumption, JSON/JSONL output, acceptance fixture, test-first implementation gate, focused testing-regression/contract/CLI/golden tests, `npm run lint`, `npm run typecheck`, `npm run test:contracts`, `npm run test:golden`, and strict OpenSpec validation.
  - [x] `enforce-architecture-guardrails-drift`: closure evidence recorded through ghost alias lint detection, explicit placeholder alias governance records, package-map and roadmap drift docs, `governance.architecture-drift` readiness output, `/proc/deepseek/governance.roadmap-drift` projection, acceptance fixture, focused lint/local-readiness/e2e/golden tests, `node scripts/check-boundaries.mjs`, `npm run lint`, `npm run typecheck`, and strict OpenSpec validation.
- [x] 8.5 Archive this umbrella only after child evidence is complete and strict validation passes.

## 9. Verification

- [x] 9.1 Run `openspec validate systematize-platform-governance --strict`.
- [x] 9.2 Run `npm run lint` and confirm governance lint diagnostics are stable.
- [x] 9.3 Run `npm run typecheck`.
- [x] 9.4 Run focused tests for governance records, lint fixtures, CLI diagnostics, kernel/extensibility fixtures, and evidence matrix.
- [x] 9.5 Run `npm test` or document why a narrower suite is sufficient for the implementation slice.
