## 1. Contracts And Package Boundary

- [x] 1.1 Add prompt assembly DTOs and runtime event payload contracts to `@deepseek/platform-contracts`.
- [x] 1.2 Export the new contracts from platform-contracts public entrypoints and update schema/versioning tests.
- [x] 1.3 Scaffold `src/packages/prompt-assembly` as `@deepseek/prompt-assembly` with package metadata, tsconfig, public exports, and no host/provider dependencies.
- [x] 1.4 Extend architecture lint/boundary checks so prompt-assembly cannot import apps, runtime internals, provider SDKs, Node filesystem/process APIs, or testing fakes.

## 2. Core Assembly Pipeline

- [x] 2.1 Implement the default `PromptAssembler` pipeline with immutable stages for normalize, section collection, ordering, budgeting, message weaving, tool planning, and trace generation.
- [x] 2.2 Implement built-in section providers for user prompt, projected context evidence, task output contract, tool-result continuity, PageIndex recall labeling, skill context, and tool policy summaries.
- [x] 2.3 Implement deterministic section ordering, duplicate-fingerprint handling, budget fitting, exclusion reasons, redaction metadata, and stable assembly fingerprints.
- [x] 2.4 Implement replay helpers that compare captured assembly evidence with replayed assembly output and report first structural drift.
- [x] 2.5 Add prompt-assembly unit tests for section registry extensibility, budget exclusions, exact user prompt preservation, duplicate handling, redaction, fingerprint stability, and replay drift reports.

## 3. Runtime Integration

- [x] 3.1 Add prompt assembler dependency wiring to runtime defaults and test dependencies without importing app hosts.
- [x] 3.2 Replace inline message/prompt/tool request construction in the agent loop with `PromptAssemblyResult` while preserving existing message order for current behavior.
- [x] 3.3 Emit `prompt.assembled` before `model.requested` with bounded redacted section, budget, tool plan, provider target, compatibility, and replay metadata.
- [x] 3.4 Fail closed with typed terminal events when required prompt assembly stages reject the turn before model dispatch.
- [x] 3.5 Update runtime, integration, golden, and e2e tests to include prompt assembly events and replayable evidence.

## 4. Context And Evaluation Integration

- [x] 4.1 Map `ContextProjectionResult` selected nodes, exclusions, freshness, and provenance into prompt assembly section evidence without adding retrieval logic to prompt-assembly.
- [x] 4.2 Preserve exact-vs-semantic recall labels so PageIndex evidence and future ZVec evidence are budgeted and traced differently.
- [x] 4.3 Extend CLI evaluation records to collect DeepSeek prompt assembly metrics from runtime events.
- [x] 4.4 Add gap-analysis fields that distinguish missing output contracts, dropped context, insufficient tool visibility, provider readiness failure, and post-assembly model failure.
- [x] 4.5 Add focused CLI evaluation tests for prompt assembly evidence presence, missing-evidence diagnostics, and webpage generation gap categorization.

## 5. Verification And Documentation

- [x] 5.1 Document the prompt assembly package architecture, extension points, section provider contract, replay model, and package boundary rules.
- [x] 5.2 Run `openspec validate add-prompt-assembly-package --strict`.
- [x] 5.3 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 5.4 Run focused acceptance checks for runtime golden replay and CLI webpage evaluation diagnostics after integration.
