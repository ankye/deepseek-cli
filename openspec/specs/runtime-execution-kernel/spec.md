# runtime-execution-kernel Specification

## Purpose
TBD - created by archiving change implement-runtime-execution-kernel. Update Purpose after archive.
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
