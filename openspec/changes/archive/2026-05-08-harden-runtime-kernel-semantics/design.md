## Context

The current runtime kernel is a good first proof: a built-in capability can flow through registry, envelope creation, workflow, policy, scheduler, bus, and CLI/VSCode event projection. The hardening review found that this is not yet enough for a future platform kernel: old headless runtime behavior still directly calls model execution, cancellation is not abort-backed, scheduler events are not part of the returned execution stream, envelope validation is shallow, registry projections are mutable, and event persistence failures lack a clear contract.

当前 runtime kernel 是一个有效的第一版 proof：built-in capability 可以流经 registry、envelope creation、workflow、policy、scheduler、bus 和 CLI/VSCode event projection。但 hardening review 发现它还不足以作为未来平台内核：旧 headless runtime behavior 仍直接调用 model execution，cancellation 没有 abort-backed，scheduler events 没有进入返回的 execution stream，envelope validation 过浅，registry projections 可变，event persistence failures 缺少清晰契约。

Because there is no production compatibility requirement yet, this change should remove transitional behavior and make kernel semantics strict. The testing framework and architecture lint must become the primary enforcement layer so failures are found by CI-style checks before manual review.

因为当前没有生产兼容要求，本变更应移除过渡行为并收紧 kernel semantics。testing framework 和 architecture lint 必须成为主要 enforcement layer，让问题在 manual review 前通过 CI-style checks 暴露。

## Goals / Non-Goals

**Goals:**

- Make `RuntimeKernel` the only executable runtime owner for default CLI, runtime, VSCode seam, tests, and future hosts.
- 让 `RuntimeKernel` 成为 default CLI、runtime、VSCode seam、tests 和未来 hosts 的唯一 executable runtime owner。
- Remove or rewrite legacy direct execution paths rather than preserving compatibility wrappers.
- 移除或重写 legacy direct execution paths，而不是保留兼容 wrapper。
- Add abort-backed cancellation and timeout semantics that executors can observe.
- 增加 executors 可观察的 abort-backed cancellation 和 timeout semantics。
- Make scheduler events available in the same canonical event stream returned by kernel execution.
- 让 scheduler events 出现在 kernel execution 返回的同一 canonical event stream 中。
- Strengthen envelope and registry invariants with contract tests and lint.
- 使用 contract tests 和 lint 强化 envelope 与 registry invariants。
- Make event persistence failures explicit and test-covered.
- 使 event persistence failures 明确且被测试覆盖。

**Non-Goals:**

- No remote daemon, distributed scheduler, real process sandbox, live provider integration, or production persistence backend.
- 不实现 remote daemon、distributed scheduler、real process sandbox、live provider integration 或 production persistence backend。
- No legacy compatibility layer for old `runTurn` semantics; tests and host adapters should be updated to the strict kernel path.
- 不为旧 `runTurn` semantics 保留 legacy compatibility layer；tests 和 host adapters 应更新到 strict kernel path。
- No broad UI redesign. CLI/VSCode changes are limited to enforcing kernel event consumption.
- 不做大范围 UI redesign。CLI/VSCode 变化只限于强制消费 kernel events。

## Decisions

### Decision: No legacy execution path

The old headless runtime path must be rewritten to call `RuntimeKernel` or removed from default host behavior. Model/tool/capability execution cannot happen inside app adapters or a separate `HeadlessAgentRuntime` state machine.

旧 headless runtime path 必须改写为调用 `RuntimeKernel`，或从默认 host behavior 中移除。model/tool/capability execution 不得发生在 app adapters 或独立 `HeadlessAgentRuntime` state machine 中。

Alternative considered: keep `runTurn` as compatibility and add lint warnings. Rejected because there is no production compatibility need and warnings are not kernel semantics.

### Decision: Cancellation is a first-class signal, not a flag

Scheduler task execution should create an `AbortController`, pass `AbortSignal` through task/capability context, and reject queued tasks before executor invocation when cancelled. Timeout is implemented as an abort reason and must be reflected in terminal task and runtime events.

scheduler task execution 应创建 `AbortController`，通过 task/capability context 传递 `AbortSignal`，并在 queued task 被取消时阻止 executor invocation。timeout 作为 abort reason 实现，并反映到 terminal task 与 runtime events。

Alternative considered: continue with cancellation maps and `Promise.race`. Rejected because it records cancellation but cannot stop side effects.

### Decision: Kernel event stream owns scheduler projection

Scheduler events must be surfaced through `kernel.execute()` in order, not only written to bus/session by a side subscription. This can be implemented by letting scheduler emit into an invocation-local event queue, or by making the scheduler return a streamable task handle.

scheduler events 必须通过 `kernel.execute()` 有序暴露，而不是只由 side subscription 写入 bus/session。实现方式可以是 scheduler 写入 invocation-local event queue，或 scheduler 返回 streamable task handle。

Alternative considered: hosts can subscribe to bus separately. Rejected because then every host recreates event coordination.

### Decision: Fail closed on invalid governance

Invalid envelope, missing policy decision, denied policy, malformed trace, unsupported side effect, bad timeout, or projection mutation must fail before scheduling. These failures must produce typed events and contract test failures.

invalid envelope、missing policy decision、denied policy、malformed trace、unsupported side effect、bad timeout 或 projection mutation 必须在 scheduling 前 fail closed。这些失败必须产生 typed events，并由 contract tests 捕获。

### Decision: Tests before review

Every reviewed hardening issue must have a corresponding test category: unit for scheduler/cancellation, contract for envelope/registry/event failure, integration for full kernel path, e2e for CLI/VSCode, golden for event sequence, and lint negative fixtures for bypass/legacy entry points.

每个 hardening review issue 都必须对应测试类别：scheduler/cancellation 用 unit，envelope/registry/event failure 用 contract，完整 kernel path 用 integration，CLI/VSCode 用 e2e，event sequence 用 golden，bypass/legacy entry points 用 lint negative fixtures。

## Risks / Trade-offs

- [Risk] Removing legacy path breaks existing tests or commands. → Mitigation: update them to kernel-backed behavior in the same change; no external compatibility is required.
- [风险] 移除 legacy path 会破坏现有测试或命令。→ 缓解：在同一变更中更新为 kernel-backed behavior；不要求外部兼容。
- [Risk] Abort semantics can be fake if executors ignore signals. → Mitigation: add negative tests with executors that would mutate after cancel unless signal is enforced.
- [风险] executors 忽略 signal 时 abort semantics 可能是假的。→ 缓解：增加 negative tests，使用取消后仍可能 mutation 的 executor，验证 signal 强制生效。
- [Risk] In-stream scheduler events can complicate ordering. → Mitigation: define golden event order and keep one canonical stream projection.
- [风险] in-stream scheduler events 会增加排序复杂度。→ 缓解：定义 golden event order，并保持一个 canonical stream projection。
- [Risk] Event persistence failure handling can hide data loss if too permissive. → Mitigation: classify bus/session write failures as terminal for replayable kernel events, while observability failure becomes typed degraded event.
- [风险] 事件持久化失败策略过宽会掩盖数据丢失。→ 缓解：bus/session write failures 对 replayable kernel events 视为 terminal；observability failure 转成 typed degraded event。

## Migration Plan

1. Update contracts for abort-aware scheduler and capability contexts.
2. Rewrite runtime entry points so default host behavior uses `RuntimeKernel` only.
3. Refactor scheduler to support queued cancellation, abort propagation, and event streaming.
4. Refactor kernel to return scheduler events in the execution stream and close workflow once.
5. Strengthen envelope validator and registry projection.
6. Add lint rules for legacy runtime entry points and direct bypasses.
7. Add failing-first tests for each reviewed issue, then implement until green.
8. Refresh acceptance evidence and archive the OpenSpec change.

## Open Questions

- Should `runTurn` remain as a kernel-backed API name for developer ergonomics, or should it be removed entirely? The implementation may keep the name only if it delegates to kernel and does not own execution state.
- Should event persistence failure use a strict all-or-nothing transaction later? First hardening should define clear semantics without requiring a production database.
