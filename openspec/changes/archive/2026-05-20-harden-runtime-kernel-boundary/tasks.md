## 1. Kernel Boundary Inventory

- [x] 1.1 Inventory runtime entrypoints, internal modules, package imports, and injected dependencies.
- [x] 1.2 Classify each runtime responsibility as kernel-owned, owner-package-owned, host-owned, or compatibility shim.
- [x] 1.3 Document allowed runtime dependencies and forbidden dependency directions.

## 2. Guardrail Implementation

- [x] 2.1 Add lint conventions for runtime kernel ownership and forbidden imports.
- [x] 2.2 Add guardrails for provider SDKs, host APIs, test fakes, private package internals, and app imports inside runtime.
- [x] 2.3 Add central-file pressure checks for runtime kernel files and package exports.
- [x] 2.4 Add structured governance findings for violations and compatibility shims.

## 3. Evidence

- [x] 3.1 Add fixtures for valid kernel handoffs, forbidden imports, and expiring shims.
- [x] 3.2 Add readiness output that summarizes kernel boundary health.
- [x] 3.3 Link this evidence from `systematize-platform-governance` before closing the umbrella.

## 4. Verification

- [x] 4.1 Run `openspec validate harden-runtime-kernel-boundary --strict`.
- [x] 4.2 Run focused lint-framework tests for kernel boundary rules.
- [x] 4.3 Run `npm run lint` and `npm run typecheck` for the implementation slice.
