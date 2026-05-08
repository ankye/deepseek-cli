## ADDED Requirements

### Requirement: Headless Runtime Entry Point

The system SHALL provide a headless agent runtime API that accepts user input and returns an asynchronous stream of runtime events without requiring a terminal UI.

#### Scenario: Submit headless user input

- **WHEN** a caller submits a user input to the runtime
- **THEN** the runtime returns an `AsyncIterable` of `RuntimeEvent` values

#### Scenario: Runtime does not depend on CLI UI

- **WHEN** the runtime package is imported by a test or non-CLI adapter
- **THEN** it MUST NOT require terminal UI modules to initialize

### Requirement: Turn Lifecycle Events

The system SHALL emit structured events for session start, turn start, model output, tool requests, tool completion, turn completion, and errors.

#### Scenario: Successful turn lifecycle

- **WHEN** a model response completes without tool execution
- **THEN** the event stream includes turn start, model output, and turn completion events in order

#### Scenario: Tool turn lifecycle

- **WHEN** a model response requests a registered capability
- **THEN** the event stream includes a tool requested event before the corresponding tool completed event

### Requirement: Runtime Dependency Injection

The runtime SHALL receive model gateway, capability registry, context engine, policy engine, sandbox runtime, and session store dependencies through explicit construction or factory configuration.

#### Scenario: Mock runtime dependencies

- **WHEN** tests construct the runtime with mock dependencies
- **THEN** the runtime uses those dependencies without reading global process state

### Requirement: Separate Application Adapters

The system SHALL keep the CLI application adapter and VSCode extension adapter in separate source directories that both depend on shared runtime packages.

#### Scenario: CLI and VSCode extension are separate

- **WHEN** the framework source tree is created
- **THEN** it contains separate `src/apps/cli` and `src/apps/vscode-extension` directories

#### Scenario: Application adapters depend on runtime

- **WHEN** either application adapter needs agent behavior
- **THEN** it uses shared runtime package contracts instead of importing implementation from the other application adapter

### Requirement: Runtime Interruption Contract

The runtime SHALL expose an interruption mechanism that can cancel an in-progress turn and emit a terminal cancellation or error event.

#### Scenario: Interrupt active turn

- **WHEN** a caller interrupts an active runtime turn
- **THEN** the active turn stops and emits a final event indicating cancellation
