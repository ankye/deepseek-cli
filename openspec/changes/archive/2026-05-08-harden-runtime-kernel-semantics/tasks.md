## 1. Failing-First Tests

- [x] 1.1 Add scheduler unit tests proving queued cancellation never calls executor and running timeout aborts executor through `AbortSignal`.
- [x] 1.2 Add runtime contract tests proving invalid envelope timeout, malformed trace, missing governance fields, and denied policy fail before scheduler submission.
- [x] 1.3 Add registry contract tests proving host/model-visible projections are immutable deep copies and cannot expose executor bindings.
- [x] 1.4 Add kernel integration tests proving scheduler queued/started/completed/cancelled/timed-out events appear in the same `kernel.execute()` stream.
- [x] 1.5 Add bus/session/observability failure tests proving replayable persistence failures fail closed and observability failures are explicit degraded events.
- [x] 1.6 Add CLI/VSCode e2e tests proving default host paths are kernel-backed and do not require separate bus subscriptions.
- [x] 1.7 Add golden replay tests for strict kernel event order including scheduler events and exactly one workflow closure.
- [x] 1.8 Add architecture lint negative fixtures for legacy runtime entry points, direct model stream calls, direct scheduler/policy/workflow/bus calls from hosts, and direct capability executor resolution outside approved owners.

## 2. Contracts

- [x] 2.1 Add abort-aware task execution context and `AbortSignal` propagation to scheduler and capability execution contracts.
- [x] 2.2 Strengthen `ExecutionEnvelope` contract fields with stricter typed metadata for side effect, trust, timeout, trace, schemas, cancellation, retry, idempotency, and replay.
- [x] 2.3 Add typed kernel errors for event persistence failure, observability degradation, invalid timeout, malformed trace, and legacy execution rejection.
- [x] 2.4 Update runtime API contracts so ergonomic methods such as `runTurn` are allowed only as thin kernel delegates.

## 3. Scheduler Hardening

- [x] 3.1 Refactor deterministic scheduler to track queued task records instead of anonymous callbacks.
- [x] 3.2 Implement queued cancellation removal and terminal cancelled events without invoking executor.
- [x] 3.3 Implement running timeout through `AbortController` and propagate abort reason to task context.
- [x] 3.4 Ensure scheduler emits deterministic queued, running, completed, failed, cancelled, and timed-out events with trace metadata and no duplicate terminal events.
- [x] 3.5 Add bounded queue/backpressure behavior that returns typed failures instead of unbounded growth.

## 4. Kernel Hardening

- [x] 4.1 Rewrite runtime default turn execution so all executable work enters `RuntimeKernel`; remove or rewrite legacy direct model execution paths.
- [x] 4.2 Refactor `RuntimeKernel.execute` to merge scheduler lifecycle events into the returned canonical event stream in deterministic order.
- [x] 4.3 Pass abort-aware capability context to executors and ensure cancelled/timed-out invocations close workflow exactly once.
- [x] 4.4 Strengthen envelope builder and validator with type checks, enum checks, timeout bounds, trace shape, schema metadata, policy metadata, cancellation metadata, replay metadata, and idempotency metadata.
- [x] 4.5 Implement explicit event persistence failure handling for session, bus, and observability writes.
- [x] 4.6 Ensure policy and sandbox decisions are mandatory after validation and before scheduling, and invalid envelopes never reach policy.

## 5. Registry and Projection Hardening

- [x] 5.1 Deep clone and freeze capability manifest projections returned to hosts and model-visible consumers.
- [x] 5.2 Keep executor binding resolution available only to runtime kernel and primitive owner packages, with lint enforcement for hosts/non-owners.
- [x] 5.3 Add tests proving host mutation attempts cannot alter stored registry metadata.

## 6. Host and Lint Enforcement

- [x] 6.1 Make default CLI prompt behavior kernel-backed and remove separate legacy state-machine output assumptions.
- [x] 6.2 Keep VSCode adapter as kernel event projection only and add tests proving it never imports CLI or calls primitives directly.
- [x] 6.3 Extend AST lint with stable rule ids for legacy runtime direct execution and direct kernel primitive bypass from host adapters.
- [x] 6.4 Add lint tests proving violations fail before implementation review.

## 7. Acceptance

- [x] 7.1 Run `npm run lint`.
- [x] 7.2 Run `npm run typecheck`.
- [x] 7.3 Run `npm test`.
- [x] 7.4 Run targeted suites: `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, `npm run test:e2e`, `npm run test:compatibility`, and `npm run test:matrix`.
- [x] 7.5 Run kernel smoke through the default CLI prompt and explicit kernel command.
- [x] 7.6 Run `openspec validate harden-runtime-kernel-semantics --type change --strict`.
- [x] 7.7 Run `openspec validate --specs --strict`.
- [x] 7.8 Update acceptance evidence and regenerate `tests/acceptance/acceptance-index.md`.
- [x] 7.9 Archive the OpenSpec change only after all tasks and validation pass.
