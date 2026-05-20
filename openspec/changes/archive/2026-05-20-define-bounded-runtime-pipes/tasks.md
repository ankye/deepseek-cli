## 1. Pipe Model

- [x] 1.1 Inventory runtime-message-bus channels and protocol streams.
- [x] 1.2 Define capacity, pressure, sequence, overflow, and replay metadata.
- [x] 1.3 Classify streams as lossless, compactable, summarizable, or fail-closed.

## 2. Implementation

- [x] 2.1 Add bounded channel configuration and pressure events.
- [x] 2.2 Add protocol metadata for stream id, sequence, pressure, and loss policy.
- [x] 2.3 Add diagnostics for blocked writers, dropped records, compaction, and fail-closed streams.

## 3. Evidence

- [x] 3.1 Add deterministic tests for pressure transitions and overflow policies.
- [x] 3.2 Add replay tests for lossless and compacted streams.
- [x] 3.3 Link pipe/backpressure evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate define-bounded-runtime-pipes --strict`.
- [x] 4.2 Run focused runtime-message-bus and communication-protocol tests.
- [x] 4.3 Run `npm run test:golden` for replay-affecting streams.
