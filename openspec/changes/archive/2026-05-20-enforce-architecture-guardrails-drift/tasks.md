## 1. Guardrail Inventory

- [x] 1.1 Inventory `tsconfig.base.json` aliases, workspace packages, package manifests, and package-map entries.
- [x] 1.2 Define retired/merged alias metadata and severity rules.
- [x] 1.3 Define placeholder ownership metadata and replacement triggers.

## 2. Lint And Drift Checks

- [x] 2.1 Add ghost alias detection to lint-framework.
- [x] 2.2 Add package manifest and workspace dependency drift checks.
- [x] 2.3 Add roadmap/package-map maturity drift checks.
- [x] 2.4 Add diagnostics for placeholder ownership gaps.

## 3. Evidence

- [x] 3.1 Add fixtures for ghost aliases, retired aliases, stale roadmap labels, and placeholder claims.
- [x] 3.2 Add CLI readiness output for architecture drift findings.
- [x] 3.3 Link architecture guardrail evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate enforce-architecture-guardrails-drift --strict`.
- [x] 4.2 Run lint-framework tests for architecture guardrails.
- [x] 4.3 Run `node scripts/check-boundaries.mjs` and `npm run lint`.
