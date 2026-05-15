## 1. Direct Core Tool Directory Migration

- [x] 1.1 Move the existing 20 built-in core tool implementation directories from `src/packages/core-coding-tools/src/tools/<tool>/` into `src/packages/core-coding-tools/src/families/<domain>/<family>/`.
- [x] 1.2 Update `src/packages/core-coding-tools/src/index.ts` and any tests or internal imports to reference the new family-owned paths directly.
- [x] 1.3 Remove the old `src/packages/core-coding-tools/src/tools/` tree without compatibility re-export shims.

## 2. Catalog Contracts And Metadata

- [x] 2.1 Add platform contract types for tool domains, tool families, family maturity, risk class, host requirements, operation profiles, implementation state, and scorecard rubric references.
- [x] 2.2 Add the first-version 16-domain/64-family catalog fixture and deterministic validation helpers.
- [x] 2.3 Map all existing core tool capability ids to canonical family ids.

## 3. Registry And Projection

- [x] 3.1 Extend capability manifests or projections with family metadata.
- [x] 3.2 Add registry validation that blocks model-visible projection when executable capabilities lack valid family metadata.
- [ ] 3.3 Add family-aware projection filtering for agent scope, policy, host requirements, connector trust, and provider support.

## 4. Runtime Pipeline Contracts

- [ ] 4.1 Add runtime-owned pipeline records for sequence, parallel, artifact routing, and stream routing.
- [ ] 4.2 Ensure pipeline steps record policy, preflight, execution, evidence, replay metadata, and bounded artifact references.
- [ ] 4.3 Add validation or lint coverage that rejects executor-to-executor private tool chaining.

## 5. Scorecards And Diagnostics

- [x] 5.1 Add tool family scorecard contracts with strict zero-credit handling for missing, partial, failed, planned, absent, unavailable, and unassessed criteria.
- [x] 5.2 Emit diagnostics parity matrix with total, implemented, live-covered, task-covered, absent, planned, unavailable, and not-applicable family counts.
- [ ] 5.3 Extend live coverage evidence from per-tool checks to family-level representative task scenarios.

## 6. Verification

- [x] 6.1 Add or update tests for migrated core tool registration and existing 20-tool behavior.
- [x] 6.2 Add catalog snapshot and projection tests for the 16-domain/64-family matrix.
- [x] 6.3 Run `openspec validate formalize-tool-family-capability-catalog --strict`.
- [x] 6.4 Run relevant repository checks for the migration slice, including core coding tool tests and typecheck.
