## ADDED Requirements

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
