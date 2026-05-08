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

### Requirement: Kernel Acceptance Evidence

The first runtime kernel implementation SHALL update acceptance evidence for contracts, integration, e2e, replay, lint, and OpenSpec validation.

第一版 runtime kernel implementation 必须更新 contracts、integration、e2e、replay、lint 和 OpenSpec validation 的 acceptance evidence。

#### Scenario: Acceptance index references kernel checks

- **WHEN** acceptance evidence is regenerated
- **THEN** it includes runtime kernel contract, integration, e2e, regression, and lint results

