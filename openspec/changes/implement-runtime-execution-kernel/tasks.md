## 1. Contracts

- [ ] 1.1 Define runtime kernel, execution request, execution envelope, execution result, runtime event, host projection, scheduler, policy, workflow, and capability binding contracts in `src/packages/platform-contracts`.
- [ ] 1.2 Add typed error contracts for kernel configuration errors, registry misses, envelope validation failures, policy denials, scheduler timeouts, cancellation, and executor failures.
- [ ] 1.3 Ensure contract exports are stable from package index files and do not introduce reverse dependencies from contracts to implementations.

## 2. Core Implementations

- [ ] 2.1 Implement the in-process runtime message bus with ordered publish/subscribe and typed event metadata.
- [ ] 2.2 Implement the built-in executable capability registry with metadata-safe host projection and kernel-only executor resolution.
- [ ] 2.3 Implement the execution envelope builder and validator for kernel invocations.
- [ ] 2.4 Implement the deterministic policy/sandbox decision interface for read-only allow, side-effect denial, audit metadata, and sandbox profile selection.
- [ ] 2.5 Implement the in-process scheduler queue with concurrency limit, queued/running/settled events, timeout, cancellation, and trace propagation.
- [ ] 2.6 Implement the minimal workflow/task boundary for kernel invocations and terminal workflow closure.

## 3. Runtime Kernel

- [ ] 3.1 Implement `RuntimeKernel` construction with explicit dependency injection, lifecycle state, start, execute, cancel, and shutdown operations.
- [ ] 3.2 Wire kernel execution through registry lookup, envelope creation, workflow opening, policy/sandbox decision, scheduler submission, message bus events, and result normalization.
- [ ] 3.3 Add at least one deterministic built-in capability such as `runtime.echo` that proves the full governed execution path.
- [ ] 3.4 Ensure unknown capabilities, invalid envelopes, policy denials, executor failures, cancellations, and timeouts emit typed terminal events.

## 4. Host Adapters

- [ ] 4.1 Add a CLI kernel-backed command that submits governed runtime work and maps terminal kernel events to process output and exit codes.
- [ ] 4.2 Preserve or add stream-json output where each line is a serialized canonical runtime event.
- [ ] 4.3 Add or update VSCode extension adapter seam code/docs so it consumes shared runtime contracts and never imports CLI command implementation.

## 5. Architecture Lint

- [ ] 5.1 Extend the AST lint governed-execution rule to include the runtime kernel, capability executors, scheduler, policy/sandbox, and host adapter bypass boundaries introduced by this change.
- [ ] 5.2 Add negative and positive lint tests proving CLI/VSCode/non-owner packages cannot directly call governed primitives while runtime, owner packages, tests, and deterministic fakes remain allowed.

## 6. Tests

- [ ] 6.1 Add contract tests for kernel construction, envelope validation, registry lookup/projection, scheduler task handles, bus events, policy decisions, and typed errors.
- [ ] 6.2 Add integration tests for the deterministic built-in capability through registry, envelope, workflow, policy, scheduler, bus, execution, result, and replay metadata.
- [ ] 6.3 Add cancellation and timeout tests for queued and running scheduler tasks submitted by the kernel.
- [ ] 6.4 Add e2e tests for the CLI kernel-backed command in normal and stream-json modes.
- [ ] 6.5 Add golden/regression replay tests that compare normalized kernel invocation traces.

## 7. Acceptance

- [ ] 7.1 Run `npm run lint`.
- [ ] 7.2 Run `npm run typecheck`.
- [ ] 7.3 Run `npm test`.
- [ ] 7.4 Run targeted suites: `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, and `npm run test:e2e`.
- [ ] 7.5 Run `openspec validate implement-runtime-execution-kernel --type change --strict`.
- [ ] 7.6 Run `openspec validate --specs --strict`.
- [ ] 7.7 Update acceptance evidence under `tests/acceptance/latest` and regenerate `tests/acceptance/acceptance-index.md`.
- [ ] 7.8 Archive the OpenSpec change only after all tasks and validation pass.
