# runtime-execution-kernel Specification

## Purpose
Define runtime execution kernel requirements for single-entry execution, envelopes, scheduler handoff, policy handoff, bus events, and kernel boundaries.

定义 runtime execution kernel 对 single-entry execution、envelopes、scheduler handoff、policy handoff、bus events 与 kernel boundaries 的要求。

## Requirements
### Requirement: Runtime Kernel Construction

The platform SHALL provide a concrete in-process runtime kernel factory that receives all runtime dependencies explicitly and does not read host UI state during construction.

平台必须提供一个具体的 in-process runtime kernel factory，所有 runtime dependencies 都显式传入，构造阶段不得读取 host UI state。

#### Scenario: Construct kernel with explicit dependencies

- **WHEN** tests or a host adapter constructs the runtime kernel with registry, scheduler, message bus, policy/sandbox, workflow, session, clock, id generator, and logger dependencies
- **THEN** the kernel initializes without requiring terminal UI, VSCode APIs, global process flags, or network access

#### Scenario: Reject missing required dependencies

- **WHEN** a required runtime dependency is absent
- **THEN** kernel construction fails with a typed configuration error before any executable work starts

### Requirement: Runtime Kernel Lifecycle

The runtime kernel SHALL expose deterministic start, execute, cancel, and shutdown lifecycle operations.

runtime kernel 必须暴露 deterministic start、execute、cancel 和 shutdown lifecycle operations。

#### Scenario: Start and shutdown cleanly

- **WHEN** the kernel starts and then shuts down without active work
- **THEN** it emits lifecycle events and releases scheduler, bus, and session resources deterministically

#### Scenario: Shutdown cancels active work

- **WHEN** shutdown is requested while executable work is active
- **THEN** the kernel requests cancellation, emits cancellation events, waits for scheduler settlement, and rejects new work

### Requirement: Governed Kernel Invocation

Every executable runtime request submitted to the kernel SHALL be normalized into an execution envelope and routed through registry, workflow, policy/sandbox, scheduler, and message bus boundaries.

提交给 kernel 的每个 executable runtime request 都必须规范化为 execution envelope，并通过 registry、workflow、policy/sandbox、scheduler 和 message bus boundaries。

#### Scenario: Execute built-in capability through kernel

- **WHEN** a host submits a built-in capability invocation such as `runtime.echo`
- **THEN** the kernel creates an execution envelope, resolves the capability from the registry, opens a workflow task boundary, evaluates policy/sandbox, schedules the work, emits canonical events, and returns a normalized result

#### Scenario: Unknown capability fails before scheduling

- **WHEN** a host submits an invocation for an unregistered capability id
- **THEN** the kernel emits a typed rejection event and does not schedule executable work

### Requirement: Host-Neutral Runtime Events

The runtime kernel SHALL return an asynchronous stream of canonical runtime events that can be consumed by CLI, tests, VSCode, CI, and future server adapters.

runtime kernel 必须返回 canonical runtime events 的 asynchronous stream，供 CLI、tests、VSCode、CI 和未来 server adapters 共同消费。

#### Scenario: CLI renders kernel events

- **WHEN** the CLI invokes a kernel-backed command
- **THEN** CLI output is derived from runtime events rather than a CLI-owned execution state machine

#### Scenario: Tests consume the same events

- **WHEN** integration tests invoke the same kernel request as CLI
- **THEN** they observe the same normalized event sequence before host-specific rendering

### Requirement: Runtime Events Carry CreatedAt / Runtime Events 携带 CreatedAt

Runtime events SHALL include a canonical ISO `createdAt` timestamp that is stable for replay and persistence correlation.

Runtime events 必须包含 canonical ISO `createdAt` timestamp，用于 replay 与 persistence correlation。

#### Scenario: Runtime event has createdAt / Runtime Event 有 CreatedAt

- **WHEN** runtime emits any canonical event
- **THEN** the event includes a parseable ISO `createdAt` timestamp
- **中文** 当 runtime 发出任意 canonical event 时，该 event 必须包含可解析的 ISO `createdAt` timestamp。

#### Scenario: Persisted event timestamp matches event / 持久化事件时间匹配

- **WHEN** runtime persists an emitted event to session records or bus envelopes
- **THEN** the persisted timestamp uses the event `createdAt` value rather than an unrelated host timestamp
- **中文** 当 runtime 将 emitted event 持久化到 session records 或 bus envelopes 时，持久化 timestamp 必须使用该 event 的 `createdAt` 值，而不是无关的 host timestamp。

### Requirement: Kernel Acceptance Evidence

The first runtime kernel implementation SHALL update acceptance evidence for contracts, integration, e2e, replay, lint, and OpenSpec validation.

第一版 runtime kernel implementation 必须更新 contracts、integration、e2e、replay、lint 和 OpenSpec validation 的 acceptance evidence。

#### Scenario: Acceptance index references kernel checks

- **WHEN** acceptance evidence is regenerated
- **THEN** it includes runtime kernel contract, integration, e2e, regression, and lint results

### Requirement: Single Kernel Execution Owner

The runtime kernel SHALL be the only owner of executable runtime work in default CLI, runtime package APIs, VSCode adapter seams, tests, and future host adapters.

runtime kernel 必须成为 default CLI、runtime package APIs、VSCode adapter seams、tests 和未来 host adapters 中 executable runtime work 的唯一 owner。

#### Scenario: Runtime turn delegates to kernel

- **WHEN** a caller submits a runtime turn through any exported runtime API
- **THEN** the API delegates executable work to `RuntimeKernel` and does not directly call model, capability, command, skill, hook, MCP, plugin, sandbox, scheduler, policy, workflow, or bus execution primitives outside the kernel path

#### Scenario: Legacy execution path is rejected by lint

- **WHEN** code introduces a runtime class, function, or host command that directly owns executable work outside `RuntimeKernel`
- **THEN** architecture lint fails with a stable rule id before tests can pass

### Requirement: Abort-Aware Kernel Execution

The runtime kernel SHALL propagate cancellation and timeout through abort-aware execution contexts before executor invocation and during running work.

runtime kernel 必须在 executor invocation 前和 running work 中通过 abort-aware execution contexts 传播 cancellation 和 timeout。

#### Scenario: Cancel before executor start

- **WHEN** a kernel invocation is cancelled while queued
- **THEN** the executor is never called and the canonical event stream includes scheduler cancelled, capability cancelled, and workflow closed events

#### Scenario: Timeout aborts running executor

- **WHEN** a running kernel invocation exceeds its timeout
- **THEN** the executor receives an aborted signal and the canonical event stream includes scheduler timed-out, capability cancelled or timed-out, and workflow closed events

### Requirement: Scheduler Events In Kernel Stream

The runtime kernel SHALL include scheduler lifecycle events in the same `AsyncIterable<RuntimeEvent>` returned by `execute`.

runtime kernel 必须在 `execute` 返回的同一 `AsyncIterable<RuntimeEvent>` 中包含 scheduler lifecycle events。

#### Scenario: Successful invocation includes scheduler events

- **WHEN** a governed capability completes successfully
- **THEN** the returned event stream includes scheduler queued, scheduler started, scheduler completed, capability completed, and workflow closed events in deterministic order

#### Scenario: Host does not subscribe separately

- **WHEN** CLI, VSCode, tests, or future server adapters consume a kernel invocation
- **THEN** they can render full execution state from the returned event stream without opening a separate bus subscription

### Requirement: Event Persistence Failure Semantics

The runtime kernel SHALL classify bus, session, and observability write failures with explicit execution semantics.

runtime kernel 必须为 bus、session 和 observability write failures 定义明确 execution semantics。

#### Scenario: Replayable event persistence fails closed

- **WHEN** session or bus persistence fails for a replayable kernel event
- **THEN** the kernel emits or returns a typed terminal failure and does not report the invocation as successful

#### Scenario: Observability failure is degraded

- **WHEN** observability emission fails after session and bus persistence succeed
- **THEN** the kernel records a typed degraded-observability event without hiding the failure from tests

### Requirement: Runtime Kernel First Governance Track / Runtime Kernel 第一专项治理

Runtime kernel governance SHALL be the first required child governance track in the platform hardening program.

Runtime kernel 治理必须是平台加固 program 中第一个必需专项治理轨道。

#### Scenario: Dependent work waits for kernel evidence / 依赖工作等待内核证据

- **WHEN** a change promotes host expansion, plugin execution, remote runtime, multi-agent write execution, policy enforcement, context caching, or enterprise distribution
- **THEN** it cites stable runtime kernel boundary evidence or records an explicit release-risk deferral
- **中文** 当变更推广 host expansion、plugin execution、remote runtime、多 agent 写执行、policy enforcement、context caching 或企业级分发时，必须引用稳定 runtime kernel boundary 证据，或记录显式发布风险延期。

### Requirement: Small Runtime Kernel Boundary / 小 Runtime Kernel 边界

The runtime execution kernel SHALL own only turn lifecycle, execution envelopes, policy handoff, scheduler handoff, canonical event emission, and model/tool continuation orchestration.

Runtime execution kernel 必须只负责 turn lifecycle、execution envelopes、policy handoff、scheduler handoff、canonical event emission 与 model/tool continuation orchestration。

#### Scenario: Subsystem logic stays in owner package / 子系统逻辑留在责任包

- **WHEN** runtime needs context retrieval, prompt assembly, memory/cache storage, plugin execution, MCP transport, code intelligence, provider serialization, or host rendering
- **THEN** it calls the responsible package through public contracts rather than importing private implementation logic or embedding subsystem rules in runtime
- **中文** 当 runtime 需要 context retrieval、prompt assembly、memory/cache storage、plugin execution、MCP transport、code intelligence、provider serialization 或 host rendering 时，必须通过公共契约调用责任包，而不是导入私有实现逻辑或把子系统规则嵌入 runtime。

#### Scenario: Kernel growth requires extraction plan / Kernel 增长需要拆分计划

- **WHEN** a runtime change adds new subsystem-owned behavior to central runtime files
- **THEN** the proposal or task list includes an extraction plan, owner package target, public export, and regression coverage
- **中文** 当 runtime 变更向中心 runtime 文件增加新的子系统所有行为时，proposal 或 task list 必须包含拆分计划、目标 owner package、公共导出和回归覆盖。

### Requirement: Kernel Event ABI Stability / Kernel Event ABI 稳定性

Kernel-emitted runtime events SHALL be stable, versioned, additive by default, and safe for host projection and replay.

Kernel 发出的 runtime events 必须稳定、版本化、默认 additive，并且可安全用于 host projection 与 replay。

#### Scenario: Breaking event change is governed / Breaking Event 变更受治理

- **WHEN** a change renames, removes, retypes, or changes redaction semantics for a persisted runtime event field
- **THEN** it requires OpenSpec migration or fail-closed version rejection evidence before release
- **中文** 当变更重命名、删除、重定类型或改变 persisted runtime event field 的 redaction semantics 时，发布前必须具备 OpenSpec migration 或 fail-closed version rejection 证据。

### Requirement: Stable Kernel Responsibility Set / 稳定 Kernel 职责集合

The runtime execution kernel SHALL own only turn lifecycle, execution envelopes, policy handoff, scheduler handoff, canonical event emission, and model/tool continuation orchestration.

Runtime execution kernel 必须只负责 turn lifecycle、execution envelopes、policy handoff、scheduler handoff、canonical event emission 与 model/tool continuation orchestration。

#### Scenario: Subsystem logic stays outside runtime / 子系统逻辑留在 runtime 外

- **WHEN** runtime needs context retrieval, prompt assembly, memory/cache storage, plugin execution, MCP transport, code intelligence, provider serialization, or host rendering
- **THEN** it calls the responsible package through public contracts or injected dependencies instead of importing private implementation logic
- **中文** 当 runtime 需要 context retrieval、prompt assembly、memory/cache storage、plugin execution、MCP transport、code intelligence、provider serialization 或 host rendering 时，必须通过公共契约或注入依赖调用责任包，而不是导入私有实现逻辑。

### Requirement: Kernel Dependency Boundary / Kernel 依赖边界

The runtime execution kernel SHALL reject forbidden dependency directions that couple it to apps, provider SDKs, test fakes, host APIs, or private subsystem internals.

Runtime execution kernel 必须拒绝使其耦合到 apps、provider SDK、test fakes、host APIs 或私有子系统内部实现的禁止依赖方向。

#### Scenario: Forbidden runtime import is detected / 检测到禁止 runtime import

- **WHEN** runtime code imports an app package, VSCode API, Node host-only API outside approved adapters, model SDK, testing fake, or private package path
- **THEN** lint or readiness reports a kernel-boundary diagnostic with owner, severity, and suggested extraction target
- **中文** 当 runtime 代码导入 app package、VSCode API、approved adapter 外的 Node host-only API、model SDK、testing fake 或私有 package path 时，lint 或 readiness 必须报告包含 owner、严重度与建议抽取目标的 kernel-boundary diagnostic。

### Requirement: Explicit Kernel Handoffs / 显式 Kernel Handoff

Cross-subsystem runtime interactions SHALL be represented as public contracts, injected dependencies, or stable service interfaces.

跨子系统 runtime 交互必须表现为公共契约、注入依赖或稳定 service interface。

#### Scenario: Handoff is auditable / Handoff 可审计

- **WHEN** runtime invokes policy, scheduler, context, prompt, model, tool, memory/cache, or bus behavior
- **THEN** the call path identifies the public contract or injected dependency used for the handoff
- **中文** 当 runtime 调用 policy、scheduler、context、prompt、model、tool、memory/cache 或 bus 行为时，调用路径必须识别用于 handoff 的公共契约或注入依赖。

### Requirement: Expiring Runtime Compatibility Shims / 可过期 Runtime 兼容 Shim

Runtime compatibility shims SHALL declare owner, reason, extraction target, expiration trigger, diagnostic id, and release-gate impact.

Runtime compatibility shim 必须声明 owner、原因、抽取目标、过期触发条件、diagnostic id 与发布门禁影响。

#### Scenario: Shim cannot become invisible infrastructure / Shim 不能变成隐形基础设施

- **WHEN** runtime keeps subsystem-owned behavior temporarily for compatibility
- **THEN** diagnostics list the shim and block product-ready claims that depend on it after the expiration trigger
- **中文** 当 runtime 为兼容性暂时保留子系统所有行为时，diagnostics 必须列出该 shim，并在过期触发条件后阻止依赖它的产品就绪声明。

