## ADDED Requirements

### Requirement: Kernel-Backed Headless Runtime

The runtime event loop SHALL use the runtime execution kernel as the concrete execution owner for headless turns.

runtime event loop 必须使用 runtime execution kernel 作为 headless turns 的具体 execution owner。

#### Scenario: Headless input enters kernel

- **WHEN** a caller submits headless user input through the runtime package
- **THEN** the runtime delegates executable work to the kernel and streams the kernel's canonical events

#### Scenario: Runtime exposes kernel factory

- **WHEN** tests or adapters import the runtime package
- **THEN** they can create a deterministic kernel-backed runtime without importing CLI or VSCode packages

### Requirement: Runtime Event Ordering

The kernel-backed runtime loop SHALL emit lifecycle, envelope, policy, scheduling, execution, result, and terminal events in a stable order.

kernel-backed runtime loop 必须以稳定顺序输出 lifecycle、envelope、policy、scheduling、execution、result 和 terminal events。

#### Scenario: Successful execution order

- **WHEN** a kernel-backed capability completes successfully
- **THEN** the event stream includes request accepted, envelope created, workflow opened, policy decided, scheduled, started, output or progress, completed, and workflow closed events in order

#### Scenario: Failed execution order

- **WHEN** a kernel-backed capability fails
- **THEN** the event stream includes the same pre-execution events followed by failed and workflow closed events with typed error metadata
