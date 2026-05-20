## 1. Contract Inventory

- [x] 1.1 Inventory exported DTOs, ids, envelopes, events, errors, manifests, and service interfaces.
- [x] 1.2 Mark persisted, replayed, host-facing, plugin-facing, and internal-only contract surfaces.
- [x] 1.3 Define compatibility labels for additive, breaking, migration-required, and replay-affecting changes.

## 2. Governance Checks

- [x] 2.1 Add lint checks that keep `platform-contracts` implementation-free and host-agnostic.
- [x] 2.2 Add diagnostics for breaking contract changes without migration evidence.
- [x] 2.3 Add version or fail-closed rejection rules for persisted contract changes.

## 3. Evidence

- [x] 3.1 Add contract compatibility fixtures for replayed events and envelopes.
- [x] 3.2 Add acceptance evidence for UAPI compatibility diagnostics.
- [x] 3.3 Link UAPI evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate govern-platform-contracts-uapi --strict`.
- [x] 4.2 Run `npm run test:contracts`.
- [x] 4.3 Run `npm run test:golden` when persisted events or replay fixtures change.
