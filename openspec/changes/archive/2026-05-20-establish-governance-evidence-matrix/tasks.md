## 1. Evidence Model

- [x] 1.1 Define evidence categories and package risk tiers.
- [x] 1.2 Define required evidence by capability state and host surface.
- [x] 1.3 Define missing-evidence and promotion-blocker records.
- [x] 1.4 Codify the test-first implementation gate: implementation code requires focused coverage first, or explicit exception evidence.

## 2. Matrix Generation

- [x] 2.1 Add package-level evidence matrix generation or validation.
- [x] 2.2 Add CLI readiness consumption of matrix output.
- [x] 2.3 Add JSON/JSONL fixtures for matrix findings.

## 3. Coverage

- [x] 3.1 Add fixtures for packages with contract-only, integration-only, e2e-missing, live-smoke-missing, and acceptance-ready evidence.
- [x] 3.2 Add tests proving product-ready claims require accepted evidence.
- [x] 3.3 Link evidence matrix output from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate establish-governance-evidence-matrix --strict`.
- [x] 4.2 Run focused testing-regression tests.
- [x] 4.3 Run `npm run lint`, `npm run typecheck`, `npm run test:contracts`, and `npm run test:golden` as relevant to implementation.
