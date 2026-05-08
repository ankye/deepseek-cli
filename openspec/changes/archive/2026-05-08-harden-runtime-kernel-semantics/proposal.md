## Why

The first runtime kernel proves the control-plane path, but it still tolerates legacy runtime execution, weak cancellation, shallow envelope validation, incomplete scheduler event streaming, and review-time discovery of problems that should fail in tests and lint. Because DeepSeek CLI has not shipped, we should make the kernel semantics strict now instead of preserving transitional behavior.

第一版 runtime kernel 已经证明控制面路径可跑通，但仍容忍 legacy runtime execution、弱取消、浅 envelope validation、不完整 scheduler event streaming，以及本应由测试和 lint 发现却留到审查阶段的问题。DeepSeek CLI 尚未上线，所以现在应直接收紧内核语义，而不是保留过渡兼容。

## What Changes

- **BREAKING**: Remove legacy execution paths from default CLI/runtime behavior; all executable runtime work MUST enter `RuntimeKernel`.
- **BREAKING**：移除默认 CLI/runtime 行为中的 legacy execution paths；所有 executable runtime work 必须进入 `RuntimeKernel`。
- Harden cancellation and timeout semantics with explicit abort propagation, queued-task cancellation, running-task timeout, and no post-cancel executor start.
- 通过明确 abort propagation、queued-task cancellation、running-task timeout 和取消后禁止 executor start 来强化 cancellation/timeout 语义。
- Make scheduler lifecycle events part of the kernel's canonical event stream, not only side-channel bus/session records.
- 将 scheduler lifecycle events 纳入 kernel canonical event stream，而不是只写入 bus/session side channel。
- Strengthen execution envelope validation with required type checks, enum checks, timeout bounds, trace shape, schema metadata, and governance fields.
- 强化 execution envelope validation，覆盖 required type checks、enum checks、timeout bounds、trace shape、schema metadata 和 governance fields。
- Harden capability registry projection so hosts receive immutable metadata and cannot resolve executable bindings.
- 强化 capability registry projection，使 host 只能获得 immutable metadata，不能解析 executable bindings。
- Define bus/session/observability failure semantics so event persistence failures cannot be silently swallowed or randomly tear down execution.
- 定义 bus/session/observability failure semantics，避免事件持久化失败被静默吞掉或随机破坏 execution。
- Extend architecture lint to forbid direct model/capability/scheduler/policy/workflow/bus execution from host adapters and non-owner packages, and to forbid new legacy runtime entry points.
- 扩展 architecture lint，禁止 host adapters 和 non-owner packages 直接执行 model/capability/scheduler/policy/workflow/bus，并禁止新增 legacy runtime entry points。
- Promote test-first hardening: contract, negative lint, integration, scheduler, cancellation, timeout, event-order, e2e, and golden replay tests must expose these failures before code review.
- 推进 test-first hardening：contract、negative lint、integration、scheduler、cancellation、timeout、event-order、e2e 和 golden replay tests 必须在 code review 前暴露这些问题。

## Capabilities

### New Capabilities

<!-- No new capability area is introduced. This change hardens existing runtime platform capabilities. -->

### Modified Capabilities

- `runtime-execution-kernel`: Kernel becomes the only runtime execution owner, exposes abort-aware execution, emits scheduler events in-stream, and defines strict event persistence failure behavior.
- `runtime-event-loop`: Headless turns must be kernel-backed; legacy direct model/tool execution paths are removed from default runtime behavior.
- `concurrency-orchestration`: Scheduler must enforce queued cancellation, abort propagation, timeout semantics, and no executor start after cancellation.
- `capability-execution-governance`: Execution envelope validation must be strict and test-covered, not existence-only.
- `capability-registry`: Host projection must be immutable/metadata-only, and executable bindings must be kernel-only.
- `runtime-message-bus`: Bus publish/subscription/backpressure failures must have explicit kernel handling semantics.
- `workflow-orchestration`: Workflow events must stay in the same canonical kernel event stream and close exactly once per invocation.
- `policy-sandbox`: Policy and sandbox decisions must be mandatory before scheduling and must fail closed on invalid envelopes or denied side effects.
- `command-system`: CLI commands must not execute runtime work outside kernel-backed commands.
- `vscode-extension-adapter`: VSCode projection must only consume kernel event streams and must not call execution primitives.
- `testing-regression`: Tests must be the primary enforcement surface for kernel hardening, with golden replay and negative tests covering previously review-discovered risks.

## Impact

- Affects runtime contracts, runtime implementation, scheduler, registry, bus, workflow, policy/sandbox, CLI, VSCode adapter, lint framework, and test suites.
- 影响 runtime contracts、runtime implementation、scheduler、registry、bus、workflow、policy/sandbox、CLI、VSCode adapter、lint framework 和测试套件。
- This change intentionally favors correctness and future maintainability over compatibility. Existing tests and commands may be rewritten to use the kernel directly.
- 本变更明确优先 correctness 和 future maintainability，而不是 compatibility。现有 tests 和 commands 可以重写为直接使用 kernel。
- Acceptance requires failures to be discoverable through tests/lint before manual review, including cancellation, timeout, event ordering, direct-bypass, and legacy-path regressions.
- 验收要求 cancellation、timeout、event ordering、direct-bypass 和 legacy-path regressions 能在 manual review 前通过 tests/lint 发现。
