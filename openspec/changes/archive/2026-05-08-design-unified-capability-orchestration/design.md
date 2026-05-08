## Context

The first framework created many platform capabilities, but execution ownership is still implicit. Without a shared governance model, skills, plugins, hooks, MCP tools, commands, model calls, sandbox jobs, background tasks, and subagents can grow their own execution paths.

第一版框架已经创建了很多平台能力，但执行归属仍然是隐式的。如果没有共享治理模型，skill、plugin、hook、MCP tool、command、model call、sandbox job、background task 和 subagent 会各自长出执行路径。

The design goal is to define a platform control plane, not a large immediate scheduler implementation.

本设计目标是定义平台控制面，而不是立即实现一个庞大的调度器。

## Goals / Non-Goals

**Goals:**

- Define which capability forms are metadata-only, projectable, executable, or scheduled.
- 定义哪些能力形态属于 metadata-only、projectable、executable 或 scheduled。
- Define a unified execution envelope that carries identity, caller, scope, policy, resources, timeout, retry, trace, redaction, and replay metadata.
- 定义统一 execution envelope，承载 identity、caller、scope、policy、resources、timeout、retry、trace、redaction 和 replay metadata。
- Define the boundary between workflow orchestration and concurrency scheduling.
- 定义 workflow orchestration 与 concurrency scheduling 的边界。
- Require hooks, plugins, skills, MCP, commands, model calls, sandbox jobs, background jobs, and future subagents to enter the same governed execution pipeline when they execute.
- 要求 hook、plugin、skill、MCP、command、model call、sandbox job、background job 和未来 subagent 在执行时进入同一条受治理执行管线。
- Add lint enforcement so direct low-level execution calls cannot spread outside approved execution owners.
- 增加 lint enforcement，防止低层执行调用在 approved execution owners 之外扩散。

**Non-Goals:**

- Implement a distributed scheduler, daemon, queue service, plugin marketplace, or full multi-agent runtime in this change.
- 本变更不实现 distributed scheduler、daemon、queue service、plugin marketplace 或完整 multi-agent runtime。
- Remove existing deterministic in-process runtime behavior.
- 不移除当前 deterministic in-process runtime 行为。
- Force metadata registration, manifest discovery, or read-only projection through heavy scheduling.
- 不强制 metadata registration、manifest discovery 或 read-only projection 进入重型调度。

## Decisions

### Decision 1: Four capability levels

Capabilities are classified by runtime effect:

能力按运行时影响分级：

```text
L0 Metadata    manifest/profile/template/config only
L1 Projection  contributes bounded context, model-visible schema, host render hint
L2 Execution   invokes code, external systems, model streams, hooks, tools, commands
L3 Scheduled   async, cancellable, resource-consuming, side-effecting, retryable, or long-running execution
```

L0 and L1 can remain lightweight. L2 must use an execution envelope. L3 must additionally use workflow planning and concurrency scheduling.

L0 和 L1 可以保持轻量。L2 必须使用 execution envelope。L3 还必须进入 workflow planning 和 concurrency scheduling。

### Decision 2: Execution envelope is the governance contract

Every executable capability is normalized into an `ExecutionEnvelope`.

每个可执行能力都会被规范化为 `ExecutionEnvelope`。

```text
ExecutionEnvelope
├─ identity: invocationId, capabilityId, contributionId, version, kind
├─ caller: host/user/agent/plugin/skill/hook/workflow and parentInvocationId
├─ scope: sessionId, turnId, workflowId, taskId, stepId, agentId
├─ input/output: schemas, payload, redaction, provenance
├─ constraints: trust, permissions, sideEffect, policyContext, approval, sandbox
├─ resources: locks, budgets, timeout, deadline, cancellation, retry, idempotency
└─ observability: trace, telemetry, audit, replayPolicy
```

This keeps policy, sandbox, scheduler, bus, host rendering, and regression replay aligned.

这会让 policy、sandbox、scheduler、bus、host rendering 和 regression replay 保持一致。

### Decision 3: Workflow owns semantics; scheduler owns resources

Workflow orchestration decides what should happen and in what dependency order.

workflow orchestration 决定要做什么以及依赖顺序。

Concurrency scheduling decides when execution can run and under which resource controls.

concurrency scheduling 决定何时执行以及使用哪些资源控制。

```text
User intent
   ↓
Workflow graph: step, dependency, checkpoint, rollback, handoff
   ↓
Execution envelope
   ↓
Scheduler: lock, deadline, cancellation, retry, rate limit, backpressure
   ↓
Executor: model/tool/hook/skill/MCP/sandbox/agent
```

Workflow must not directly implement locks or rate limits. Scheduler must not invent business steps.

workflow 不直接实现锁或限流。scheduler 不创造业务步骤。

### Decision 4: Same pipeline, different entry points

- Plugins contribute capabilities; plugin install/update/migration is executable work.
- plugins 贡献能力；plugin install/update/migration 是可执行工作。
- Skills can be context-only, tool-backed, workflow-backed, or sandboxed; non-context-only modes use governed execution.
- skills 可以是 context-only、tool-backed、workflow-backed 或 sandboxed；非 context-only 模式使用受治理执行。
- Hooks can observe cheaply, but any side effect or runtime mutation uses governed execution.
- hooks 可以轻量观察，但任何副作用或 runtime mutation 都使用受治理执行。
- MCP tools/resources/prompts cross an external trust boundary and always use governed invocation when fetched or executed.
- MCP tools/resources/prompts 跨越外部信任边界，fetch 或 execute 时始终使用受治理调用。
- Subagents are workflow nodes plus scheduler tasks with delegation metadata.
- subagents 是带 delegation metadata 的 workflow nodes 与 scheduler tasks。

### Decision 5: Hosts consume canonical events

CLI, VSCode, tests, CI, and future server modes consume the same canonical execution/runtime events. Hosts project and render; they do not own execution state machines.

CLI、VSCode、tests、CI 和未来 server modes 消费同一套 canonical execution/runtime events。host 只负责投影和渲染，不拥有执行状态机。

Canonical events include requested, policy-checked, approval-required, scheduled, started, progress, completed, failed, cancelled, rolled-back, and replay-recorded states.

canonical events 包括 requested、policy-checked、approval-required、scheduled、started、progress、completed、failed、cancelled、rolled-back 和 replay-recorded。

### Decision 6: Lint enforces the first hard boundary

The first enforcement step is architecture lint. Direct calls to governed execution APIs are allowed only in approved execution owners, tests, deterministic fakes, or the package that owns the primitive.

第一步 enforcement 落在 architecture lint。对 governed execution APIs 的直接调用只允许出现在 approved execution owners、tests、deterministic fakes 或拥有该 primitive 的包内。

Approved owners initially include the runtime kernel and deterministic testing/regression package because the full execution pipeline is not yet implemented.

初始 approved owners 包括 runtime kernel 和 deterministic testing/regression package，因为完整 execution pipeline 尚未实现。

## Risks / Trade-offs

- [Risk] Over-centralization could slow simple metadata operations. → Mitigation: only L2/L3 execution enters envelopes/scheduling; L0/L1 remains lightweight.
- [风险] 过度中心化可能拖慢简单 metadata 操作。→ 缓解：只有 L2/L3 execution 进入 envelopes/scheduling；L0/L1 保持轻量。
- [Risk] Existing runtime still calls some primitives directly. → Mitigation: lint allows runtime as the temporary execution owner and future tasks can replace direct calls with an executor service.
- [风险] 现有 runtime 仍然直接调用部分 primitive。→ 缓解：lint 暂时允许 runtime 作为 execution owner，未来任务再替换为 executor service。
- [Risk] Rule false positives could block useful tests or package internals. → Mitigation: lint allows test files and owning packages, and includes regression tests for valid/invalid cases.
- [风险] 规则误报可能阻碍测试或包内部实现。→ 缓解：lint 允许 test files 与 owning packages，并加入 valid/invalid 回归测试。

## Migration Plan

1. Define OpenSpec requirements for capability execution governance and related capability deltas.
2. 定义 capability execution governance 及相关能力 delta requirements。
3. Add lint policy for direct governed execution calls.
4. 添加 direct governed execution calls 的 lint policy。
5. Add lint regression tests proving violations are caught.
6. 添加 lint regression tests，证明违规会被捕获。
7. Future implementation can introduce an `ExecutionOrchestrator` package that replaces runtime-owned direct primitive calls.
8. 未来实现可引入 `ExecutionOrchestrator` package，用它替代 runtime 当前拥有的直接 primitive 调用。

## Open Questions

- Should `ExecutionEnvelope` live in `platform-contracts` or a dedicated `capability-execution-governance` package during implementation?
- `ExecutionEnvelope` 实现时应放在 `platform-contracts` 还是独立 `capability-execution-governance` package？
- Should first execution owner be runtime only, or should workflow own the executor service?
- 第一版 execution owner 应该只有 runtime，还是由 workflow 持有 executor service？
- How much host-specific approval rendering belongs in protocol events versus host projection adapters?
- host-specific approval rendering 应该有多少放在 protocol events，多少放在 host projection adapters？
