## Context

The previous architecture changes established DeepSeek CLI as a platform with governed capabilities, scheduler boundaries, message bus events, workflow orchestration, policy/sandbox seams, and separate CLI/VSCode hosts. The repository now contains the package layout and lint framework, but the runtime path is still mostly skeletal.

前序架构变更已经把 DeepSeek CLI 定义为一个平台：具备 governed capabilities、scheduler boundaries、message bus events、workflow orchestration、policy/sandbox seams，以及分离的 CLI/VSCode hosts。当前仓库已经有包结构和 lint 框架，但 runtime path 仍主要是骨架。

This change creates the first executable runtime kernel. It must be small enough to implement and verify in one step, but shaped so future model streaming, skills, plugins, MCP, hooks, memory/cache, workflows, daemon/server, and VSCode UI can reuse the same execution control plane.

本变更创建第一个可执行 runtime kernel。它必须足够小，可以一次实现和验证；同时架构形态必须能承载未来 model streaming、skills、plugins、MCP、hooks、memory/cache、workflows、daemon/server 和 VSCode UI。

## Goals / Non-Goals

**Goals:**

- Provide a concrete `RuntimeKernel` construction API with explicit dependencies and deterministic lifecycle.
- 提供具体 `RuntimeKernel` construction API，依赖显式注入，生命周期可确定。
- Normalize runtime work into a governed `ExecutionEnvelope` before execution.
- 在执行前将 runtime work 规范化为 governed `ExecutionEnvelope`。
- Execute the first built-in capabilities through registry, policy/sandbox seams, scheduler, message bus, and result normalization.
- 通过 registry、policy/sandbox seams、scheduler、message bus 和 result normalization 执行第一批 built-in capabilities。
- Give CLI one headless command that consumes runtime events and proves host adapters do not own runtime state machines.
- 给 CLI 一个 headless command，用 runtime events 驱动输出，证明 host adapter 不拥有 runtime state machine。
- Add contract, integration, e2e, replay, and architecture lint coverage for the kernel.
- 增加 contract、integration、e2e、replay 和 architecture lint 覆盖。

**Non-Goals:**

- No distributed scheduler, daemon process, remote worker pool, or long-running background service.
- 不实现 distributed scheduler、daemon process、remote worker pool 或长期后台服务。
- No full model provider integration; deterministic fake/model echo capability is enough for kernel proof.
- 不做完整 model provider integration；确定性的 fake/model echo capability 足以证明内核。
- No full VSCode UI; only the adapter seam and event consumption contract are required.
- 不做完整 VSCode UI；只要求 adapter seam 与 event consumption contract。
- No full sandbox enforcement matrix; policy and sandbox are explicit interfaces with deterministic first decisions.
- 不做完整 sandbox enforcement matrix；policy 和 sandbox 是显式接口，第一版只实现确定性决策。

## Decisions

### Decision: Build an in-process kernel first

The first kernel will run in-process inside CLI/tests and expose host-neutral APIs. This keeps implementation deterministic, removes process coordination risk, and still preserves the contracts needed for future daemon/server modes.

第一版 kernel 运行在 CLI/tests 进程内，并暴露 host-neutral APIs。这样实现可确定，避免进程协调风险，同时保留未来 daemon/server modes 所需契约。

Alternative considered: start with a daemon/server runtime. Rejected because the first priority is contract correctness, deterministic tests, and architecture boundaries, not remote lifecycle complexity.

### Decision: Keep contracts in `platform-contracts`, implementations in owning packages

Runtime, envelope, scheduler, bus, capability, workflow, policy, and host adapter types should live in `src/packages/platform-contracts`. Implementations belong to their owning packages: `runtime`, `capability-registry`, `concurrency-orchestration`, `runtime-message-bus`, `workflow-orchestration`, and `policy-sandbox`.

Runtime、envelope、scheduler、bus、capability、workflow、policy 和 host adapter 类型放在 `src/packages/platform-contracts`。实现放在各自 owner package：`runtime`、`capability-registry`、`concurrency-orchestration`、`runtime-message-bus`、`workflow-orchestration` 和 `policy-sandbox`。

Alternative considered: put all types and implementation in `runtime`. Rejected because it would make runtime a god package and weaken package boundaries.

### Decision: Runtime owns orchestration, scheduler owns concurrency

`runtime` constructs the envelope, starts the workflow/task boundary, asks policy/sandbox for decisions, submits executable work to the scheduler, and publishes bus events. `concurrency-orchestration` owns queueing, timeout, cancellation, concurrency limits, and resource lock hooks. Workflow records semantic task/step intent but does not acquire locks.

`runtime` 负责构建 envelope、启动 workflow/task boundary、调用 policy/sandbox 决策、把 executable work 提交给 scheduler，并发布 bus events。`concurrency-orchestration` 负责 queueing、timeout、cancellation、concurrency limits 和 resource lock hooks。Workflow 记录语义任务/步骤意图，但不获取锁。

Alternative considered: workflow executes everything directly. Rejected because workflow should express plan semantics, not own resource enforcement.

### Decision: All hosts consume one canonical event stream

CLI, tests, future VSCode, and future server mode consume `RuntimeEvent`/`ExecutionEvent` streams from the bus/kernel. Hosts can render differently, but they must not create separate execution state machines for task lifecycle.

CLI、tests、未来 VSCode 和未来 server mode 都消费 bus/kernel 的 `RuntimeEvent`/`ExecutionEvent` streams。Host 可以用不同方式渲染，但不能为 task lifecycle 创建独立 execution state machine。

Alternative considered: CLI direct command output while VSCode later uses richer events. Rejected because it would immediately split runtime semantics.

### Decision: First built-in capability proves the full path

The first implementation should include a deterministic built-in capability, such as `runtime.echo` or `runtime.inspect`, registered through the capability registry and executed through the governed pipeline. It must emit envelope, policy, scheduler, start, progress/output, completion, and replayable result events.

第一版实现需要包含一个确定性的 built-in capability，例如 `runtime.echo` 或 `runtime.inspect`，通过 capability registry 注册，并通过 governed pipeline 执行。它必须发出 envelope、policy、scheduler、start、progress/output、completion 和 replayable result events。

Alternative considered: only implement abstract interfaces. Rejected because architecture cannot be trusted until one real path is tested end to end.

### Decision: Architecture lint enforces the kernel boundary

The existing AST lint framework will be extended so CLI/VSCode/non-owner packages cannot call governed primitives directly. Runtime and primitive-owner packages remain approved execution owners. Tests and deterministic fakes remain allowed.

现有 AST lint 框架需要扩展，禁止 CLI/VSCode/non-owner packages 直接调用 governed primitives。Runtime 和 primitive-owner packages 仍是 approved execution owners。Tests 和 deterministic fakes 仍允许。

Alternative considered: rely on documentation and code review. Rejected because this is a platform invariant and must fail fast.

## Risks / Trade-offs

- [Risk] A minimal kernel can become too abstract and not prove real execution. → Mitigation: require at least one built-in capability and one CLI e2e path through the full pipeline.
- [风险] 最小 kernel 可能过于抽象，无法证明真实执行。→ 缓解：要求至少一个 built-in capability 和一个 CLI e2e path 经过完整 pipeline。
- [Risk] Event schemas can churn as future systems arrive. → Mitigation: start with versioned, discriminated event types and normalized replay snapshots.
- [风险] 未来系统加入时 event schemas 可能频繁变化。→ 缓解：第一版就使用 versioned、discriminated event types 和 normalized replay snapshots。
- [Risk] Scheduler scope can grow into workflow responsibility. → Mitigation: keep workflow semantic and make scheduler the only owner of queue/timeout/cancellation/concurrency.
- [风险] scheduler scope 可能膨胀进 workflow 责任。→ 缓解：workflow 保持语义层，scheduler 独占 queue/timeout/cancellation/concurrency。
- [Risk] Stubbed policy/sandbox can hide real security gaps. → Mitigation: make decisions explicit, evented, and test-covered even when enforcement is deterministic.
- [风险] stubbed policy/sandbox 可能掩盖真实安全缺口。→ 缓解：即使第一版 enforcement 是确定性的，decision 也必须显式、事件化、测试覆盖。

## Migration Plan

1. Add or refine platform contract types for runtime kernel, execution envelope, capability bindings, scheduler task handles, bus events, policy decisions, and host projections.
2. Implement deterministic in-process components in the owning packages.
3. Wire `src/apps/cli` to call the runtime kernel for one headless command and stream canonical events.
4. Add VSCode adapter seam documentation or minimal code that consumes the same event stream.
5. Extend architecture lint and add negative tests for direct primitive bypass.
6. Add contract, integration, e2e, and regression tests.
7. Update acceptance evidence and validate OpenSpec.

Rollback is simple before release: revert the change or disable the new CLI command. The contracts are additive and should not break existing skeletal packages.

## Open Questions

- Should the first CLI command be named `deepseek run`, `deepseek task run`, or a hidden smoke command? The implementation should choose the least disruptive command while keeping the runtime path visible to tests.
- Should replay snapshots live under `tests/golden` immediately or be generated into acceptance evidence first? The implementation should prefer deterministic golden tests if stable enough.
