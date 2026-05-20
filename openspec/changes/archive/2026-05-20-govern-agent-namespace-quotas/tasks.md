## 1. Scope Model

- [x] 1.1 Define agent namespace fields for paths, tools, memory, scratchpad, checkpoints, and environment.
- [x] 1.2 Define quotas for tokens, tools, wall-clock time, retries, and file mutations.
- [x] 1.3 Define lineage, owner, parent, and repair/verifier authority rules.

## 2. Enforcement

- [x] 2.1 Add runtime event-loop checks for scoped execution.
- [x] 2.2 Add policy handoff when child agents request broader authority.
- [x] 2.3 Add diagnostics for quota exhaustion, scope denial, and orphaned agents.

## 3. Evidence

- [x] 3.1 Add fixtures for allowed writes, denied writes, quota exhaustion, cancellation, and repair scopes.
- [x] 3.2 Add regression tests for lineage and ownership records.
- [x] 3.3 Link agent scope evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate govern-agent-namespace-quotas --strict`.
- [x] 4.2 Run focused agent-management and runtime-event-loop tests.
