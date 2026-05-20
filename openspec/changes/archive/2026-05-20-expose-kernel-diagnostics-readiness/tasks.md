## 1. Diagnostics Schema

- [x] 1.1 Define stable section ids for kernel, UAPI, context/cache, bus, policy, agents, modules, drift, and evidence.
- [x] 1.2 Define finding fields for owner, severity, state, evidence ids, redaction, and next action.
- [x] 1.3 Define text, JSON, and JSONL rendering contracts.

## 2. CLI Readiness

- [x] 2.1 Add governance diagnostics sections to CLI readiness.
- [x] 2.2 Add output filtering by severity, package, and capability.
- [x] 2.3 Add release-blocking behavior for conflicting product-ready claims.

## 3. Evidence

- [x] 3.1 Add acceptance fixtures for text, JSON, and JSONL output.
- [x] 3.2 Add golden tests proving output stability and redaction.
- [x] 3.3 Link diagnostics evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate expose-kernel-diagnostics-readiness --strict`.
- [x] 4.2 Run focused CLI diagnostics and acceptance tests.
