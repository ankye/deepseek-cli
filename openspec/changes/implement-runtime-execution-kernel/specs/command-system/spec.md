## ADDED Requirements

### Requirement: CLI Runtime Command Delegation

The CLI command system SHALL provide at least one command that delegates executable work to the runtime execution kernel.

CLI command system 必须提供至少一个 command，将 executable work 委托给 runtime execution kernel。

#### Scenario: CLI command invokes kernel

- **WHEN** a user runs the first kernel-backed CLI command
- **THEN** the command constructs or receives a runtime kernel and submits a governed invocation instead of executing the capability directly

#### Scenario: CLI handles kernel terminal events

- **WHEN** the kernel emits completed, failed, cancelled, or timeout events
- **THEN** CLI maps those events to process output and exit code without creating a separate execution lifecycle

### Requirement: CLI Stream JSON Compatibility

The CLI command system SHALL support a stream-json output mode for kernel-backed runtime events.

CLI command system 必须支持 kernel-backed runtime events 的 stream-json output mode。

#### Scenario: Stream canonical runtime events

- **WHEN** the user runs the kernel-backed command with stream-json output
- **THEN** each emitted line is a serialized canonical runtime event with stable event type and trace metadata
